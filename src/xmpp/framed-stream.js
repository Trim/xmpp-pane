/*
 * FramedStream is XMPP stream specialized and defined by the XMPP Subprotocol for WebSocket.
 *
 * [RFC-7395]: https://tools.ietf.org/html/rfc7395
 */
class FramedStream extends Stream {
    constructor(_config) {
        super(_config);
    }

    /*
     * <open /> is used to open a stream header after WebSocket initialization
     *
     * [RFC-7395] Section-3.4
     */
    get open() {
        return new Promise((resolve, reject) => {
            let open = this.config.dom.createElementNS(Constants.NS_XMPP_FRAMING, "open");
            open.setAttribute("to", this.config.to);
            open.setAttribute("version", "1.0");

            resolve(this.config.xmlSerializer.serializeToString(open));
        });
    }

    /*
     * <close /> is used to close a stream header before WebSocket close
     *
     * [RFC-7395] Section-3.6
     */
    get close() {
        return new Promise((resolve, reject) => {
            let close = this.config.dom.createElementNS(Constants.NS_XMPP_FRAMING, "close");
            close.setAttribute("to", this.config.to);
            close.setAttribute("version", "1.0");

            resolve(this.config.xmlSerializer.serializeToString(close));
        });
    }
}
