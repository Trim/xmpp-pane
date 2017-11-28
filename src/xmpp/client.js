var Account = function (_jid) {
    this.jid = _jid;
    this.fulljid = _jid + '/xmpp-pane';
    this.localpart = _jid.split('@')[0];
    this.domainpart = _jid.split('@')[1];

    this.hello = function () {
        console.log('Hello, I am ' + this.localpart + ' from ' + this.domainpart + ' represented by ' + this.fulljid);
    }
}

