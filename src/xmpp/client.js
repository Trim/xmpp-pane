/*
 * Implementation of an XMPP client.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
class Client {
    constructor(_config) {
        const xmppClient = this;
        // external configuration
        this.config = _config;
        // toolbox
        this.dom = document.implementation.createDocument(null, null);
        this.xmlSerializer = new XMLSerializer();
        this.stream = null; // XMPP Framed Stream
        this.socket = null; // WebSocket
        this.dispatcher = new Dispatcher(this); // WebSocket message dispatcher
        // internal state
        this.saslStep = 0;
        this.saslDone = false;
        this.bindDone = false;
        this.tls = false;
        // Stanza sent waiting for acknowledgment and/or response
        this.stanzas = {};
        this.stanzaId = 0;
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
                if (websocketURL.indexOf('wss') > -1) {
                    xmppClient.tls = true;
                }
                else {
                    xmppClient.tls = false;
                    reject('handshake: refusing to connect to ' + websocketURL + ' because TLS is not available');
                }

                xmppClient.socket = new WebSocket(websocketURL, 'xmpp');

                xmppClient.socket.onopen = function (event) {
                    console.log('xmppClient.socket connected: ' + event);
                    // TODO: Check if server response contains HTTP Header Sec-WebSocket-Protocol == xmpp.
                    // Otherwise, close it (not sure if it's doable easily).
                    if (false) {
                        xmppClient.socket.close();
                        reject('Server didn\'t respond with correct Sec-WebSocket-Protocol');
                    }

                    // WebSocket is initialized, we have now to initiate Framed Stream
                    xmppClient.stream = new FramedStream({
                        from: xmppClient.config.jid,
                        to: xmppClient.config.domainpart
                    });

                    xmppClient.stream.initiate()
                        .then((openElement) => {
                            xmppClient.send(openElement);
                        })
                        .then(() => {
                            resolve();
                        });
                };

                xmppClient.socket.onmessage = function (event) {
                    xmppClient.dispatcher.dispatch(event);
                }

                xmppClient.socket.onerror = function (event) {
                    console.log('xmppSocket error occured: ' + event);
                };

                xmppClient.socket.onclose = function (event) {
                    console.log('xmppSocket connection closing: ' + event);
                };
            }

            let xrdURL = 'https://' + this.config.domainpart + '/.well-known/host-meta';

            const xmppClient = this;
            fetch(xrdURL)
                .then(function (response) {
                    return response.text();
                })
                .then(xrdFindWebsocketURL, function (error) {
                    let xrdURL = 'http://' + xmppClient.config.domainpart + '/.well-known/host-meta';

                    return fetch(xrdUrl)
                        .then(function (response) {
                            return response.text();
                        });
                })
                .then(handshake);
        });
    }

    /*
     * Send text message through websocket.
     */
    send(message) {
        let messageText;
        if (typeof (message) == 'string') {
            messageText = message;
        }
        else {
            messageText = this.xmlSerializer.serializeToString(message);
        }
        console.log('client: sending: ' + messageText);
        this.socket.send(messageText);
    }

    close() {
        this.stream.close()
            .then((closeFrame) => {
                console.log('client: closing');
                this.send(closeFrame);
            });
    }

    handleSASL(message) {
        console.log('client: handling SASL: ' + message.nodeName);
        switch (message.nodeName) {

        case 'mechanisms':
            // Start SASL negotiation
            this.saslStep = 1;

            // First find client SASL Mechanism which is furnished by server
            let clientSASLMechanism = Constants.CLIENT_PREF_SASL_MECHANISM;
            let purposedMechanisms = message.getElementsByTagName('mechanism');

            let serverSASLMechanism = [];

            for (let mechanism = 0; mechanism < purposedMechanisms.length; mechanism++) {
                serverSASLMechanism.push(purposedMechanisms[mechanism].innerHTML);
            }

            console.log('stream authenticate: look for mechanism');

            for (let clientMechanism of clientSASLMechanism) {
                if (this.tls == false && clientMechanism == 'PLAIN') {
                    continue;
                }

                console.log('stream authenticate: looking for ' + clientMechanism);
                if (serverSASLMechanism.find((mechanism) => {
                        return mechanism == clientMechanism;
                    })) {
                    let factory = new SASLFactory(clientMechanism);

                    let auth = this.dom.createElementNS(Constants.NS_XMPP_SASL, 'auth');
                    auth.setAttribute('mechanism', clientMechanism);
                    factory.getMessage(this.config.localpart, this.config.password, null)
                        .then((saslMessage) => {
                            console.log('saslMessage: ' + saslMessage);
                            auth.innerHTML = saslMessage;
                            this.send(auth);
                        });
                }
            }
            break;

        case 'failure':
            if (this.saslStep > 0) {
                let failure = message.firstChild.nodeName;
                console.log('stream authenticate failed with error: ' + failure);

                this.close();
            }
            break;

        case 'success':
            if (this.saslStep > 0) {
                console.log('SASL succeed: restart stream');

                // Save SASL State
                this.saslStep = 0;
                this.saslDone = true;

                // Initiate Stream restart (just send new <open/> as implicitly closed)
                this.stream.initiate()
                    .then((openElement) => {
                        console.log("client: re-opening stream.");
                        this.send(openElement);
                    });
            }
            break;
        }
    }

    handleBind(message) {
        console.log('client: handling bind: ' + message.nodeName);
        let bind;
        switch (message.nodeName) {
        case 'stream:features':
            // On feature negotiation, ask to create our resource id
            // as JavaScript and Web API can't easily create secure uuid
            let iq = new IQ({
                from: this.config.jid,
                to: this.config.domainpart,
                id: this.stanzaId++,
                type: 'set'
            });

            bind = this.dom.createElementNS(Constants.NS_XMPP_BIND, 'bind');

            iq.build(bind)
                .then((iqElement) => {
                    this.send(iqElement);
                });
            break;

        case 'iq':
            // Receive our resource id generated by the server
            bind = message.children[0];
            let fulljid = bind.children[0].innerHTML;
            this.bindDone = true;
            this.config.fulljid = fulljid;
            console.log('client: bound done, full jid is: ' + this.config.fulljid);
            break;
        }
    }
}
