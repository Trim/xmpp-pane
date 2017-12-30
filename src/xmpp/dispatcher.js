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
        console.log('dispatcher: raw received: ' + event.data);

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
            console.log('dispatcher: unknown namespaceURI element: ' + message.namespaceURI);
            console.log('dispatcher: looking for known nodeName: ' + message.nodeName)
            switch (message.nodeName) {
            case 'iq':
                console.log('dispatcher: IQ stanza received, looking unique child: ' + message.children[0].nodeName);
                switch (message.children[0].nodeName) {
                case 'bind':
                    this.xmppClient.handleBind(message);
                    break;
                default:
                    console.log('dispatcher: unkown IQ element');
                    break;
                }
                break;

            default:
                console.log('dispatcher: uknown namespace and nodename, nothing todo.');
                break;

            }
            break;
        }
    }
}
