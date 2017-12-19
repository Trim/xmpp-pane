class SASLFactory {
    constructor(mechanism) {
        if (mechanism == 'PLAIN') {
            this.mechanism = new SASLPLAIN();
        }
    }

    getMessage(authzid, password, authcid = null) {
        return this.mechanism.authenticate(authzid, password, authcid);
    }
}
