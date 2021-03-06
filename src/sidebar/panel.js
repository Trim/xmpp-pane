function panelRender(selector) {
    let template = document.querySelector('#' + selector + '-tmpl').innerHTML;
    Mustache.parse(template)

    document.querySelector("#" + selector).innerHTML = Mustache.render(template, panelStrings);
}

function displayFirstRun(response) {
    if (response.configured == true) {
        panel['firstrun'].className = 'panel disabled';
        chrome.runtime.sendMessage({
            'from': 'panel',
            'subject': 'isConnected'
        }, displayConnect);
    }
    else {
        panel['firstrun'].className = 'panel enabled';
        panel['connect'].className = 'panel disabled';
    }
}

function displayConnect(response) {
    if (response.connected == true) {
        clientConnected({
            connected: true
        });
    }
    else {
        panel['connect'].className = 'panel enabled';
    }
}

function clientConnected(response) {
    panel['info'].className = 'panel disabled';
    panel['firstrun'].className = 'panel disabled';
    panel['connect'].className = 'panel disabled';
    panel['pubsub'].className = 'panel disabled';

    if (response.step == 'initialized') {
        panel['info'].className = 'panel enabled';
        panel['info'].innerHTML = Mustache.render('<header><h1>Information</h1><article>Client initiated connection with server. Waiting for authentication…</article>', {});
        checkConnection();
    }
    else if (response.connected == true) {
        panel['error'].className = 'panel disabled'
        panel['info'].className = 'panel disabled'
        panel['pubsub'].className = 'panel enabled';
    }
    else if (response.connected == false) {
        if (response.error) {
            panel['error'].className = 'panel enabled';
            panel['error'].innerHTML = Mustache.render('<header><h1>Error</h1><article><header>{{error}}<br/>You could try to <a href="../options/options.html">modify</a> your settings.</article>', response);
        }
        else {
            // TODO: Should show the 'connect' panel
            // while we have no mean to store secret, show firstrun panel
            panel['firstrun'].className = 'panel enabled'
        }
    }
}

function sendConnect(ev) {
    browser.runtime.sendMessage({
        'from': 'panel',
        'subject': 'connect'
    }, clientConnected);
}

function sendDisconnect(ev) {
    browser.runtime.sendMessage({
        'from': 'panel',
        'subject': 'disconnect'
    }, clientConnected);
}

function checkConnection() {
    browser.runtime.sendMessage({
        'from': 'panel',
        'subject': 'isConnected'
    }, clientConnected);
}

function refreshNetwork(response) {
    if (!response.error) {
        let xmppNet = document.getElementById('xmppNet');
        let pubsubNet = {
            'pubsub': new Array()
        }

        response.network.pubsub.forEach((entity, jid) => {
            let features = new Array();

            entity['metadata']['features'].forEach((feature) => {
                features.push({
                    'feature': feature
                });
            });

            pubsubNet['pubsub'].push({
                'name': entity['metadata']['name'] || jid,
                'jid': jid,
                'features': features
            });

        });

        xmppNet.innerHTML = Mustache.render(document.querySelector('#xmppNet-tmpl').innerHTML, pubsubNet);
    }
    else {
        panel['error'].className = 'panel enabled';
        panel['error'].innerHTML = response.error.message + '(' + response.error.code + ')';
    }

}

function exploreServer(ev) {
    browser.runtime.sendMessage({
        'from': 'panel',
        'subject': 'exploreServer',
        'payload': document.getElementById('exploreServer').value
    }, refreshNetwork);
}

// Render the page

let panelStrings = {
    'first-run-welcome': '',
    'first-run-configure': '',
    'disconnected-text': '',
    'disconnect-label': '',
    'connect-back-button': '',
    'pubsub-title': '',
    'pubsub-explore-server': '',
    'pubsub-explore-placeholder': '',
    'pubsub-explore-button': '',
}

for (const string of Object.keys(panelStrings)) {
    panelStrings[string] = browser.i18n.getMessage(string);
}

panelRender('firstrunpanel');
panelRender('connectpanel');
panelRender('pubsubpanel');

// Read page and apply events

panel = {
    error: document.getElementById('errorpanel'),
    info: document.getElementById('infopanel'),
    connect: document.getElementById('connectpanel'),
    firstrun: document.getElementById('firstrunpanel'),
    pubsub: document.getElementById('pubsubpanel')
}

for (let pane in panel) {
    pane.className = 'panel disabled';
}

connectButtons = document.getElementsByClassName('connectClient');

for (let key = 0; key < connectButtons.length; key++) {
    connectButtons[key].onclick = sendConnect;
}

disconnectButtons = document.getElementsByClassName('disconnectClient');

for (let key = 0; key < disconnectButtons.length; key++) {
    disconnectButtons[key].onclick = sendDisconnect;
}

exploreForm = document.getElementById('explore');
exploreForm.addEventListener('submit', (event) => {
    exploreServer(event);
    event.preventDefault();
}, false);

let panelListener = function (message, sender, sendRepsone) {
    let asynchroneResponse = false;

    switch (message.subject) {
    case "clientInitialized":
        if (message.from === 'xmpp-pane') {
            checkConnection();
        }
        break;
    case "refreshNetwork":
        // TODO: Update network panel if it's the current one
        break;
    }

    return asynchroneResponse;
}

// External message listener

browser.runtime.onMessage.addListener(panelListener)

browser.runtime.sendMessage({
    'from': 'panel',
    'subject': 'isConfigured'
}, displayFirstRun);
