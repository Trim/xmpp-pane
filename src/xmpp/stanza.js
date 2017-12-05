/*
 * Stanza is implementation of XMPP stanzas as in defined in XMPP Core.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
class Stanza {
    constructor() {
        // XML DOM tree (cleared each time)
        this.dom = document.implementation.createDocument(null, null);

        // DOM Parser can parse XML string to DOM (created once)
        if (!this.domParser) {
            this.domParser = new DOMParser();
        }

        // Create a DOM to XML serializer (created once)
        if (!this.xmlSerializer) {
            this.xmlSerializer = new XMLSerializer();
        }
    }

    presence() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    message() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    iq() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
}
