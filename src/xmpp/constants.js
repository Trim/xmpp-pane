class Constants {
    /*
     * XMPP Core
     * https://tools.ietf.org/html/rfc6120
     */
    static get XMPP_VERSION() {
        return "1.0";
    }
    static get NS_JABBER_CLIENT() {
        return "jabber:client";
    }
    static get NS_JABBER_SERVER() {
        return "jabber:server";
    }
    static get NS_JABBER_STREAM() {
        return "http://etherx.jabber.org/streams";
    }
    static get NS_XMPP_SASL() {
        return "urn:ietf:params:xml:ns:xmpp-sasl";
    }
    static get CLIENT_PREF_SASL_MECHANISM() {
        return ["PLAIN"];
    }
    static get NS_XMPP_BIND() {
        return "urn:ietf:params:xml:ns:xmpp-bind";
    }
    static get STANZA_MESSAGE_VALID_TYPE() {
        return ["error"];
    }
    static get STANZA_PRESENCE_VALID_TYPE() {
        return ["error"];
    }
    static get STANZA_IQ_VALID_TYPE() {
        return ["get", "set", "result", "error"];
    }

    /*
     * XMPP Subprotocol for WebSocket
     * https://tools.ietf.org/html/rfc7395
     */
    static get XMPP_ALTCONNECTIONS_WEBSOCKET() {
        return "urn:xmpp:alt-connections:websocket";
    }
    static get NS_XMPP_FRAMING() {
        return "urn:ietf:params:xml:ns:xmpp-framing";
    }

    /*
     * XMPP Disco
     * https://xmpp.org/extensions/xep-0030.html
     */
    static get NS_DISCO_INFO() {
        return "http://jabber.org/protocol/disco#info";
    }
    static get NS_DISCO_ITEMS() {
        return "http://jabber.org/protocol/disco#items";
    }
}
