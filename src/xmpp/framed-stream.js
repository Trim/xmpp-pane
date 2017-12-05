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
    open() {
        return new Promise((resolve, reject) => {
            let open = this.dom.createElementNS(Constants.NS_XMPP_FRAMING, "open");
            open.setAttribute("to", this.to);
            open.setAttribute("version", "1.0");

            resolve(this.xmlSerializer.serializeToString(open));
        });
    }

    /*
     * <close /> is used to close a stream header before WebSocket close
     *
     * [RFC-7395] Section-3.6
     */
    close() {
        return new Promise((resolve, reject) => {
            let close = this.dom.createElementNS(Constants.NS_XMPP_FRAMING, "close");
            close.setAttribute("to", this.to);
            close.setAttribute("version", "1.0");

            resolve(this.xmlSerializer.serializeToString(close));
        });
    }
}
