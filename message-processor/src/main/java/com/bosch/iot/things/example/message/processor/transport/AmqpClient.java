package com.bosch.iot.things.example.message.processor.transport;

import io.vertx.core.Future;
import io.vertx.core.Promise;
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

public class AmqpClient {

    private static final Logger log = LoggerFactory.getLogger(AmqpClient.class);

    @Autowired
    private Vertx vertx;

    @Value(value = "${hub.host}")
    private String hubHost;

    @Value(value = "${hub.port}")
    private Integer hubPort;

    @Value(value = "${hub.username}")
    private String hubUsername;

    @Value(value = "${hub.password}")
    private String hubPassword;

    private ProtonClient hubClient;
    private ProtonConnection hubConnection;

    @PostConstruct
    private void start() {
        setHubClient(ProtonClient.create(vertx));
    }

    private Future<ProtonConnection> connectHubClient() {
        Promise<ProtonConnection> promise = Promise.promise();
        hubClient.connect(new ProtonClientOptions().setSsl(Boolean.TRUE), hubHost, hubPort, hubUsername, hubPassword, res -> {
            if (res.succeeded()) {
                log.info("Connected to Hub server!");
                setHubConnection(res.result());
                hubConnection.open();
                promise.complete();
            } else {
                log.error(String.format("Error connecting to Hub server! Cause - %s", res.cause().getMessage()));
                promise.fail(res.cause());
            }
        });
        return promise.future();
    }

    public Future<ProtonConnection> requestHubConnection() {
        if (Objects.isNull(this.getHubConnection())) {
            return this.connectHubClient();
        }
        return Future.succeededFuture();
    }

    public void disconnectFromHub() {
        if (Objects.nonNull(this.getHubConnection()) && !this.getHubConnection().isDisconnected()) {
            getHubConnection().close().disconnect();
            setHubConnection(null);
            log.info("Disconnected from Hub server!");
        }
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
