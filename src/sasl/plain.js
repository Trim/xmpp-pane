class SASLPLAIN {
    constructor() {}

    /*
     * Return SASL message to run PLAIN authentication
     * 
     * authcid: identity used to authenticate
     * password: password to authenticate
     * authzid: idendity to act as (for case of impersonation)
     */
    authenticate(authcid, password, authzid = null) {
        return new Promise((resolve, reject) => {
            // Minimal checks on authzid and password state
            let sanityError = this.sanityCheck(authcid, password, authzid);

            if (sanityError) {
                reject(sanityError);
            }

            let message = "";
            // authzid can be null when the server has to induce authzid from current credentials
            // (like when using client TLS certificate)
            if (authzid) {
                message = authzid + "\0";
            }

            message = message + authcid + "\0" + password;

            resolve(message);
        });
    }

    sanityCheck(authcid, password, authzid = null) {
        let errorMessage = null;
        let nullChar = "\0";

        if (!password
            || password == "") {
            errorMessage = "SASL-PLAIN: password is not available."
        }

        if (password
            && password.indexOf(nullChar) > -1) {
            errorMessage = "SASL-PLAIN: password contains NUL char."
        }

        if (!authcid
            || password == "") {
            errorMessage = "SASL-PLAIN: authentication client is not available."
        }

        if (authcid
            && authcid.indexOf(nullChar) > -1) {
            errorMessage = "SASL-PLAIN: authentication client contains NUL char."
        }

        if (authzid
            && authzid.indexOf(nullChar) > -1) {
            errorMessage = "SASL-PLAIN: authorization id contains NUL char."
        }

        return errorMessage;
    }
}
