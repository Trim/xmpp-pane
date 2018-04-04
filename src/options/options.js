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

function restoreOptions() {

    function setJidInput(result) {
        document.querySelector("#jid").value = result.jid || "";
    }

    let getJid = browser.storage.local.get("jid");
    getJid.then(setJidInput);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
