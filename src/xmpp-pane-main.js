console.log('Welcome to XMPP-Pane main background script.');

var aClient = Client({});
var clientSocket = null;

aClient.readConfig()
    .then(aClient.authenticate)
    .then(function (xmppSocket) {
        clientSocket = xmppSocket;
        console.log('background script, client socket: ' + clientSocket);
    });
