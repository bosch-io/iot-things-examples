package com.bosch.iot.things.example.message.processor.downstream;

import com.bosch.iot.things.example.message.processor.Constants;
import com.bosch.iot.things.example.message.processor.processing.MessageProcessor;
import com.bosch.iot.things.example.message.processor.transport.AmqpClient;
import io.vertx.proton.*;
import org.apache.qpid.proton.message.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

import static com.bosch.iot.things.example.message.processor.Constants.COMMAND_ENDPOINT;
import static com.bosch.iot.things.example.message.processor.Constants.TIME_OUT;

@Component
public class ThingsToHubFlow {

    private static final Logger log = LoggerFactory.getLogger(ThingsToHubFlow.class);

    @Autowired
    private volatile AmqpClient amqpClient;

    @Autowired
    private MessageProcessor messageProcessingService;

    @Value(value = "${tenant.id}")
    private String tenantId;

    @PostConstruct
    private void start() {
        if (amqpClient.isConnected(TIME_OUT)) {
            receiveFromThingsSentToHub();
        } else {
            log.error("Either connection to local server or connection to hub server not initialized");
        }
    }

    private void receiveFromThingsSentToHub() {
        ProtonConnection localConnection = amqpClient.getLocalConnection();
        ProtonReceiver receiver = localConnection.createReceiver(Constants.COMMAND_ENDPOINT + tenantId);
        receiver.handler((delivery, msg) -> {
            log.debug("Received command message with content: " + msg.getBody().toString());
            Message processedMessage = this.messageProcessingService.decrypt(msg);
            forwardToHub(amqpClient.getHubConnection(), processedMessage);
        }).open();
    }

    private void forwardToHub(ProtonConnection hubConnection, Message msg) {
        ProtonSender sender = hubConnection.createSender(COMMAND_ENDPOINT + tenantId);
        sender.open();
        sender.send(msg, delivery -> {
            log.info(String.format("The message was received by the HUB service: remote state=%s, remotely settled=%s",
                    delivery.getRemoteState(), delivery.remotelySettled()));
        });
    }
}
