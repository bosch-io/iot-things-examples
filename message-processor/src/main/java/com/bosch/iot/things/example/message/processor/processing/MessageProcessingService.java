package com.bosch.iot.things.example.message.processor.processing;

import org.apache.qpid.proton.amqp.Binary;
import org.apache.qpid.proton.amqp.messaging.AmqpValue;
import org.apache.qpid.proton.amqp.messaging.Data;
import org.apache.qpid.proton.amqp.messaging.Section;
import org.apache.qpid.proton.message.Message;
import org.springframework.stereotype.Service;

@Service
public class MessageProcessingService implements MessageProcessor{

    @Override
    public Message encrypt(Message message) { return getProcessedMessage(message); }

    @Override
    public Message decrypt(Message message) { return getProcessedMessage(message); }

    public Message getProcessedMessage(Message message) {
        Section body = message.getBody();
        if (body instanceof Data) {
            String msgString = ((Data) body).getValue().toString();
            //Simple modification of payload
            String modifiedBody = msgString.replaceAll("60", "70");
            message.setBody((new Data(new Binary(modifiedBody.getBytes()))));
        } else if (body instanceof AmqpValue) {
            String msgString = ((AmqpValue) body).getValue().toString();
            //Simple modification of payload
            String modifiedBody = msgString.replaceAll("60", "70");
            message.setBody(new AmqpValue(modifiedBody));
        }
        return message;
    }
}
