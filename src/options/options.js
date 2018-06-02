function connect(e) {
    e.preventDefault();

    // Get jid
    // TODO validate input, even if browser should check it's at least formated as mail
    let jid = document.querySelector("#jid").value;

    // Get password
    let password = document.querySelector("#password").value;

    // Get WebSocket URL
    let websocketURL = document.querySelector("#websocket").value;

    // Try to connect
    browser.runtime.sendMessage({
        'from': 'options',
        'subject': 'connect',
        'jid': jid,
        'password': password,
        'websocketURL': websocketURL
    });
}

// Render the page
let optionStrings = {
    'authenticate': '',
    'xmpp-identifier-label': '',
    'xmpp-identifier-placeholder': '',
    'password-label': '',
    'password-placeholder': '',
    'websocket-label': '',
    'websocket-placeholder': '',
    'websocket-help': '',
    'optional': '',
    'why-no-remember-authentication': '',
    'connect': ''
}

for (const string of Object.keys(optionStrings)) {
    optionStrings[string] = browser.i18n.getMessage(string);
}

let template = document.querySelector("#form").innerHTML;

Mustache.parse(template);
document.querySelector("#target").innerHTML = Mustache.render(template, optionStrings);

document.querySelector("form").addEventListener("submit", connect);
