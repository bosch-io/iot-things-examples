package com.bosch.iot.things.examples;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.eclipse.ditto.json.JsonArray;
import org.eclipse.ditto.json.JsonArrayBuilder;
import org.eclipse.ditto.json.JsonFactory;
import org.eclipse.ditto.json.JsonObject;
import org.eclipse.ditto.json.JsonValue;
import org.eclipse.ditto.signals.commands.things.exceptions.ThingConflictException;
import org.eclipse.ditto.signals.commands.things.exceptions.ThingNotCreatableException;
import org.eclipse.ditto.signals.commands.things.exceptions.ThingNotModifiableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.bosch.iot.things.clientapi.twin.Twin;

public class BatchImporter {

    private static final Logger LOGGER = LoggerFactory.getLogger(BatchImporter.class);

    private static final int NUM_OF_THREADS = 4;
    private static final String RETRY_FILE = "retryFile.txt";
    private static final String COMPLETED_FILES = "completedFiles.txt";
    private static final String ERROR_FILE = "errorFile.txt";
    private static final String TMP_FILE_SUFFIX = "-tmpFile.txt";
    private static final String SEPARATOR = "#";
    private static final Semaphore mutexRetryFile = new Semaphore(1);
    private static final Semaphore mutexCompletedFile = new Semaphore(1);
    private static final Semaphore mutexErrorFile = new Semaphore(1);

    private static Path uploadedFilesPath;
    private static Path retryFilePath;
    private static Path errorFilePath;
    private static CountDownLatch countDownLatch;
    private static ThingsWebsocketClient websocketClient;
    private static Twin twin;
    private static ForkJoinPool forkJoinPool;

    public static void main(String[] args) throws InterruptedException {

        final int numOfCores = Runtime.getRuntime().availableProcessors() / 8;

        retryFilePath = createFile(RETRY_FILE);
        errorFilePath = createFile(ERROR_FILE);

        final List<File> listWithFiles = getFilesToParse(args);
        final List<File> fileList = checkForCompletedFiles(listWithFiles);
        final int numberOfFiles = fileList.size();
        countDownLatch = new CountDownLatch(numberOfFiles + 1); //+retryFile

        initWebsocketClient();

        forkJoinPool = new ForkJoinPool(numOfCores);

        if (numberOfFiles > numOfCores) {
            while (!fileList.isEmpty()) {
                final List<File> subList;
                if (fileList.size() < numOfCores) {
                    subList = fileList.subList(0, fileList.size());
                } else {
                    subList = fileList.subList(0, numOfCores);
                }
                uploadFiles(subList);
                fileList.removeAll(subList);
            }
        } else {
            uploadFiles(fileList);
        }

        checkForRetryFile();
        removeDuplicateErrorsInErrorFile();
        countDownLatch.await();
        forkJoinPool.shutdown();
        websocketClient.terminate();
        System.exit(0);
    }

    private static void checkForRetryFile() {
        try (final Stream<String> lines = Files.lines(retryFilePath)) {

            final Path tmpFile = createFile("tmpFile.txt");
            final List<String> thingList = new ArrayList<>();
            lines.map(line -> {
                final String[] split = line.split(SEPARATOR);
                return split[0];
            }).distinct().forEach(thingList::add);

            if (thingList.isEmpty()) {
                deleteFile(tmpFile);
                countDownLatch.countDown();
                return;
            }

            deleteFile(retryFilePath);
            Files.write(tmpFile, thingList);
            createFile(retryFilePath.toFile().getName());
            uploadThingsInFile(tmpFile.toFile());
            deleteFile(tmpFile);

        } catch (IOException e) {
            LOGGER.error("Exception during read of retryFile '{}' - {}", retryFilePath.toFile().getName(),
                    e.getMessage());
        }
        try (final Stream<String> stream = Files.lines(retryFilePath)) {
            if (stream.count() > 0) {
                LOGGER.error("Not all Things could be uploaded. " +
                        "The 'retryFile.txt' contains all Things and reasons why they couldn't be uploaded!");
            }
        } catch (IOException e) {
            LOGGER.error("Exception during read of retryFile '{}' - {}", retryFilePath.toFile().getName(),
                    e.getMessage());
        }
        countDownLatch.countDown();
    }

