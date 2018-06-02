console.log('Welcome to XMPP-Pane main background script.');

retrieveConfig = function (jid, password, websocketURL) {
    return new Promise((resolve, reject) => {
        let config = {};

        if (jid) {
            config.jid = jid;
            config.fulljid = null;
            let splitedJid = config.jid.split('@');
            config.localpart = splitedJid[0];
            config.domainpart = splitedJid[1];

            console.log('xmpp-pane-main: jid: ' + config.jid);
            console.log('xmpp-pane-main: local part: ' + config.localpart);
            console.log('xmpp-pane-main: domain part: ' + config.domainpart);
        }

        if (password) {
            config.password = password;
            console.log('xmpp-pane-main: found password.');
        }

        if (websocketURL) {
            config.websocketURL = websocketURL;
        }
        else {
            config.websocketURL = null;
        }

        if (config.jid
            && config.localpart
            && config.domainpart
            && config.password) {
            config.xmllang = browser.i18n.getUILanguage();
            resolve(config);
        }
        else {
            reject("xmpp-pane-main: Some configuration hasn't been found, please configure xmpp-pane first.");
        }
    });
};

let xmppPaneClient = null;

xmppClientListener = function (message, sender, sendResponse) {
    let asynchroneResponse = false;

    switch (message.subject) {
    case 'isConfigured':
        if (xmppPaneClient) {
            sendResponse({
                configured: true
            });
        }
        else {
            sendResponse({
                configured: false
            });
        }
        break;

    case 'isConnected':
        if (xmppPaneClient) {
            if (xmppPaneClient.isConnected()) {
                sendResponse({
                    connected: true
                });
            }
            else {
                let connectionError = xmppPaneClient.connectionError()
                if (!connectionError) {
                    sendResponse({
                        step: 'initialized'
                    });
                }
                else {
                    sendResponse({
                        connected: false,
                        error: connectionError
                    });
                }
            }
        }
        else {
            sendResponse({
                connected: false
            });
        }
        break;

    case 'connect':
        asynchroneResponse = true;
        retrieveConfig(message.jid, message.password, message.websocketURL)
            .then(
                (_config) => {
                    xmppPaneClient = new Client(_config);
                    _config = null;

                    xmppPaneClient.connect()
                        .then(
                            (initialized) => {
                                if (message.from !== 'panel') {
                                    browser.runtime.sendMessage({
                                        'from': 'xmpp-pane',
                                        'subject': 'clientInitialized'
                                    })
                                }

                                sendResponse({
                                    step: 'initialized'
                                });
                            },
                            (error) => {
                                sendResponse({
                                    connected: false,
                                    error: error
                                });
                            });
                },
                (error) => {
                    sendResponse({
                        connected: false,
                        error: error
                    });
                }
            );
        break;

    case 'exploreServer':
        asynchroneResponse = true;
        xmppPaneClient.discoPubsubService(message.payload)
            .then(
                (network) => {
                    sendResponse({
                        'step': 'discovered',
                        'network': xmppPaneClient.network
                    });
                },
                (error) => {
                    sendResponse({
                        'step': 'failed',
                        'error': error
                    });
                });
        break;
    }

    if (asynchroneResponse) {
        return true;
    }
}

browser.runtime.onMessage.addListener(xmppClientListener)
