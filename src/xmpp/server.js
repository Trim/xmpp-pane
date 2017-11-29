var Server = function (_domain) {
    this.domain = _domain;

    this.hello = function () {
        console.log('Hello, I am ' + this.domain + ' xmpp server.');
    }
}