    private static List<File> checkForCompletedFiles(final List<File> listWithFiles) {
        List<File> files = listWithFiles;
        final Path filePath = Paths.get(COMPLETED_FILES);

        if (filePath.toFile().exists()) {
            try (final Stream<String> list = Files.readAllLines(filePath).stream()) {
                final List<String> fileNames = listWithFiles.stream()
                        .map(File::getName)
                        .collect(Collectors.toList());
                fileNames.removeAll(new ArrayList<>(list.collect(Collectors.toList())));

                files = listWithFiles.stream()
                        .filter(file -> fileNames.contains(file.getName()))
                        .collect(Collectors.toList());

                if (files.isEmpty()) {
                    LOGGER.info("Already uploaded all files!");
                }
            } catch (IOException e) {
                LOGGER.error("Exception during file processing '{}'", e);
            }
        }
        uploadedFilesPath = createFile(COMPLETED_FILES);

        return files;
    }

    private static void uploadFiles(final List<File> fileList) {

        try {
            forkJoinPool.submit(() -> fileList.parallelStream()
                    .forEach(file -> {
                        uploadThingsInFile(file);
                        addFileToUploadedFiles(file.getName());
                    })).get();
        } catch (InterruptedException | ExecutionException e) {
            LOGGER.error("An exception occurred - {}", e.getMessage());
            if (e.getClass().equals(InterruptedException.class)) {
                Thread.currentThread().interrupt();
            }
            System.exit(-1);
        }
    }

    private static void uploadThingsInFile(final File fileToParse) {

        LOGGER.info("Beginning to upload things ...");

        final String lastIndexStr = checkForPreviousRunForFile(fileToParse.getName());

        final String tmpFileName = fileToParse.getName()
                .substring(0, fileToParse.getName().lastIndexOf('.'))
                .concat(TMP_FILE_SUFFIX);
        final Path pathToTmpFile = createFile(tmpFileName);

        int lastIndex;
        long numLinesInFile;
        final long readAndUploadAtOnce = 1000; // things to upload at once

        try (final Stream<String> lines = Files.lines(fileToParse.toPath())) {
            numLinesInFile = lines.count();
            if (lastIndexStr.equals("")) {
                lastIndex = 0;
            } else {
                lastIndex = Integer.parseInt(lastIndexStr);
            }

            for (int i = lastIndex; i < numLinesInFile; i += readAndUploadAtOnce) {
                final long lastLines = numLinesInFile - i;
                final long limit = (lastLines < readAndUploadAtOnce) ? lastLines : readAndUploadAtOnce;
                LOGGER.info("Parsing things #{} to #{} for file '{}'", i, i + limit, fileToParse.getName());
                JsonArray jsonArray = getLinesAsArray(fileToParse, i, limit);
                LOGGER.info("Parsing is done - now uploading things #{} to #{} ", i, i + limit);

                uploadThingsViaClient(jsonArray, pathToTmpFile, i);
                jsonArray = null; // try to avoid OutOfMemoryException
            }
        } catch (IOException e) {
            LOGGER.error("Error during File access!");
            System.exit(-1);
        }
    }

