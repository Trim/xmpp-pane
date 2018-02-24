/*
 * Entity as defined by XMPP Discover
 *
 * [XEP-0030](https://xmpp.org/extensions/xep-0030.html)
 */
class Entity {
    constructor() {
        this.identity = {
            type: null;
            category: null;
        };
        // Features and protocols supported by the entity
        this.features = {};
        this.protocols = {};
        // Items owned by the entity
        this.items = {};

        // Childs are Entity linked to this one
        this.childs = {};
    }
}
