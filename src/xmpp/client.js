var Client = function(_config) {
    return {
        load: function () {
            return new Promise ((resolve, reject) => {
                let config = _config;

                function setJid(localStorage) {
                    console.log('client: local storage found jid: ' + localStorage.jid);

                    if (localStorage.jid) {
                        config.jid = localStorage.jid;
                        config.fulljid = config.jid + '/xmpp-pane';
                        let splitedJid = config.jid.split('@');
                        config.localpart = splitedJid[0];
                        config.domainpart = splitedJid[1];
                    }

                    console.log('client: local part: ' + config.localpart);
                }

                function setPassword(localStorage) {
                    console.log('client: local storage found password: ' + localStorage.password);
                    if (localStorage.password) {
                        config.password = localStorage.password;
                    }
                    //resolve(config);
                }

                function onError(error) {
                    console.log('client: error:' + error);
                    reject(error);
                }

                let getJid = browser.storage.local.get("jid");
                let getPassword = browser.storage.local.get("password");

                getJid.then(setJid, onError)
                    .then(getPassword.then(setPassword, onError)
                        .then(() => {
                            resolve(config);
                        }));
            })
        },

        hello: function (_config) {
            let config = _config;
            console.log('Hello, I am ' + config.localpart + ' from ' + config.domainpart + ' represented by ' + config.fulljid);
            console.log('My password is: ' + config.password);
        }
    }
}

