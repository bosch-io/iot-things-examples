package com.bosch.iot.things.example.message.processor.processing;

import org.apache.qpid.proton.message.Message;

public interface MessageProcessor {
    Message encrypt(Message message);

    Message decrypt(Message message);
}
