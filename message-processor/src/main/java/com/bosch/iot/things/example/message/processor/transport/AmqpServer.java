package com.bosch.iot.things.example.message.processor.transport;

import com.bosch.iot.things.example.message.processor.downstream.ThingsToHubFlow;
import com.bosch.iot.things.example.message.processor.upstream.HubToThingsFlow;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.Vertx;
import io.vertx.proton.ProtonConnection;
import io.vertx.proton.ProtonSender;
import io.vertx.proton.ProtonServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class AmqpServer {

    private static final Logger log = LoggerFactory.getLogger(AmqpServer.class);

    @Autowired
    private Vertx vertx;

    @Autowired
    private HubToThingsFlow hubToThingsFlow;

    @Autowired
    private ThingsToHubFlow thingsToHubFlow;

    @Autowired
    private AmqpClient amqpClient;

    @Value(value = "${local.server.port}")
    private Integer localPort;

    private ProtonServer localServer;
    private ProtonConnection connection;
    private Map<String, ProtonSender> thingsSenders = new HashMap<>();
    private Set<String> thingsReceiverAddresses = new HashSet<>();

    @PostConstruct
    private void start() {
        // Create the Vert.x AMQP server instance
        setLocalServer(ProtonServer.create(vertx));
        listen();
    }

    private void listen(){
        localServer.connectHandler((connection) -> {
            setConnection(connection);
            handleConnection(connection);
        }).listen(localPort,(res) -> {
            if (res.succeeded()) {
                log.info("Listening on: " + res.result().actualPort());
            } else {
                log.error("Error while starting local AMQP server!");
                log.error(res.cause().getMessage());
            }
        });
    }

    private void handleConnection(ProtonConnection connection) {
        Future<ProtonConnection> connectionSetUp = connectionHandler(connection)
                .compose(c -> connectionSenderHandler(connection))
                .compose(c -> connectionReceiverHandler(connection))
                .compose(c -> amqpClient.requestHubConnection());
        connectionSetUp.setHandler(res ->{
            if (res.succeeded()) {
                hubToThingsFlow.init(thingsSenders);
                thingsToHubFlow.init(thingsReceiverAddresses);
            }
        });
    }

    private Future<ProtonConnection> connectionHandler(ProtonConnection connection) {
        Promise<ProtonConnection> connectionOpenPromise = Promise.promise();
        connection.openHandler(res -> {
            log.info("Client connected: " + connection.getRemoteContainer());
            connection.open();
            connectionOpenPromise.complete();
        }).closeHandler(c -> {
            log.info("Client closing amqp connection: " + connection.getRemoteContainer());
            connection.close();
            connection.disconnect();
            amqpClient.disconnectFromHub();
        }).disconnectHandler(c -> {
            log.info("Client socket disconnected: " + connection.getRemoteContainer());
            connection.disconnect();
            amqpClient.disconnectFromHub();
        }).sessionOpenHandler(session -> session.open());
        return connectionOpenPromise.future();
    }

    private Future<ProtonConnection> connectionReceiverHandler(ProtonConnection connection) {
        Promise<ProtonConnection> receiverPromise = Promise.promise();
        connection.receiverOpenHandler(receiver -> {
            String address = receiver.getRemoteTarget().getAddress();
            log.info("Receiving from: " + address);
            receiver.setTarget(receiver.getRemoteTarget())
                    .handler((delivery, msg) -> {
                        thingsToHubFlow.forwardToHub(msg, address);
                    }).open();
            thingsReceiverAddresses.add(address);
            receiverPromise.complete();
        });
        return receiverPromise.future();
    }

    private Future<ProtonConnection> connectionSenderHandler(ProtonConnection connection) {
        Promise<ProtonConnection> senderPromise = Promise.promise();
        connection.senderOpenHandler(sender -> {
            String senderAddress = sender.getRemoteSource().getAddress();
            log.info("Sending to client from: " + senderAddress);
            sender.setSource(sender.getRemoteSource());
            sender.open();
            thingsSenders.put(senderAddress, sender);
            senderPromise.complete();
        });
        return senderPromise.future();
    }

    public ProtonServer getLocalServer() {
        return localServer;
    }

    private void setLocalServer(ProtonServer server) {
        localServer = server;
    }

    public ProtonConnection getConnection() {
        return connection;
    }

    private void setConnection(ProtonConnection connection) {
        this.connection = connection;
    }
}
