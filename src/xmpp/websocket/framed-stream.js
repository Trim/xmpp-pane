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
    initiate() {
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

            //this.attribute.id = response.id; // Store id given by server
            resolve(open);
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
            // Save we are closing to avoid send again the same message
            this.isClosing = true;

            let close = this.dom.createElementNS(Constants.NS_XMPP_FRAMING, "close");
            close.setAttribute("to", this.to);
            close.setAttribute("version", Constants.XMPP_VERSION);

            resolve(close);
        });
    }

    /*
     * Take action on XMPP frame element
     */
    handle(xmppClient, message) {
        switch (message.nodeName) {
        case 'open':
            // Server aknowleged our open initiate
            this.ackInitiate(message);
            break;

        case 'close':
            // Initiate close when receiving <close>
            // <close> can contain see-other-uri to redirect the stream
            // (be careful to keep same security at least in that case)
            if (this.isClosing) {
                // Well we asked to close and the close has been aknowleged
                console.log('framed-stream: received <close> after self-initiated close: reinit client.');
                xmppClient.init();
            }
            else {
                // We didn't initiate the close, call close and reinit directly the client
                console.log('framed-stream: received <close> from server: acknowledge and reinit client.');
                xmppClient.close();
                xmppClient.init();
            }
            break;
        default:
            super.handle(xmppClient, message);
            break
        }
    }
}
