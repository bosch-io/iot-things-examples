package com.bosch.iot.things.example.message.processor.transport;

import io.vertx.core.Vertx;
import io.vertx.proton.ProtonClient;
import io.vertx.proton.ProtonClientOptions;
import io.vertx.proton.ProtonConnection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import javax.annotation.PostConstruct;
import java.util.Objects;

import static java.lang.Thread.sleep;

public class AmqpClient {

    private static final Logger log = LoggerFactory.getLogger(AmqpClient.class);

    @Autowired
    private Vertx vertx;

    @Value(value = "${hub.client.host}")
    private String hubHost;

    @Value(value = "${hub.client.port}")
    private Integer hubPort;

    @Value(value = "${hub.client.username}")
    private String hubUsername;

    @Value(value = "${hub.client.password}")
    private String hubPassword;

    @Value(value = "${local.client.host}")
    private String localHost;

    @Value(value = "${local.client.port}")
    private Integer localPort;

    private ProtonClient localClient;
    private ProtonConnection localConnection;
    private ProtonClient hubClient;
    private ProtonConnection hubConnection;


    @PostConstruct
    private void start() {
        setLocalClient(ProtonClient.create(vertx));
        setHubClient(ProtonClient.create(vertx));
        connectLocalClient(localClient);
        connectHubClient(hubClient);
    }

    private void connectLocalClient(ProtonClient localClient) {
        localClient.connect(localHost, localPort, res -> {
            if (res.succeeded()) {
                log.info("We're connected to local AMQP server! " + res.result().getHostname());
                setLocalConnection(res.result());
                localConnection.open();
            } else {
                log.error("Error connecting to local AMQP server!");
                res.cause().printStackTrace();
            }
        });
    }

    private void connectHubClient(ProtonClient hubClient) {
        hubClient.connect(new ProtonClientOptions().setSsl(Boolean.TRUE), hubHost, hubPort, hubUsername, hubPassword, res -> {
            if (res.succeeded()) {
                log.info("We're connected to Hub server!");
                setHubConnection(res.result());
                hubConnection.open();
            } else {
                log.error("Error connecting to Hub server!");
                res.cause().printStackTrace();
            }
        });
    }

    public boolean isConnected(int timeout) {
        try {
            while (timeout > 0 && (Objects.isNull(this.getLocalConnection()) || Objects.isNull(this.getHubConnection()))) {
                sleep(100);
                timeout -= 100;
            }
        } catch (Throwable throwable) {
            throwable.printStackTrace();
        }
        return Objects.nonNull(this.getLocalConnection()) && Objects.nonNull(this.getHubConnection());
    }

    public ProtonClient getLocalClient() {
        return localClient;
    }

    private void setLocalClient(ProtonClient localClient) {
        this.localClient = localClient;
    }

    public ProtonConnection getLocalConnection() {
        return localConnection;
    }

    private void setLocalConnection(ProtonConnection localConnection) {
        this.localConnection = localConnection;
    }

    public ProtonClient getHubClient() {
        return hubClient;
    }

    private void setHubClient(ProtonClient hubClient) {
        this.hubClient = hubClient;
    }

    public ProtonConnection getHubConnection() {
        return hubConnection;
    }

    private void setHubConnection(ProtonConnection hubConnection) {
        this.hubConnection = hubConnection;
    }

}
