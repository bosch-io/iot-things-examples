package com.bosch.iot.things.example.message.processor.utils;

import org.apache.qpid.proton.message.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class Utils {

    private static final Logger log = LoggerFactory.getLogger(Utils.class);

    public void logMessageInfo(Message msg, String address) {
        log.debug("MSG.BODY_TYPE: " + msg.getBody().getType());
        log.debug("MSG.ADDRESS: " + msg.getAddress());
        log.debug("MSG.REPLY_TO: " + msg.getReplyTo());
        log.debug("MSG.SUBJECT: " + msg.getSubject());
        log.info("message to:" + address);
        log.debug("body: " + msg.getBody().toString());
    }
}
