/*
 * Stream is implementation of XMPP stream as in defined in XMPP Core.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
class Stream {
    constructor(_config) {
        this.config = _config;

        // XML DOM tree (cleared each time)
        this.config.dom = document.implementation.createDocument(null, null);

        // DOM Parser can parse XML string to DOM (created once)
        if (!this.config.domParser) {
            this.config.domParser = new DOMParser();
        }

        // Create a DOM to XML serializer (created once)
        if (!this.config.xmlSerializer) {
            this.config.xmlSerializer = new XMLSerializer();
        }
    }

    get initiate() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    get restart() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    get negotiate() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    get authenticate() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    get bind() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
}
