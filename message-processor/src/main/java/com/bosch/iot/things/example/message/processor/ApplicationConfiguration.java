package com.bosch.iot.things.example.message.processor;

import com.bosch.iot.things.example.message.processor.transport.AmqpClient;
import com.bosch.iot.things.example.message.processor.transport.AmqpServer;
import io.vertx.core.Vertx;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;

@Configuration
public class ApplicationConfiguration {

    @Bean
    public Vertx vertx() { return Vertx.vertx(); }

    @Bean
    @DependsOn("client")
    public AmqpServer server(){ return new AmqpServer(); }

    @Bean
    public AmqpClient client(){ return new AmqpClient(); }

}
