var Client = function(_config) {
    return {
        readConfig: function () {
            return new Promise ((resolve, reject) => {
                let config = _config;

                function setJid(localStorage) {
                    console.log('client: local storage found jid: ' + localStorage.jid);

                    if (localStorage.jid) {
                        config.jid = localStorage.jid;
                        config.fulljid = config.jid + '/xmpp-pane';
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
            })
        },

        authenticate: function(_config) {
            return new Promise((resolve, reject) => {

                function xrdFindWebsocketURL (xrdBody) {
                    return new Promise ((resolve, reject) => {
                        let websocketURL = null;

                        let xmlParser = new DOMParser();
                        let xrdDoc = xmlParser.parseFromString(xrdBody, "application/xml");

                        let links = xrdDoc.getElementsByTagName("Link");
                        for (let linkid = 0; linkid < links.length; linkid++) {
                            let aLink = links[linkid];

                            aLink;
                            console.log('found link with rel: ' + aLink.getAttribute("rel"));

                            if (aLink.getAttribute("rel") == 'urn:xmpp:alt-connections:websocket' ) {
                                websocketURL = aLink.getAttribute("href");
                                break;
                            }
                        }

                        if(websocketURL) {
                            resolve(websocketURL)
                        }
                        else {
                            reject('no websocket URL found');
                        }
                    })
                }

                function handshake (websocketURL) {
                        let xmppSocket = new WebSocket(websocketURL, 'xmpp');

                        xmppSocket.onopen = function (event) {
                            console.log('xmppSocket connected: ' + event);
                            // TODO: Check if server response contains HTTP Header Sec-WebSocket-Protocol == xmpp.
                            // Otherwise, close it (not sure if it's doable easily).
                            if (false) {
                                xmppSocket.close();
                                reject('Server didn\'t respond with correct Sec-WebSocket-Protocol');
                            }

                            // WebSocket is initialized, we can now initiate XMPP Stream
                            xmppSocket.stanza = Stanza({to: config.domainpart});

                            xmppSocket.stanza.init()
                                .then(xmppSocket.stanza.open)
                                .then((openStanza) => {
                                    console.log("xmppSocket will send: " + openStanza);
                                    xmppSocket.send(openStanza);
                                })
                                .then(() => {
                                    resolve(xmppSocket);
                                });
                        }

                        xmppSocket.onmessage = function (event) {
                            console.log('xmppSocket received: ' + event.data);
                        }

                        xmppSocket.onerror = function (event) {
                            console.log('xmppSocket error occured: ' + event);
                            reject(event);
                        }

                        xmppSocket.onclose = function (event) {
                            console.log('xmppSocket connection closing: ' + event);
                        }

                        xmppSocket.xmppClose = function (event) {
                            console.log('xmppSocket asking to close xmpp socket: ' + event);
                            xmppSocket.send('<close xmlns="urn:ietf:params:xml:ns:xmpp-framing" />');
                        }
                    }

                let config = _config;
                let xrdURL = 'https://'  + config.domainpart + '/.well-known/host-meta';

                fetch(xrdURL)
                    .then(function(response) {
                        return response.text();
                    })
                    .then(xrdFindWebsocketURL, function (error) {
                        let xrdURL = 'http://'  + config.domainpart + '/.well-known/host-meta';

                        return fetch(xrdUrl)
                                .then(function(response) {
                                    return response.text();
                                })
                    })
                    .then(handshake)
            })
        }
    }
}

