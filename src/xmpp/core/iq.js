/*
 * IQ is a XMPP Stanza defined by XMPP Core.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
class IQ extends Stanza {
    constructor(_config) {
        super(_config);
    }

    build(bodyElement) {
        return new Promise((resolve, reject) => {
            let iq = this.dom.createElement('iq');
            iq.setAttribute('to', this.to);
            iq.setAttribute('from', this.from);

            if (this.xmllang) {
                iq.setAttribute('xml:lang', this.xmllang);
            }

            iq.setAttribute('id', this.id);

            if (!Constants.STANZA_IQ_VALID_TYPE.find((type) => {
                    return type == this.type
                })) {
                reject('iq error: type ' + this.type + ' is unknown for IQ stanzas.');
            }

            iq.setAttribute('type', this.type);

            if (typeof (bodyElement) == 'object') {
                iq.appendChild(bodyElement);
                resolve(iq);
            }
            else {
                reject('type of body is not DOM Element');
            }
        });
    }
}
