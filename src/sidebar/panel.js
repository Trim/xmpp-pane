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
        chrome.runtime.sendMessage('isConnected', displayConnect);
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
        window.setTimeout(checkConnection, 100);
    }

    if (response.connected == true) {
        panel['error'].style.display = 'none';
        panel['info'].style.display = 'none';
        panel['pubsub'].style.display = 'block';
    }
    else if (response.connected == false) {
        panel['error'].style.display = 'block';
        panel['error'].innerHTML = response.error;
    }
}

function sendConnect(ev) {
    chrome.runtime.sendMessage('connect', clientConnected);
}

function checkConnection() {
    chrome.runtime.sendMessage('isConnected', clientConnected);
}

connectButtons = document.getElementsByClassName('connectClient');

for (let key = 0; key < connectButtons.length; key++) {
    connectButtons[key].onclick = sendConnect;
}

let panelListener = function (message, sender, sendRepsone) {
    let asynchroneResponse = false;

    if (message == "refreshNetwork") {
        // TODO: Update network panel if it's the current one
    }

    return asynchroneResponse;
}

chrome.runtime.onMessage.addListener(panelListener)

chrome.runtime.sendMessage('isConfigured', displayFirstRun);
