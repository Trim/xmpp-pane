/*
 * Stanza is implementation of XMPP stanzas as in defined in XMPP Core.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
class Stanza {
    constructor(_config) {
        // Allow to define XMPP Core attributes directly
        this.attribute = {};
        this.attribute.from = _config.from;
        this.attribute.to = _config.to;
        this.attribute.id = _config.id;
        // prefered language for human readable texts (if server support same language)
        this.attribute.xmllang = _config.xmllang;
        this.attribute.type = _config.type;

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

        this.extendedAttributes = {};
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

    get type() {
        return this.attribute.type;
    }

    /*
     * Extended attributes management
     */
    addExtendedAttribute(_name, _value) {
        this.extendedAttributes[_name] = _value;
    }
}
