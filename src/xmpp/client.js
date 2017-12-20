/*
 * Implementation of an XMPP client.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
class Client {
    constructor(_config) {
        this.saslStep = 0;
        this.config = _config;
    }

    connect() {
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
                        from: this.config.jid,
                        to: this.config.domainpart
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
                            // Start SASL negotiation
                            this.saslStep = 1;

                            // First find client SASL Mechanism which is furnished by server
                            let clientSASLMechanism = Constants.CLIENT_PREF_SASL_MECHANISM;
                            let purposedMechanisms = serverMechanisms.getElementsByTagName('mechanism').map(tag => tag.value);

                            let serverSASLMechanism;

                            for (let mechanism = 0; mechanism <= purposedMechanisms.length(); mechanism++) {
                                serverSASLMechanism.push(purposedMechanisms[mechanism].value);
                            }

                            console.log('stream authenticate: look for mechanism');

                            for (let clientMechanism in clientSASLMechanism) {
                                console.log('stream authenticate: looking for ' + clientSASLMechanism);
                                if (serverSASLMechanism.find(clientMechanism)) {
                                    let factory = new SASLFactory(clientMechanism);

                                    let auth = this.dom.createElementNS(Constants.NS_XMPP_SASL, 'auth');
                                    auth.setAttribute('mechanism', clientMechanism);
                                    auth.value = factory.getMessage(this.config.localpart, this.config.password, null);

                                    console.log('stream authenticate will send: ' + this.xmlSerializer.serializeToString(auth));
                                    xmppSocket.send(this.xmlSerializer.serializeToString(auth));
                                }
                            }
                        }
                        break;

                    case 'failure':
                        // SASL failure
                        if (this.saslStep >= 0
                            && messageDOM.documentElement.namespaceURI == Constants.NS_XMPP_SASL) {
                            let failure = messageDOM.firstChild().nodeName;
                            console.log('stream authenticate failed with error: ' + failure);

                            this.framedStream.close()
                                .then((closeFrame) => {
                                    console.log("xmppSocket: closing framed stream: " + closeFrame);
                                    xmppSocket.send(closeFrame);
                                });
                        }
                        console.log('xmppSocket: received <failure> outside of known name-space (or with SASL namespace but not currently negotiating).');
                        break;

                    case 'success':
                        // SASL success
                        if (this.saslStep >= 0
                            && messageDOM.documentElement.namespaceURI == Constants.NS_XMPP_SASL) {
                            console.log('SASL succeed: restart stream');
                            this.framedStream.restart();
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

            let xrdURL = 'https://' + this.config.domainpart + '/.well-known/host-meta';

            fetch(xrdURL)
                .then(function (response) {
                    return response.text();
                })
                .then(xrdFindWebsocketURL, function (error) {
                    let xrdURL = 'http://' + this.config.domainpart + '/.well-known/host-meta';

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
