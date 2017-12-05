/*
 * Stream is implementation of XMPP stream as in defined in XMPP Core.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
class Stream {
    constructor(_config) {
        // Allow to define XMPP Core attributes directly
        this.from = _config.from;
        this.to = _config.to;

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

    /*
     * Attributes defined by XMPP Core: from, to 
     */
    get from() {
        return this.from;
    }

    set from(_from) {
        this.from = _from;
    }

    get to() {
        return this.to;
    }

    set to(_to) {
        this.to = _to;
    }

    /*
     * Public attributes not defined by XMPP Core
     */


    /*
     * Class methods
     */

    initiate() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    restart() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    negotiate() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    authenticate() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    bind() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
}
