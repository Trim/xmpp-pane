panel = {
    error: document.getElementById('errorpanel'),
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
            success: true
        });
    }
    else {
        panel['connect'].style.display = 'block';
    }
}

function clientConnected(response) {
    if (response.success == true) {
        panel['firstrun'].style.display = 'none';
        panel['connect'].style.display = 'none';
        panel['error'].style.display = 'none';
        panel['pubsub'].style.display = 'block';
    }
    else {
        panel['error'].style.display = 'block';
        panel['error'].innerHTML = response.error;
    }
}

function sendConnect(ev) {
    chrome.runtime.sendMessage('connect', clientConnected);
}

connectButtons = document.getElementsByClassName('connectClient');

for (let key = 0; key < connectButtons.length; key++) {
    connectButtons[key].onclick = sendConnect;
}

chrome.runtime.sendMessage('isConfigured', displayFirstRun);
