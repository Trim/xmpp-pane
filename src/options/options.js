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
    let rawPassword = document.querySelector("#password").value;
    if (rawPassword) {
        let bufferPassword = new TextEncoder("utf-8").encode(rawPassword);
        crypto.subtle.digest('SHA-512', bufferPassword)
            .then(storePassword, digestError);

        // Empty password field to be coherent with the placeholder
        rawPassord.value = null;
    }

    // Save jid
    browser.storage.local.set({
        jid: document.querySelector("#jid").value
    });
}

function restoreOptions() {

    function setJidInput(result) {
        document.querySelector("#jid").value = result.jid || "";
    }

    function onError(error) {
        console.log('options: error:' + error);
    }

    let getJid = browser.storage.local.get("jid");
    getJid.then(setJidInput, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
