/*
 * Entity as defined by XMPP Discover
 *
 * This class is used to parse data received from XMPP Discover.
 * Data will be saved then in the Network.
 * Then instances of this class are droped.
 *
 * [XEP-0030](https://xmpp.org/extensions/xep-0030.html)
 */
class Entity {
    constructor(_jid) {
        this.jid = _jid;
        // Services supported by the Entity
        // key: category and type of the identity
        // value: identity name
        this.identities = new Map();
        // Features and protocols supported by the entity
        this.features = new Set();
        this.protocols = new Map();
    }

    get identityMap() {
        return this.identities;
    }

    get featureSet() {
        return this.features;
    }

    /*
     * _identity is a <identity> XML Node
     */
    addIdentity(_identity) {
        let type = _identity.getAttribute('type');
        let category = _identity.getAttribute('category');
        let name = _identity.getAttribute('name');
        let node = _identity.getAttribute('node');

        let idKey = {
            'type': type,
            'category': category,
            'node': node
        };
        let identity = this.identities.get(idKey)

        if (identity) {
            identity = name;
        }
        else {
            this.identities.set(idKey, name);
        }
    }

    /*
     * _feature is a <feature> XML Node
     */
    addFeature(_feature) {
        this.features.add(_feature.getAttribute('var'));
    }
}
