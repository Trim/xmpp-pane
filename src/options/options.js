function saveOptions(e) {
    e.preventDefault();

    function storePassword(hash) {
        browser.storage.local.set({
            password: hash
        });
    }

    function digestError(error) {
        console.log('options: error on computing password hash: ' + error);
    }

    // Save new password if required
    let passwordInput = document.querySelector("#password");
    if (passwordInput && passwordInput.value !== '') {
        // TODO Currently, we only implement PLAIN authentication, so we need PLAIN password
        //let bufferPassword = new TextEncoder("utf-8").encode(passwordInput.value);
        //crypto.subtle.digest('SHA-512', bufferPassword)
        //    .then(storePassword, digestError);
        storePassword(passwordInput.value);

        // Empty password field to be coherent with the placeholder
        passwordInput.value = null;
    }

    // Save jid
    browser.storage.local.set({
        jid: document.querySelector("#jid").value
    });

    // Try to connect
    browser.runtime.sendMessage({
        'from': 'options',
        'subject': 'connect'
    });
}

function renderForm() {
    let optionForm = Mustache.render(template, optionStrings);
    document.querySelector("#target").innerHTML = optionForm;

    document.querySelector("form").addEventListener("submit", saveOptions);
}

function restoreOptions() {

    function setJidInput(result) {
        optionStrings['jid'] = result.jid;
    }

    let getJid = browser.storage.local.get("jid");
    getJid.then(setJidInput).then(renderForm);
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
    'save-start': ''
}

for (const string of Object.keys(optionStrings)) {
    optionStrings[string] = browser.i18n.getMessage(string);
}

let template = document.querySelector("#form").innerHTML;

// Add logic to the form
document.addEventListener("DOMContentLoaded", restoreOptions);
