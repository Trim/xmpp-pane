/*
 * Presence is a XMPP Stanza defined by XMPP Core.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
class Presence extends Stanza {
    constructor(_config) {
        super(_config);
    }

    build(bodyElement) {
        return new Promise((resolve, reject) => {
            let presence = this.dom.createElement('presence');

            // By default, the "to" attribute is not used to broadcast presence to every subscribed entities
            // However client MAY set "to" to route the presence to a recipient
            if (this.to) {
                presence.setAttribute('to', this.to);
            }

            presence.setAttribute('from', this.from);

            if (this.xmllang) {
                presence.setAttribute('xml:lang', this.xmllang);
            }

            presence.setAttribute('id', this.id);

            for (let key of Object.keys(this.extendedAttributes)) {
                presence.setAttribute(key, this.extendedAttributes[key]);
            }

            if (!Constants.STANZA_PRESENCE_VALID_TYPE.find((type) => {
                    return type == this.type
                })) {
                reject('presence error: type ' + this.type + ' is unknown for presence stanzas.');
            }

            presence.setAttribute('type', this.type);

            if (typeof (bodyElement) == 'object') {
                presence.appendChild(bodyElement);
                resolve(iq);
            }
            else {
                reject('type of body is not DOM Element');
            }
        });
    }
}
