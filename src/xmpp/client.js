/*
 * Implementation of an XMPP client.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
class Client {
    constructor() {}

    config() {
        return new Promise((resolve, reject) => {
            let config = {};

            function setJid(localStorage) {
                console.log('client: local storage found jid: ' + localStorage.jid);

                if (localStorage.jid) {
                    config.jid = localStorage.jid;
                    config.fulljid = config.jid + '/xmpp-pane_' + Date.now();
                    let splitedJid = config.jid.split('@');
                    config.localpart = splitedJid[0];
                    config.domainpart = splitedJid[1];
                }

                console.log('client: local part: ' + config.localpart);
            }

            function setPassword(localStorage) {
                console.log('client: local storage found password: ' + localStorage.password);
                if (localStorage.password) {
                    config.password = localStorage.password;
                }
                //resolve(config);
            }

            function onError(error) {
                console.log('client: error:' + error);
                reject(error);
            }

            let getJid = browser.storage.local.get("jid");
            let getPassword = browser.storage.local.get("password");

            getJid.then(setJid, onError)
                .then(getPassword.then(setPassword, onError)
                    .then(() => {
                        if (config.jid
                            && config.localpart
                            && config.domainpart
                            && config.password) {
                            resolve(config);
                        }
                        else {
                            reject(`Some configuration hasn't been found, please configure xmpp-pane first`);
                        }
                    }));
        });
    }

    connect(_config) {
        return new Promise((resolve, reject) => {

            function xrdFindWebsocketURL(xrdBody) {
                return new Promise((resolve, reject) => {
                    let websocketURL = null;

                    let domParser = new DOMParser();
                    let xrdDoc = domParser.parseFromString(xrdBody, "application/xml");

                    let links = xrdDoc.getElementsByTagName("Link");
                    for (let linkid = 0; linkid < links.length; linkid++) {
                        let aLink = links[linkid];

                        console.log('found link with rel: ' + aLink.getAttribute("rel"));

                        if (aLink.getAttribute("rel") == Constants.XMPP_ALTCONNECTIONS_WEBSOCKET) {
                            websocketURL = aLink.getAttribute("href");
                            break;
                        }
                    }

                    if (websocketURL) {
                        resolve(websocketURL);
                    }
                    else {
                        reject('no websocket URL found');
                    }
                });
            }

            function handshake(websocketURL) {
                let xmppSocket = new WebSocket(websocketURL, 'xmpp');
                xmppSocket.domParser = new DOMParser();

                xmppSocket.onopen = function (event) {
                    console.log('xmppSocket connected: ' + event);
                    // TODO: Check if server response contains HTTP Header Sec-WebSocket-Protocol == xmpp.
                    // Otherwise, close it (not sure if it's doable easily).
                    if (false) {
                        xmppSocket.close();
                        reject('Server didn\'t respond with correct Sec-WebSocket-Protocol');
                    }

                    // WebSocket is initialized, we have now to initiate Framed Stream
                    this.framedStream = new FramedStream({
                        from: config.jid,
                        to: config.domainpart
                    });

                    this.framedStream.initiate()
                        .then((openElement) => {
                            console.log("xmppSocket: open framed stream: " + openElement);
                            xmppSocket.send(openElement);
                        })
                        .then(() => {
                            resolve();
                        });
                };

                xmppSocket.onmessage = function (event) {
                    console.log('xmppSocket raw received: ' + event.data);

                    // Need to parse to DOM and to sanatize content
                    let messageDOM = xmppSocket.domParser.parseFromString(event.data, "text/xml");

                    // Need to check errors in string and ask to close
                    switch (messageDOM.documentElement.nodeName) {

                    case 'open':
                        // Server aknowleged our open initiate
                        this.framedStream.ackInitiate(messageDOM.documentElement);
                        break;

                    case 'close':
                        // Initiate close when receiving <close>
                        // <close> can contain see-other-uri to redirect the stream
                        // (be careful to keep same security at least in that case)
                        this.framedStream.close()
                            .then((closeFrame) => {
                                console.log("xmppSocket: closing framed stream: " + closeFrame);
                                xmppSocket.send(closeFrame);
                            });
                        break;

                    case 'stream:features':
                        // Server give the choice of multiple features.
                        // Some can be mandatory (there's no particular specification to know if it's required or not)
                        let features = messageDOM.documentElement;

                        // SASL is always mandatoy
                        let saslMechanisms = features.getElementsByTagName('mechanisms');
                        if (saslMechanisms[0]
                            && saslMechanisms[0].namespaceURI == Constants.NS_XMPP_SASL) {
                            // SASL requires multiple message exchange, so we pass the xmppSocket directly to the function
                            // Message handling will be temporarly managed by the Stream.
                            this.framedStream.authenticate(xmppSocket, features, this.localpart, this.password, null)
                                .then(
                                    () => {
                                        console.log("xmppSocket: client successfully authenticated");
                                    },
                                    () => {
                                        console.log("xmppSocket: client wasn't able to authenticate.");
                                    }
                                );
                        }
                        break;

                    default:
                        console.log('xmppSocket unknown XML element' + messageDOM.documentElement.nodeName);
                        break;
                    }
                };

                xmppSocket.onerror = function (event) {
                    console.log('xmppSocket error occured: ' + event);
                    reject(event);
                };

                xmppSocket.onclose = function (event) {
                    console.log('xmppSocket connection closing: ' + event);
                };
            }

            let config = _config;
            let xrdURL = 'https://' + config.domainpart + '/.well-known/host-meta';

            fetch(xrdURL)
                .then(function (response) {
                    return response.text();
                })
                .then(xrdFindWebsocketURL, function (error) {
                    let xrdURL = 'http://' + config.domainpart + '/.well-known/host-meta';

                    return fetch(xrdUrl)
                        .then(function (response) {
                            return response.text();
                        });
                })
                // TODO: Add extra step to check if we will be using WebSocket over TLS
                // If not, we stop here and give feedback to user.
                .then(handshake);
        });
    }
}