    private static void uploadThingsViaClient(final JsonValue jsonArray, final Path pathToTmpFile,
            final int index) {

        LOGGER.info("Beginning to upload things ...");

        final ExecutorService executorService = Executors.newFixedThreadPool(NUM_OF_THREADS);
        final AtomicInteger lineCounter = new AtomicInteger(index);

        jsonArray.asArray().forEach(jsonValue -> {
                    try {
                        twin.create((JsonObject) jsonValue).whenCompleteAsync((thing, throwable) -> {
                            if (throwable != null) {
                                final String errorMessage = throwable.getCause().getMessage();
                                if (throwable.getCause().getClass().equals(ThingConflictException.class) ||
                                        throwable.getCause().getClass().equals(ThingNotCreatableException.class) ||
                                        throwable.getCause().getClass().equals(ThingNotModifiableException.class)) {
                                    addErrorToErrorFile(errorMessage);
                                    LOGGER.error("Error creating thing - throwable: '{}' - cause: '{}' - errorMessage: '{}'",
                                            throwable, throwable.getCause(), errorMessage);
                                } else {
                                    addThingToRetryFile(jsonValue, errorMessage);
                                }
                            } else {
                                addIndexToTmpFile(pathToTmpFile, lineCounter.incrementAndGet());
                                thing.getId().ifPresent(thingId ->
                                        LOGGER.info("Thing with Id '{}' was created successfully!", thingId));
                            }
                        }, executorService).get(45, TimeUnit.SECONDS);
                    } catch (InterruptedException | ExecutionException | TimeoutException e) {
                        LOGGER.error("An error occurred - Exception: {} - {}", e, e.getMessage());
                        if (e.getClass().equals(InterruptedException.class)) {
                            Thread.currentThread().interrupt();
                            System.exit(-1);
                        } else {
                            addThingToRetryFile(jsonValue, e.getMessage());
                        }
                    }
                }
        );
        waitSecs(5);

        deleteFile(pathToTmpFile);
        countDownLatch.countDown();
        LOGGER.info("Uploaded all things ...");
        executorService.shutdown();

    }

    private static List<File> getFilesToParse(final String[] args) {
        List<File> fileList = null;
        final String directory = getDirectory(args);

        try (final Stream<Path> pathStream = Files.walk(Paths.get(directory))) {
            fileList = pathStream
                    .filter(Files::isRegularFile)
                    .map(Path::toFile)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            LOGGER.error(e.getMessage());
            System.exit(-1);
        }
        if (fileList.isEmpty()) {
            LOGGER.info("No files found in directory '{}'!", directory);
            System.exit(0);
        }
        return fileList;
    }

    private static String getDirectory(final String[] args) {
        if (args.length <= 0 || args.length > 1) {
            LOGGER.info(
                    "Specify exactly one parameter with the absolute path to the directory where the files are stored which should be uploaded!");
            System.exit(-1);
        } else {
            LOGGER.info("Directory to use for batch import '{}'", args[0]);
        }
        return args[0];
    }

    private static Path createFile(final String fileName) {
        final Path filePath = Paths.get(fileName);
        try {
            if (filePath.toFile().exists()) {
                LOGGER.info("File '{}' already exists!", fileName);
            } else {
                LOGGER.info("File '{}' was created!", fileName);
                Files.createFile(filePath);
            }
        } catch (IOException e) {
            LOGGER.error("Exception during creation of File '{}' - {}", fileName, e.getMessage());
            System.exit(-1);
        }
        return filePath;
    }

    private static void addIndexToTmpFile(final Path pathToTmpFile, final int index) {
        try {
            Files.write(pathToTmpFile, Collections.singletonList(String.valueOf(index)));
        } catch (IOException e) {
            LOGGER.error("Exception during write to TmpFile '{}'", e.getMessage());
        }
    }

    private static void addFileToUploadedFiles(final String name) {
        try {
            mutexCompletedFile.acquire();
            Files.write(uploadedFilesPath, Collections.singletonList(name), StandardOpenOption.APPEND);
            mutexCompletedFile.release();
        } catch (InterruptedException | IOException e) {
            LOGGER.error("Exception during write to CompletedFile '{}' - {}", uploadedFilesPath.toFile().getName(),
                    e.getMessage());
            if (e.getClass().equals(InterruptedException.class)) {
                Thread.currentThread().interrupt();
                System.exit(-1);
            }
        }
    }

