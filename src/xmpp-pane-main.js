console.log('Welcome to XMPP-Pane main background script.');

var xmppPaneClient = new Client();

xmppPaneClient.config()
    .then(xmppPaneClient.connect);
