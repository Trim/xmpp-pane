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
     * As websocket has to send complete XML document, this replace the opening
     * part of <stream:stream> tag from RFC-6120 which is closed only on end of XMPP session.
     *
     * [RFC-7395] Section-3.4
     */
    open() {
        return super.initiate()
            .then((streamElement) => {
                return new Promise((resolve, reject) => {
                    let open = this.dom.createElementNS(Constants.NS_XMPP_FRAMING, "open");
                    open.setAttribute("from", this.from);
                    open.setAttribute("to", this.to);
                    if (this.id) {
                        open.setAttribute("id", this.id);
                    }
                    if (this.xmllang) {
                        open.setAttribute("xml:lang", this.xmllang);
                    }
                    open.setAttribute("version", Constants.XMPP_VERSION);

                    resolve(this.xmlSerializer.serializeToString(open));
                });
            });
    }

    /*
     * <close /> is used to close a stream header before WebSocket close
     *
     * As websocket has to send complete XML document, this replace the closing part
     * of </stream:stream> tag from RFC-6120 which closes the current XMPP session.
     *
     * [RFC-7395] Section-3.6
     */
    close() {
        return new Promise((resolve, reject) => {
            let close = this.dom.createElementNS(Constants.NS_XMPP_FRAMING, "close");
            close.setAttribute("to", this.to);
            close.setAttribute("version", Constants.XMPP_VERSION);

            resolve(this.xmlSerializer.serializeToString(close));
        });
    }
}
