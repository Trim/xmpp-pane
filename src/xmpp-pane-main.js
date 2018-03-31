console.log('Welcome to XMPP-Pane main background script.');

retrieveConfig = function () {
    return new Promise((resolve, reject) => {
        let config = {};

        function setJid(localStorage) {

            if (localStorage.jid) {
                config.jid = localStorage.jid;
                config.fulljid = null;
                let splitedJid = config.jid.split('@');
                config.localpart = splitedJid[0];
                config.domainpart = splitedJid[1];

                console.log('xmpp-pane-main: jid: ' + config.jid);
                console.log('xmpp-pane-main: local part: ' + config.localpart);
                console.log('xmpp-pane-main: domain part: ' + config.domainpart);
            }
        }

        function setPassword(localStorage) {
            if (localStorage.password) {
                config.password = localStorage.password;
                console.log('xmpp-pane-main: local storage found password.');
            }
        }

        function onError(error) {
            console.log('xmpp-pane-main: error:' + error);
            reject(error);
        }

        let getJid = browser.storage.local.get("jid");
        let getPassword = browser.storage.local.get("password");

        getJid.then(setJid, onError)
            .then(getPassword.then(setPassword, onError)
                .then(() => {
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
                }));
    });
};

var xmppPaneClient = null;

xmppClientListener = function (message, sender, sendResponse) {
    let asynchroneResponse = false;

    switch (message) {
    case 'isConfigured':
        asynchroneResponse = true;
        retrieveConfig()
            .then(
                function (config) {
                    sendResponse({
                        configured: true
                    });
                },
                function (error) {
                    sendResponse({
                        configured: false
                    });
                }
            );
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
        retrieveConfig()
            .then(
                function (_config) {
                    xmppPaneClient = new Client(_config);
                    _config = null;

                    xmppPaneClient.connect()
                        .then(
                            function (initialized) {
                                sendResponse({
                                    step: 'initialized'
                                });
                            },
                            function (error) {
                                sendResponse({
                                    connected: false,
                                    error: error
                                });
                            });
                },
                function (error) {
                    sendResponse({
                        connected: false,
                        error: error
                    });
                }
            );
        break;
    }

    if (asynchroneResponse) {
        return true;
    }
}

chrome.runtime.onMessage.addListener(xmppClientListener)
