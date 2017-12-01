# Bosch IoT Things - Example JWT Authentication

This example shows how to create a simple user interface to authenticate with OpenID Connect and use JSON Web Tokens (JWT) to access your things.

# Create a Solution

<a href="https://things.apps.bosch-iot-cloud.com/dokuwiki/doku.php?id=002_getting_started:booking:booking">Book the Bosch IoT Things cloud service</a>


# Configure your API Token and other settings

Create or adjust file "src/main/resources/config.properties"

```
thingsServiceEndpointUrl=https://things.apps.bosch-iot-cloud.com
apiToken=### your Bosch IoT Things Solution API Token ###
http.proxyHost=### your http proxy host, if you need one ###
http.proxyPort=### your http proxy port, if you need one ###
http.proxyEnabled=false
im.clientId=### your im client id ###
im.clientSecret=### your im client secret ###
im.serviceUrl=https://permissions-api.apps.bosch-iot-cloud.com
im.defaultTenant=### your im tenant ###
google.clientId=### your google client id ###
google.clientSecret=### your google client secret ###
google.redirectUrl=### your google oauth callback url - should end with /oauth2callback/google or the endpoint must be changed in OAuthCallbackServlet.java ###
secureCookie=true
```

# Register your demo application at Google

Only works if your application is available on the internet.

Go to <https://console.developers.google.com> and login with your google account and create a new project for your application.
Register "Authorised redirect URIs" ```https://your-app.your-domain/oauth2callback/google```.

# Build

Use the following maven command to build the server:
```
mvn clean package
```

# Run Server

Use the following command to run the server.
```
java -jar target/jwt-authentication.jar
```

# Usage

Browse to the Bosch IoT Things Dashboard: <https://things.apps.bosch-iot-cloud.com/> to create a demo user.

Browse to the example web app: <http://localhost:8080/jwt-authentication/> and click on "Create" in the UI to create an empty Thing.

# License

See the iot-things-examples top level README.md file for license details.