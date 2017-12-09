console.log('Welcome to XMPP-Pane main background script.');

var xmppPaneClient = new Client();
var clientSocket = null;

xmppPaneClient.config
    .then(xmppPaneClient.connect);
