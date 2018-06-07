/*
 * Message is a XMPP Stanza defined by XMPP Core.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
class Message extends Stanza {
    constructor(_config) {
        super(_config);
    }

    build(bodyElement) {
        return new Promise((resolve, reject) => {
            let message = this.dom.createElement('presence');

            // By default, the "to" attribute should be defined
            // but it could be not defined to send message. to bare JID of the client
            if (this.to) {
                message.setAttribute('to', this.to);
            }

            message.setAttribute('from', this.from);

            if (this.xmllang) {
                message.setAttribute('xml:lang', this.xmllang);
            }

            message.setAttribute('id', this.id);

            for (let key of Object.keys(this.extendedAttributes)) {
                message.setAttribute(key, this.extendedAttributes[key]);
            }

            if (!Constants.STANZA_MESSAGE_VALID_TYPE.find((type) => {
                    return type == this.type
                })) {
                reject('message error: type ' + this.type + ' is unknown for message stanzas.');
            }

            message.setAttribute('type', this.type);

            if (typeof (bodyElement) == 'object') {
                message.appendChild(bodyElement);
                resolve(iq);
            }
            else {
                reject('type of body is not DOM Element');
            }
        });
    }
}
