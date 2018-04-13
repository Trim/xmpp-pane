panel = {
    error: document.getElementById('errorpanel'),
    info: document.getElementById('infopanel'),
    connect: document.getElementById('connectpanel'),
    firstrun: document.getElementById('firstrunpanel'),
    pubsub: document.getElementById('pubsubpanel')
}

for (let pane in panel) {
    panel[pane].style.display = 'none';
}

function displayFirstRun(response) {
    if (response.configured == true) {
        panel['firstrun'].style.display = 'none';
        chrome.runtime.sendMessage({
            'from': 'panel',
            'subject': 'isConnected'
        }, displayConnect);
    }
    else {
        panel['firstrun'].style.display = 'block';
        panel['connect'].style.display = 'none';
    }
}

function displayConnect(response) {
    if (response.connected == true) {
        clientConnected({
            connected: true
        });
    }
    else {
        panel['connect'].style.display = 'block';
    }
}

function clientConnected(response) {
    panel['info'].style.display = 'none';
    panel['firstrun'].style.display = 'none';
    panel['connect'].style.display = 'none';

    if (response.step == 'initialized') {
        panel['info'].style.display = 'block';
        panel['info'].innerHTML = 'Client initiated connection with server. Waiting for authentication…'
        checkConnection();
    }
    else if (response.connected == true) {
        panel['error'].style.display = 'none';
        panel['info'].style.display = 'none';
        panel['pubsub'].style.display = 'block';
    }
    else if (response.connected == false) {
        panel['error'].style.display = 'block';
        panel['error'].innerHTML = response.error + '<br/>You could try to <a href="../options/options.html">modify</a> your settings';
    }
}

function sendConnect(ev) {
    browser.runtime.sendMessage({
        'from': 'panel',
        'subject': 'connect'
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
        xmppNet.innerHTML = response.toString();
    }
    else {
        panel['error'].style.display = 'block';
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

connectButtons = document.getElementsByClassName('connectClient');

for (let key = 0; key < connectButtons.length; key++) {
    connectButtons[key].onclick = sendConnect;
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

browser.runtime.onMessage.addListener(panelListener)

browser.runtime.sendMessage({
    'from': 'panel',
    'subject': 'isConfigured'
}, displayFirstRun);
