/*
 * Client is responsible to create and keep the connection with the client's
 * XMPP server.
 *
 * It will receive contracts from multiple sources (as the client itself, some
 * pubsub nodes, ...).
 * A contract is made of:
 *  - an XML message to send on the XMPP network
 *  - an expected response XML node name
 *  - a promise consisting of to two callbacks (packed as a Promise):
 *    - one action to run when a response is received and succeed
 *    - one action to run on any error (error response received, network error, ...)
 *
 * It keeps a directory of all contracts which are waiting for responses.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */

class Client {
    constructor(_config) {
        // XMPP configuration
        this.config = _config;
        // Only the client needs to handle password (via SASL)
        this.password = _config.password;
        delete this.config.password;

        // DOM toolbox
        this.dom = document.implementation.createDocument(null, null);
        this.domParser = new DOMParser();
        this.xmlSerializer = new XMLSerializer();

        // XMPP Framed Stream
        this.stream = null;
        this.socket = null; // WebSocket

        // Internal state
        this.saslStep = 0;
        this.saslDone = false;
        this.bindDone = false;
        this.bindError = null;
        this.tls = false;

        // XMPP Network discovered
        this.xmppNet = new Network(this.config.xmllang);

        // Contracts
        this.contracts = {};
        this.lastContractId = 0;
    }

    get network() {
        return this.xmppNet;
    }

    // Promising a contract
    promise(_message, _nodeName) {
        return new Promise((resolve, reject) => {
            // Manage the contract
            let contract = {
                id: _message.id,
                to: _message.to,
                message: _message,
                nodeName: _nodeName,
                success: (response) => {
                    resolve(response);
                },
                fail: (response) => {
                    reject(response);
                }
            }

            // TODO: Find better way to store contracts (maybe with "to" as key)
            // and update handleContact too.
            this.contracts[contract.id] = contract;

            // Create a websocket if needed and execute the contract
            if (!this.socket) {
                this.connect()
                    .then(() => {
                        this.send(contract.message);
                    });
            }
            else {
                this.send(contract.message);
            }
        });
    }

    isConnected() {
        return this.bindDone;
    }

    connectionError() {
        return this.bindError;
    }

