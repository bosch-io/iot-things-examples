package com.bosch.iot.things.example.message.processor.upstream;

import com.bosch.iot.things.example.message.processor.processing.MessageProcessor;
import com.bosch.iot.things.example.message.processor.transport.AmqpClient;
import com.bosch.iot.things.example.message.processor.utils.Utils;
import io.vertx.proton.ProtonReceiver;
import io.vertx.proton.ProtonSender;
import org.apache.qpid.proton.message.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class HubToThingsFlow {

    private static final Logger log = LoggerFactory.getLogger(HubToThingsFlow.class);

    @Autowired
    private AmqpClient amqpClient;

    @Autowired
    private Utils utils;

    @Autowired
    private MessageProcessor messageProcessingService;

    public void init(Map<String, ProtonSender> thingsSenders) {
        thingsSenders.entrySet().stream().forEach(entry -> forwardToThings(entry.getKey(), entry.getValue()));
    }

    public void forwardToThings(String address, ProtonSender thingsSender) {
        ProtonReceiver hubReceiver = createHubReceiver(address);
        log.info("Hub receiver created for:" + address);
        sendToThingsService(hubReceiver, thingsSender);
    }

    private ProtonReceiver createHubReceiver(String address) {
        return amqpClient.getHubConnection().createReceiver(address);
    }

    private void sendToThingsService(ProtonReceiver hubReceiver, ProtonSender thingsSender) {
        hubReceiver.handler((delivery, msg) -> {
            log.debug("Received message from HUB service with content: " + msg.getBody().toString());
            Message processedMessage = this.messageProcessingService.encrypt(msg);
            send(processedMessage, thingsSender);
        }).open();
    }

    private void send(Message message, ProtonSender sender) {
        log.debug("Sending message to THINGS service");
        String address = sender.getRemoteSource().getAddress();
        utils.logMessageInfo(message, address);
        sender.send(message, delivery -> {
            log.info(String.format("The message was received by the THINGS service: remote state=%s, remotely settled=%s",
                    delivery.getRemoteState(), delivery.remotelySettled()));
        });
    }
}