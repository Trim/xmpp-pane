console.log('Welcome to XMPP-Pane main background script.');

var aClient = Client({});

aClient.load().then(aClient.hello);

var aServer = new Server('adorsaz.ch');
aServer.hello();
