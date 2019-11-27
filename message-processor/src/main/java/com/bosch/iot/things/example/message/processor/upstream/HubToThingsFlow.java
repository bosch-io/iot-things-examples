package com.bosch.iot.things.example.message.processor.upstream;

import com.bosch.iot.things.example.message.processor.Constants;
import com.bosch.iot.things.example.message.processor.processing.MessageProcessingService;
import com.bosch.iot.things.example.message.processor.transport.AmqpClient;
import io.vertx.proton.*;
import org.apache.qpid.proton.message.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import static com.bosch.iot.things.example.message.processor.Constants.TIME_OUT;

@Component
public class HubToThingsFlow {

    private static final Logger log = LoggerFactory.getLogger(HubToThingsFlow.class);

    @Autowired
    private AmqpClient amqpClient;

    @Autowired
    private MessageProcessingService messageProcessingService;

    @Value(value = "${tenant.id}")
    private String tenantId;

    private Map<String, ProtonSender> hubToLocalServerSenders = new HashMap<>();

    @PostConstruct
    public void start() {
        if (amqpClient.isConnected(TIME_OUT)) {
            receiveFromHubSendToThings(amqpClient.getHubConnection());
        } else {
            log.error("Either connection to local server or connection to hub server not initialized");
        }
    }

    private void receiveFromHubSendToThings(ProtonConnection hubConnection) {
        createHubReceiver(Constants.TELEMETRY_ENDPOINT + tenantId, hubConnection);
        createHubReceiver(Constants.EVENT_ENDPOINT + tenantId, hubConnection);
        createHubReceiver(Constants.CONTROL_ENDPOINT + tenantId  + Constants.CONTROL_REPLY_ENDPOINT, hubConnection);
    }

    private void createHubReceiver(String address, ProtonConnection hubConnection) {
        ProtonReceiver hubReceiver = hubConnection.createReceiver(address);
        createHubToThingsSender(address);
        sendToThingsService(hubReceiver);
    }

    private void createHubToThingsSender(String address) {
        ProtonSender hubToThingsSender = amqpClient.getLocalConnection().createSender(address);
        hubToLocalServerSenders.put(address, hubToThingsSender);
    }

    private void sendToThingsService(ProtonReceiver hubReceiver) {
        hubReceiver.handler((delivery, msg) -> {
            String address = hubReceiver.getRemoteSource().getAddress();
            log.debug("Received message from HUB service with content: " + msg.getBody().toString());
            Message processedMessage = this.messageProcessingService.getProcessedMessage(msg);
            forwardToThings(processedMessage, address);
        }).open();
    }

    private void forwardToThings(Message message, String address) {
        ProtonSender sender = hubToLocalServerSenders.get(address);
        if (Objects.nonNull(sender)) {
            sender.open();
            log.debug("Sending message to local server");
            sender.send(message, delivery -> {
                log.info(String.format("The message was received by the local server: remote state=%s, remotely settled=%s", delivery.getRemoteState(), delivery.remotelySettled()));
            });
        } else {
            log.error(String.format("Can't forward message to local server over address: %s", address));
        }
    }
}