/*
 * Entity as defined by XMPP Discover
 *
 * [XEP-0030](https://xmpp.org/extensions/xep-0030.html)
 */
class Entity {
    constructor() {
        this.identities = [];
        // Features and protocols supported by the entity
        this.features = [];
        this.protocols = {};
        // Items owned by the entity
        this.items = {};

        // Childs are Entity linked to this one
        this.childs = {};
    }

    /*
     * _identity is a <identity> XML Node
     */
    addIdentity(_identity, _xmllang) {
        let type = _identity.getAttribute('type');
        let category = _identity.getAttribute('category');
        let xmllang = _identity.getAttribute('xml:lang');
        let name = _identity.getAttribute('name');

        let identity;
        let found = false;
        for (identity of this.identities){
            if (identity.type === type
                && identity.category === category)
            {
                found = true;
                break;
            }
        }

        if (found) {
            if (xmllang === _xmllang
                && xmllang !== identity.xmllang)
            {
                identity.name = name;
                identity.xmllang = xmllang;
            }
        }
        else {
            this.identities.add({
                'type': type,
                'category': category,
                'xmllang': xmllang,
                'name': name
            });
        }
    }

    /*
     * _feature is a <feature> XML Node
     */
    addFeature(_feature) {
        this.features.push(_feature.getAttribute('var'));
    }
}
