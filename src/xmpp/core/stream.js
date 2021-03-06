/*
 * Stream is implementation of XMPP stream as in defined in XMPP Core.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
class Stream {
    constructor(_config) {
        // Allow to define XMPP Core attributes directly
        this.attribute = {};
        this.attribute.from = _config.from;
        this.attribute.to = _config.to;
        // prefered language for human readable texts (if server support same language)
        this.attribute.xmllang = _config.xmllang;
        this.attribute.version = Constants.XMPP_VERSION;
        // Stream id will be generated by servers
        this.attribute.id = null;

        // XML DOM tree (cleared each time)
        this.dom = document.implementation.createDocument(null, null);

        // Closing state
        this.isClosing = false;

        // DOM Parser can parse XML string to DOM (created once)
        if (!this.domParser) {
            this.domParser = new DOMParser();
        }

        // Create a DOM to XML serializer (created once)
        if (!this.xmlSerializer) {
            this.xmlSerializer = new XMLSerializer();
        }
    }

    /*
     * Attributes defined by XMPP Core: from, to 
     */
    get from() {
        return this.attribute.from;
    }

    set from(_from) {
        this.attribute.from = _from;
    }

    get to() {
        return this.attribute.to;
    }

    set to(_to) {
        this.attribute.to = _to;
    }

    get xmllang() {
        return this.attribute.xmllang;
    }

    set xmllang(_xmllang) {
        this.attribute.xmllang = _xmllang;
    }

    get id() {
        return this.attribute.id;
    }

    /*
     * Public attributes not defined by XMPP Core
     */


    /*
     * Class methods
     */

    initiate() {
        return new Promise((resolve, reject) => {
            let streamRoot = this.dom.createElementNS(Constants.NS_STREAM, 'stream:stream');
            streamRoot.setAttribute('xmlns', Constants.NS_JABBER_CLIENT);
            streamRoot.setAttribute('to', this.to);
            streamRoot.setAttribute('from', this.from);
            if (this.xmllang) {
                streamRoot.setAttribute('xml:lang', this.xmllang);
            }
            streamRoot.setAttribute('version', Constants.XMPP_VERSION);

            // Stream tag will be closed when XMPP communications needs to end
            resolve(this.xmlSerializer.serializeToString(streamRoot).replace('</stream:stream>', ''));
        });
    }

    /*
     * When initiating Stream has been acknowledged, server give us the new id
     * Then, we can negotiate Stream features.
     */
    ackInitiate(ackInitiateElement) {
        return new Promise((resolve, reject) => {
            this.attribute.id = ackInitiateElement.getAttribute('id');
            console.log('stream: received id: ' + this.id);

            /* TODO:
             * Whether or not the 'from' attribute is included, each entity MUST
             * verify the identity of the other entity before exchanging XML stanzas
             * with it, as described under Section 13.5.
             */

            /* TODO:
             * Whether or not the 'to' attribute is included, each entity MUST
             * verify the identity of the other entity before exchanging XML stanzas
             * with it, as described under Section 13.5.
             */

            resolve();
        });
    }

    restart() {
        return new Promise((resolve, reject) => {
            reject('stream: restart called, but not currently implemented.');
        });
    }

    negotiate() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    handle(xmppClient, message) {
        switch (message.nodeName) {
        case 'stream:features':
            // Server give the choice of multiple features.
            // Some can be mandatory (there's no particular specification to know if it's required or not)
            let features = message;

            // SASL is always mandatoy
            if (xmppClient.saslDone == false) {
                console.log('stream: server exposes SASL and client is not authenticated.');
                let saslMechanisms = features.getElementsByTagNameNS(Constants.NS_XMPP_SASL, 'mechanisms');
                if (saslMechanisms[0]) {
                    xmppClient.handleSASL(saslMechanisms[0]);
                }
            }
            else if (xmppClient.bindDone == false) {
                console.log('stream: server exposes bind and client is not bound.');
                // Bind is mandatory
                let bindElement = features.getElementsByTagNameNS(Constants.NS_XMPP_BIND, 'bind');
                if (bindElement[0]) {
                    xmppClient.bind();
                }
            }
            break;
        }
    }
}
