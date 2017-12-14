
# openid-browser-automation

Example application to automate a browser-based login for a _Bosch Account_ to get OpenId Connect JWT token without human interaction.

**IMPORTANT:**
This example tool does only communicate with the official Bosch endpoints https://identity.bosch.com and https://accounts.bosch.com  
No secret information will be sent to any other 3rd-party endpoint.

**PROVIDED ONLY AS EXAMPLE FOR DEVELOPMENT - DO NOT USE IN PRODUCTION!**

## Prerequisites

Install [node](https://nodejs.org/) (version 6.11 or newer) (including [npm](https://www.npmjs.com/), version 3.10 or newer).

If your network requires access via proxy server then configure your proxy settings using the environment variable **HTTPS_PROXY** accordingly.

## Usage

Install dependencies: `npm install` and `npm install -g typescript`

Build application: `tsc`

Execute application: `node dist/openid-browser-login [--username <username>] [--password <password>]'`

After successful execution the application output the OpenID Connect access_token as JWT on the console ready for use in HTTP API calls using the Authorization hedaer field.

```
node dist/openid-browser-login --username user@domain.com --password "xxx"

Simulate browser based login for Bosch Account to get OpenId Connect JWT token.
...
1) HTTP GET of login form: ...
2) HTTP POST of login data to ...
...

OpenID Connect access_token as Authorization header:

Bearer abcxxx
```

## License

Thi example is made available under the terms of Bosch SI Example Code License, Version 1.0.  
See the iot-things-examples top level README.md file for license details.
