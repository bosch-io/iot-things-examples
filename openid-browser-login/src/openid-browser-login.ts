import * as request from 'request';
import * as URL from "url";
import { JSDOM } from 'jsdom';
import { question, questionNewPassword } from 'readline-sync';
import * as commander from 'commander';

/*
 * Simulate browser based login for Bosch Account to get OpenId Connect JWT token
 */

class OpenIdBrowserLogin {

  executeInteractive() {

    commander.version('1.0.0')
      .option('-u, --username [username]', 'User name of Bosch Account')
      .option('-p, --password [password]', 'Password of Bosch Account')
      .parse(process.argv);

    console.error('\n'
      + 'Simulate browser based login for Bosch Account to get OpenId Connect JWT token.\n\n'
      + 'IMPORTANT:\n'
      + 'This tool does only communicate with the official Bosch endpoints https://identity.bosch.com and https://accounts.bosch.com\n'
      + 'No secret information will be sent to any other 3rd-party endpoint.\n\n'
      + 'SUPPORTED ONLY AS EXAMPLE FOR DEVELOPMENT - DO NOT USE IN PRODUCTION!\n\n'
      + 'If your network requires access via proxy server then configure your proxy settings using the environment variable HTTPS_PROXY accordingly.\n\n'
    );

    let username;
    if (commander.username) {
      username = commander.username;
      console.error("Used Bosch CIAM user email: " + username);
    } else {
      username = question('Enter your Bosch CIAM user email: ');
    }
    let password = commander.password ? commander.password : question('Enter your Bosch CIAM password:   ', { hideEchoBack: true });
    console.error();

    this.execute(username, password);
  }

  execute(username: string, password: string) {

    const boschIdentityBaseUrl = 'https://identity.bosch.com';
    const boschAccountsBaseUrl = 'https://accounts.bosch.com';

    // OpenID client_id for 'Bosch IoT Things - Developer Tools'
    const client_id = 'ciamids_0D97EDD2-F37E-47F1-8046-BDD9E83128A8';

    const url = boschIdentityBaseUrl
      + '/connect/authorize?'
      + 'response_type=' + encodeURIComponent('id_token token')
      + '&scope=openid'
      + '&client_id=' + client_id
      + '&redirect_uri=' + encodeURIComponent('http://localhost/auth/callback')
      + '&state=' + 'dummy'
      + '&nonce=' + 'dummy';

    var cookieJar = request.jar();
    let req = request.defaults({
      followRedirect: false,
      jar: cookieJar,
      headers: { 'User-Agent': 'Bosch IoT Things Developer Tools' }
    });

    // TODO use rx-js to process cascaded requests, see https://stackoverflow.com/a/35573241

    console.error('1) HTTP GET of login form: ' + url);
    req.get(url, { followRedirect: true },
      (error, response, body) => {
        if (!error && response.statusCode == 200) {
          // console.trace('response:\n' + JSON.stringify(response));

          let dom = new JSDOM(body);
          let action = dom.window.document.querySelector('form[method="post"][id="loginForm"]').getAttribute('action');
          let url = boschAccountsBaseUrl + action;

          console.error('2) HTTP POST of login data to ' + url);
          req.post(url, {
            form: {
              UserName: username,
              Password: password,
              AuthMethod: 'FormsAuthentication'
            }
          },
            (error, response, body) => {
              if (response && response.statusCode === 302 && response.headers.location && response.headers.location.toString().startsWith(boschAccountsBaseUrl)) {
                // console.trace('\nresponse:\n' + JSON.stringify(response));

                url = response.headers.location.toString();

                console.error('3) HTTP GET to follow rediect to ' + url);
                req.get(url,
                  (error, response, body) => {
                    if (response) {
                      // console.trace('response:\n' + JSON.stringify(response));

                      dom = new JSDOM(body);
                      let fields = dom.window.document.querySelectorAll('input[type="hidden"]');
                      let form: any = {};
                      for (let i = 0; i < fields.length; i++) {
                        form[fields[i].getAttribute('name')] = fields[i].getAttribute('value');
                      };
                      // console.trace('form: \n' + JSON.stringify(form) + '\n');

                      url = dom.window.document.querySelector('form[method="post"][name="hiddenform"]').getAttribute('action');

                      console.error('4) HTTP POST of hidden intermediate data to ' + url);
                      req.post(url, {
                        form: form
                      },
                        (error, response, body) => {
                          if (response && response.statusCode === 302 && response.headers.location) {
                            // console.trace('response:\n' + JSON.stringify(response));

                            url = boschIdentityBaseUrl + response.headers.location;
                            console.error('5) HTTP GET to follow rediect to ' + url);

                            req.get(url,
                              (error, response, body) => {
                                if (response && response.statusCode === 302 && response.headers.location && response.headers.location.toString().startsWith(boschIdentityBaseUrl)) {
                                  // console.trace('response:\n' + JSON.stringify(response));

                                  url = response.headers.location.toString();
                                  console.error('6) HTTP GET to follow rediect to ' + url);

                                  req.get(url,
                                    (error, response, body) => {
                                      if (response && response.statusCode === 302 && response.headers.location) {
                                        // console.trace('response:\n' + JSON.stringify(response));

                                        url = response.headers.location.toString();
                                        url = url.replace('#', '?');

                                        let urlobj = URL.parse(url, true);
                                        let id_token = urlobj.query.id_token;
                                        let access_token = urlobj.query.access_token;

                                        console.error(`7) RESULT\naccess_token = ${access_token}\nid_token = ${id_token}\n`);

                                        console.error('OpenID Connect access_token as Authorization header:\n');
                                        console.log(`Bearer ${access_token}`);

                                        process.exitCode = 0;
                                      } else {
                                        console.error('error: ' + JSON.stringify(error) + ' ' + JSON.stringify(response));
                                      }
                                    });
                                } else {
                                  console.error('error: ' + JSON.stringify(error) + ' ' + JSON.stringify(response));
                                }
                              }
                            );
                          } else {
                            console.error('error: ' + JSON.stringify(error) + ' ' + JSON.stringify(response));
                          }
                        }
                      );
                    } else {
                      console.error('error: ' + JSON.stringify(error) + ' ' + JSON.stringify(response));
                    }
                  });
              } else {
                console.error('error: ' + JSON.stringify(error) + ' ' + JSON.stringify(response));
              }
            }
          );
        } else {
          console.error('error: ' + JSON.stringify(error) + ' ' + JSON.stringify(response));
          if (error.code == 'ENOTFOUND') {
            console.error('\nIf your network requires access via proxy server then configure your proxy settings using the environment variable HTTPS_PROXY accordingly.');
          }
        }
      });
  }
}

process.exitCode = 1;
new OpenIdBrowserLogin().executeInteractive();
