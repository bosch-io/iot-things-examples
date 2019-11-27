package com.bosch.iot.things.example.message.processor.transport;

import io.vertx.core.Vertx;
import io.vertx.proton.ProtonConnection;
import io.vertx.proton.ProtonSender;
import io.vertx.proton.ProtonServer;
import org.apache.qpid.proton.message.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

import static com.bosch.iot.things.example.message.processor.Constants.CONTROL_ENDPOINT;
import static com.bosch.iot.things.example.message.processor.Constants.CONTROL_REPLY_ENDPOINT;

public class AmqpServer {

    private static final Logger log = LoggerFactory.getLogger(AmqpServer.class);

    @Autowired
    private Vertx vertx;

    @Value(value = "${tenant.id}")
    private String tenantId;

    @Value(value = "${local.client.port}")
    private Integer localPort;

    private ProtonServer localServer;

    private ProtonConnection connection;

    private Map<String, ProtonSender> senders = new HashMap<>();

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
                res.cause().printStackTrace();
            }
        });
    }

    private void handleConnection(ProtonConnection connection) {
        connectionHandler(connection);
        connectionReceiverHandler(connection);
        connectionSenderHandler(connection);
    }

    public void connectionHandler(ProtonConnection connection) {
        connection.openHandler(res -> {
            log.info("Client connected: " + connection.getRemoteContainer());
            connection.open();
        }).closeHandler(c -> {
            log.info("Client closing amqp connection: " + connection.getRemoteContainer());
            connection.close();
            connection.disconnect();
        }).disconnectHandler(c -> {
            log.info("Client socket disconnected: " + connection.getRemoteContainer());
            connection.disconnect();
        }).sessionOpenHandler(session -> session.open());
    }

    private void connectionReceiverHandler(ProtonConnection connection) {
        connection.receiverOpenHandler(receiver -> {
            log.info("Receiving from: " + receiver.getRemoteTarget().getAddress());
            receiver.setTarget(receiver.getRemoteTarget())
                    .handler((delivery, msg) -> {
                        String address = receiver.getRemoteTarget().getAddress();
                        logMessageInfo(msg, address);
                        sendMessage(msg, address);
                    }).open();
        });
    }

    private void logMessageInfo(Message msg, String address) {
        log.debug("MSG.BODY_TYPE: " + msg.getBody().getType());
        log.debug("MSG.ADDRESS: " + msg.getAddress());
        log.debug("MSG.REPLY_TO: " + msg.getReplyTo());
        log.debug("MSG.SUBJECT: " + msg.getSubject());
        log.info("message to:" + address);
        log.debug("body: " + msg.getBody().toString());
    }

    private void sendMessage(Message msg, String address) {
        if (address.startsWith(CONTROL_ENDPOINT) && !address.endsWith(CONTROL_REPLY_ENDPOINT)) {
            forwardToHubService(msg, CONTROL_ENDPOINT + tenantId);
        } else {
            forwardToThingsService(msg, address);
        }
    }

    private void forwardToHubService(Message msg, String address) {
        ProtonSender sender = senders.get(address);
        log.debug("Sending message to HUB service");
        log.debug("payload: " + msg.getBody().toString());
        sender.send(msg, delivery -> {
            log.info(String.format("The message was received by the local client : remote state=%s, remotely settled=%s message format=%d",
                    delivery.getRemoteState(), delivery.remotelySettled(), delivery.getMessageFormat()));
        });
    }
    private void forwardToThingsService(Message msg, String address) {
        ProtonSender sender = senders.get(address);
        log.debug("Sending message to THINGS service");
        log.debug("payload: " + msg.getBody().toString());
        sender.send(msg, delivery -> {
            log.info(String.format("The message was received by THINGS service : remote state=%s, remotely settled=%s message format=%d",
                    delivery.getRemoteState(), delivery.remotelySettled(), delivery.getMessageFormat()));
        });
    }

    private void connectionSenderHandler(ProtonConnection connection) {
        connection.senderOpenHandler(sender -> {
            String senderAddress = sender.getRemoteSource().getAddress();
            log.info("Sending to client from: " + senderAddress);
            sender.setSource(sender.getRemoteSource());
            sender.open();
            senders.put(senderAddress, sender);
        });
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
