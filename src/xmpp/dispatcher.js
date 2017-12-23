/*
 * Dispatcher listen incoming messages for client and call the right actors.
 *
 */
class Dispatcher {
    constructor(xmppClient) {
        this.xmppClient = xmppClient;
        this.domParser = new DOMParser();
    }

    dispatch(event) {
        console.log('dispatcher raw received: ' + event.data);

        // Need to parse to DOM and to sanatize content
        let message = this.domParser.parseFromString(event.data, "text/xml").documentElement;

        // Need to check errors in string and ask to close
        switch (message.namespaceURI) {

        case Constants.NS_XMPP_FRAMING:
            this.xmppClient.stream.handle(this.xmppClient, message);
            break;

        case Constants.NS_JABBER_STREAM:
            this.xmppClient.stream.handle(this.xmppClient, message);
            break;

        case Constants.NS_XMPP_SASL:
            this.xmppClient.handleSASL(message);
            break;

        default:
            console.log('dispatcher unknown XML element' + message.nodeName);
            break;
        }
    }
}
