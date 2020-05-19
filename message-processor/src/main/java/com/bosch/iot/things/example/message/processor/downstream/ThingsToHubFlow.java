package com.bosch.iot.things.example.message.processor.downstream;

import com.bosch.iot.things.example.message.processor.processing.MessageProcessor;
import com.bosch.iot.things.example.message.processor.transport.AmqpClient;
import com.bosch.iot.things.example.message.processor.utils.Utils;
import io.vertx.proton.ProtonSender;
import org.apache.qpid.proton.message.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Component
public class ThingsToHubFlow {

    private static final Logger log = LoggerFactory.getLogger(ThingsToHubFlow.class);

    @Autowired
    private volatile AmqpClient amqpClient;

    @Autowired
    private Utils utils;

    @Autowired
    private MessageProcessor messageProcessingService;

    private Map<String, ProtonSender> hubSenders = new HashMap<>();

    public void init(Set<String> thingsReceiverAddresses) {
        thingsReceiverAddresses.forEach(address -> {
            ProtonSender hubSender = amqpClient.getHubConnection().createSender(address);
            hubSender.open();
            hubSenders.put(address, hubSender);
            log.info("Hub sender created for: " + address);
        });
    }

    public void forwardToHub(Message msg, String address) {
        log.debug("Sending message to HUB service");
        Message processedMessage = this.messageProcessingService.decrypt(msg);
        utils.logMessageInfo(msg, address);
        ProtonSender hubSender = hubSenders.get(address);
        hubSender.send(processedMessage, delivery -> {
            log.info(String.format("The message was received by the HUB service: remote state=%s, remotely settled=%s",
                    delivery.getRemoteState(), delivery.remotelySettled()));
        });
    }
}