    connect() {
        return new Promise((resolve, reject) => {

            // Helper to look on the web for a websocket URL
            function xrdFindWebsocketURL(_xrdBody) {
                return new Promise((resolve, reject) => {
                    let websocketURL = null;

                    let domParser = new DOMParser();
                    let xrdDoc = domParser.parseFromString(_xrdBody, "application/xml");

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

            // Helper to initiate the WebSocket
            function handshake(_websocketURL) {
                if (_websocketURL.indexOf('wss://') == 0) {
                    xmppClient.tls = true;
                }
                else {
                    xmppClient.tls = false;
                    reject('handshake: refusing to connect to ' + _websocketURL + ' because TLS is not available.');
                }

                xmppClient.socket = new WebSocket(_websocketURL, 'xmpp');

                xmppClient.socket.onopen = function (event) {
                    console.log('client socket connected: ' + event);
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
                    xmppClient.onmessage(event);
                }

                xmppClient.socket.onerror = function (event) {
                    console.log('xmppSocket error occured: ' + event);
                };

                xmppClient.socket.onclose = function (event) {
                    console.log('xmppSocket connection closing: ' + event);
                };
            }

            let xmppClient = this;

            // First look on secure connection for websocket URL
            let xrdURL = 'https://' + this.config.domainpart + '/.well-known/host-meta';
            fetch(xrdURL)
                .then(function (xrdResponse) {
                    return xrdResponse.text();
                })
                .then(xrdFindWebsocketURL, function (error) {
                    let xrdURL = 'http://' + xmppClient.config.domainpart + '/.well-known/host-meta';

                    return fetch(xrdUrl)
                        .then(function (xrdResponse) {
                            return xrdResponse.text();
                        });
                })
                .then(handshake);
        });
    }

    close() {
        this.stream.close()
            .then((closeFrame) => {
                console.log('client: closing');
                this.send(closeFrame);
            });
    }

    /*
     * Sending messages directly through websocket
     */
    send(_message) {
        let messageText;
        if (typeof (_message) == 'string') {
            messageText = _message;
        }
        else {
            messageText = this.xmlSerializer.serializeToString(_message);
        }
        console.log('client: sending: ' + messageText);
        this.socket.send(messageText);
    }

    /*
     * Receiving message from the websocket and handle contracts linked to the message.
     */
    onmessage(_response) {
        console.log('client: raw message received: ' + _response.data);

        // TODO: On parsing error, close the stream
        let message = this.domParser.parseFromString(_response.data, "text/xml").documentElement;
        // TODO: Sanitize content before processing

        switch (message.namespaceURI) {

        case Constants.NS_XMPP_FRAMING:
        case Constants.NS_JABBER_STREAM:
            // Either type of streams are communicating without contracts
            // Stream handler will ask the client to auhtenticate with SASL
            // and to bind at the good time of Stream initialization.
            this.stream.handle(this, message);
            break;

        case Constants.NS_XMPP_SASL:
            // NS_XMPP_SASL is communicating without contracts
            this.handleSASL(message);
            break;

        default:
            console.log('client: unknown namespaceURI element: ' + message.namespaceURI);
            console.log('client: looking for known nodeName: ' + message.nodeName)
            switch (message.nodeName) {
            case 'iq':
                console.log('client: IQ stanza received, looking in contracts for id: ' + message.id);
                console.log('client: The IQ unique child is named: ' + message.children[0].nodeName);
                this.handleContract(message);
                break;

            default:
                console.log('client: unknown namespace and nodename, nothing todo.');
                break;
            }
            break;
        }
    }

    /*
     * Check contract state and finish its execution according to the response received
     */
    handleContract(_message) {
        if (Object.keys(this.contracts).find((contractId) => {
                return contractId == _message.id
            })) {
            // TODO: Check that XMPP always send <error> (if not move this code approprieterly)
            let errorEntities = _message.getElementsByTagName('error');

            if (errorEntities.length > 0) {
                let errorCode = errorEntities[0].getAttribute('code');
                let errorMessage = _message.getElementsByTagName('text')[0].innerHTML;

                this.contracts[_message.id].fail({
                    message: errorMessage,
                    code: errorCode
                });

                console.error('client: contract ' + _message.id + ' has failed (error: ' + errorCode + ', ' + errorMessage + ')');
                return;
            }

            // TODO: Add checks about namespaceURI too
            if (this.contracts[_message.id].nodeName == _message.nodeName) {
                this.contracts[_message.id].success(_message);
            }
            else {
                this.contracts[_message.id].fail({
                    message: 'node name did not match: expected ['
                        + this.contracts[_message.id].nodeName + ']'
                        + ', received ['
                        + _message.children[0].nodeName
                        + ']',
                    code: 'badNodeName'
                });
            }
        }
        else {
            console.error('client: client ' + this.fulljid + ' did not expect contract id: ' + _message.id);
        }
    }

    /*
     * SASL authentication
     *
     * This process is initiated by the XMPP Stream.
     */
    handleSASL(_message) {
        console.log('client: authenticate with SASL: ' + _message.nodeName);
        switch (_message.nodeName) {

        case 'mechanisms':
            // Start SASL negotiation
            this.saslStep = 1;

            // First find client SASL Mechanism which is furnished by server
            let clientSASLMechanism = Constants.CLIENT_PREF_SASL_MECHANISM;
            let purposedMechanisms = _message.getElementsByTagName('mechanism');

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
                    factory.getMessage(this.config.localpart, this.password, null)
                        .then((_saslMessage) => {
                            console.log('saslMessage: ' + _saslMessage);
                            auth.innerHTML = _saslMessage;
                            this.send(auth);
                        });
                }
            }
            break;

        case 'failure':
            if (this.saslStep > 0) {
                let failure = _message.firstChild.nodeName;
                console.log('stream authenticate failed with error: ' + failure);
                this.bindError = 'stream authenticate failed with error: ' + failure;
                this.close();
                delete this.password;
            }
            break;

        case 'success':
            if (this.saslStep > 0) {
                console.log('SASL succeed: restart stream');

                // Save SASL State
                this.saslStep = 0;
                this.saslDone = true;
                delete this.password;

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

    /*
     * client binding to XMPP server
     *
     * This process is initiated by the XMPP Stream.
     */
    bind() {
        console.log('client: bind: starting');

        // Ask to create our resource id
        // as JavaScript and Web API can't easily create secure uuid
        let iq = new IQ({
            from: this.config.jid,
            to: this.config.domainpart,
            id: this.lastContractId++,
            type: 'set'
        });

        let bind = this.dom.createElementNS(Constants.NS_XMPP_BIND, 'bind');

        iq.build(bind)
            .then((iqElement) => {
                this.promise(iqElement, 'iq')
                    .then(
                        (iqResponse) => {
                            // Receive our resource id generated by the server
                            this.config.fulljid = iqResponse.innerHTML;
                            this.bindDone = true;
                            console.log('client: bind: succeed, full jid is: ' + this.config.fulljid);
                        },
                        (bindError) => {
                            console.log('client: bind: unknown error: ' + bindError.error);
                        });
            });
    }

    /*
     * Discover an Entity
     *
     * Node attribute is optional
     * This is WIP and will be replaced by "discoverPubSubService"
     * the idea will be to:
     *   * disco#info on service name
     *   * disco#items on first level of service
     *   * disco#info on each of discovered node of first level service
     */
    discoPubsubService(_entity, _node = null) {
        return new Promise((resolve, reject) => {
            console.log('client: discoPubsubService: starting');

            let iqInfo = new IQ({
                from: this.config.jid,
                to: _entity,
                id: this.lastContractId++,
                type: 'get'
            });

            if (_node) {
                iqInfo.addExtendedAttribute('node', _node);
            }

            let query = this.dom.createElementNS(Constants.NS_DISCO_INFO, 'query');

            iqInfo.build(query)
                .then((iqInfoService) => {
                    // TODO: Add expected namespace as Constants.NS_DISCO_INFO
                    this.promise(iqInfoService, 'iq')
                        .then(
                            (iqResponse) => {
                                let entity = new Entity(iqResponse.getAttribute('from'));
                                let identities = iqResponse.getElementsByTagName('identity');
                                let features = iqResponse.getElementsByTagName('feature');

                                for (let i = 0; i < identities.length; i++) {
                                    entity.addIdentity(identities[i]);
                                }

                                for (let i = 0; i < features.length; i++) {
                                    entity.addFeature(features[i]);
                                }

                                console.log('client: discoPubsubService: succeed: ' + entity);

                                this.xmppNet.registerService(entity);
                            },
                            (error) => {
                                console.log('client: discoPubsubService received error: ' + error.message);
                                reject(error);
                            })
                        .then(
                            (result) => {
                                resolve(this.xmppNet)
                            },
                            (error) => {
                                reject('client was not able to discover pubsub service: ' + _entity);
                            });
                })
        });
    }
}