    private static void addThingToRetryFile(final JsonValue jsonValue, final String errorMessage) {
        try {
            mutexRetryFile.acquire();
            Files.write(retryFilePath, Collections.singletonList(jsonValue.toString() + SEPARATOR + errorMessage),
                    StandardOpenOption.APPEND);
            mutexRetryFile.release();
        } catch (InterruptedException | IOException e) {
            LOGGER.error("Exception during write to retryFile '{}' - {}", retryFilePath.toFile().getName(),
                    e.getMessage());
            if (e.getClass().equals(InterruptedException.class)) {
                Thread.currentThread().interrupt();
                System.exit(-1);
            }
        }
    }

    private static void addErrorToErrorFile(final String errorMessage) {
        try {
            mutexErrorFile.acquire();
            Files.write(errorFilePath, Collections.singletonList(errorMessage), StandardOpenOption.APPEND);
            mutexErrorFile.release();
        } catch (InterruptedException | IOException e) {
            LOGGER.error("Exception during write to errorFile '{}' - {}", errorFilePath.toFile().getName(),
                    e.getMessage());
            if (e.getClass().equals(InterruptedException.class)) {
                Thread.currentThread().interrupt();
                System.exit(-1);
            }
        }
    }

    private static String checkForPreviousRunForFile(final String fileName) {
        String lastIndex = "";
        final String fName = fileName.substring(0, fileName.lastIndexOf('.')) + TMP_FILE_SUFFIX;
        final Path completedFilePath = Paths.get(fName);
        if (completedFilePath.toFile().exists()) {
            try (final Stream<String> streamList = Files.readAllLines(completedFilePath).stream()) {
                final Optional<String> firstLine = streamList.findFirst();
                if (firstLine.isPresent()) {
                    lastIndex = firstLine.get();
                } else {
                    LOGGER.error("TmpFile '{}' was empty! Please restart the importer tool again.", fName);
                    deleteFile(completedFilePath);
                    System.exit(-1);
                }
            } catch (IOException e) {
                LOGGER.error("Exception during read from TmpFile '{}' - {}", fName, e.getMessage());
            }
        }
        return lastIndex;
    }

    private static void removeDuplicateErrorsInErrorFile() {
        try (final Stream<String> linesWithDuplicates = Files.lines(errorFilePath)) {
            final List<String> stringList = linesWithDuplicates.distinct().collect(Collectors.toList());
            Files.write(errorFilePath, stringList, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) {
            LOGGER.error("Exception during read from file '{}' - {}", errorFilePath.toFile().getName(), e.getMessage());
        }
    }

    private static void deleteFile(final Path pathToFile) {
        try {
            Files.delete(pathToFile);
            LOGGER.info("File '{}' was deleted ...", pathToFile.toFile().getName());
        } catch (IOException e) {
            LOGGER.error("Exception during deletion of file '{}' - {}", pathToFile.toFile().getName(),
                    e.getMessage());
        }
    }

    private static JsonArray getLinesAsArray(final File fileToParse, long skip, long limit) {
        final JsonArrayBuilder jsonArrayBuilder = JsonArray.newBuilder();
        try (final Stream<String> lines = Files.lines(fileToParse.toPath())) {
            lines.skip(skip).limit(limit)
                    .map(JsonFactory::readFrom)
                    .forEach(jsonArrayBuilder::add);
        } catch (IOException e) {
            LOGGER.error("Exception during read from file '{}' - {}", fileToParse.getName(), e.getMessage());
        }
        return jsonArrayBuilder.build();
    }

    private static void initWebsocketClient() {
        websocketClient = new ThingsWebsocketClient();
        twin = websocketClient.getTwin();
    }

    private static void waitSecs(final long secs) {
        try {
            TimeUnit.SECONDS.sleep(secs);
        } catch (final InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }
}
