/*
 * Implementation of an XMPP client.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
class Client {
    constructor() {}

    get config() {
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
                        resolve(config);
                    }));
        });
    }

    connect(_config) {
        return new Promise((resolve, reject) => {

            function xrdFindWebsocketURL(xrdBody) {
                return new Promise((resolve, reject) => {
                    let websocketURL = null;

                    let xmlParser = new DOMParser();
                    let xrdDoc = xmlParser.parseFromString(xrdBody, "application/xml");

                    let links = xrdDoc.getElementsByTagName("Link");
                    for (let linkid = 0; linkid < links.length; linkid++) {
                        let aLink = links[linkid];

                        console.log('found link with rel: ' + aLink.getAttribute("rel"));

                        if (aLink.getAttribute("rel") == 'urn:xmpp:alt-connections:websocket') {
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

                xmppSocket.onopen = function (event) {
                    console.log('xmppSocket connected: ' + event);
                    // TODO: Check if server response contains HTTP Header Sec-WebSocket-Protocol == xmpp.
                    // Otherwise, close it (not sure if it's doable easily).
                    if (false) {
                        xmppSocket.close();
                        reject('Server didn\'t respond with correct Sec-WebSocket-Protocol');
                    }

                    // WebSocket is initialized, we have now to initiate Framed Stream
                    xmppSocket.framedStream = new FramedStream({
                        from: config.jid,
                        to: config.domainpart
                    });

                    xmppSocket.framedStream.open
                        .then((openFrame) => {
                            console.log("xmppSocket: open framed stream: " + openFrame);
                            xmppSocket.send(openFrame);
                        })
                        .then(() => {
                            resolve(xmppSocket);
                        });
                };

                xmppSocket.onmessage = function (event) {
                    console.log('xmppSocket received: ' + event.data);

                    // Need to serialize to DOM and to sanatize content

                    // Need to check errors in string and ask to close

                    // Initiate close when receiving <close>
                    // <close> can contain see-other-uri to redirect the stream (be careful to keep same security at least)
                    if (event.data.includes("<close")) {
                        xmppSocket.framedStream.close
                            .then((closeFrame) => {
                                console.log("xmppSocket: closing framed stream: " + closeFrame);
                                xmppSocket.send(closeFrame);
                            });
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
                .then(handshake);
        });
    }
}
