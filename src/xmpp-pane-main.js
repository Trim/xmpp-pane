console.log('Welcome to XMPP-Pane main background script.');

retrieveConfig = function () {
    return new Promise((resolve, reject) => {
        let config = {};

        function setJid(localStorage) {
            console.log('xmpp-pane-main: local storage found jid: ' + localStorage.jid);

            if (localStorage.jid) {
                config.jid = localStorage.jid;
                config.fulljid = config.jid + '/xmpp-pane_' + Date.now();
                let splitedJid = config.jid.split('@');
                config.localpart = splitedJid[0];
                config.domainpart = splitedJid[1];
            }

            console.log('xmpp-pane-main: full jid: ' + config.fulljid);
            console.log('xmpp-pane-main: local part: ' + config.localpart);
        }

        function setPassword(localStorage) {
            console.log('xmpp-pane-main: local storage found password!');
            if (localStorage.password) {
                config.password = localStorage.password;
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
                        resolve(config);
                    }
                    else {
                        reject(`xmpp-pane-main: Some configuration hasn't been found, please configure xmpp-pane first`);
                    }
                }));
    });
};

retrieveConfig()
    .then((_config) => {
        let xmppPaneClient = new Client(_config);
        _config = null;

        xmppPaneClient.connect();
    });
