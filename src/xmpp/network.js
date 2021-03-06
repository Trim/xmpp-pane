/*
 * Network is a representation of the discovered XMPP network
 *
 * It receives result from discovery and return adapted HTML code
 * to visualize the network.
 */

class Network {
    constructor(_xmllang) {
        // Prefered language to use if possible
        this.xmllang = _xmllang;

        // Map model
        this.discover = new Map();
        // key: jid
        this.entities = new Map();

        // key: serviceid (jid?)
        // object: array(metadata, nodeMap, collectionMap, leafMap)
        // metadata:  array(name (string), features (set))
        this.pubsub = new Map();

        // key: serviceid
        // object: nodeid
        this.pubsubSubscriptions = new Map();
    }

    registerService(_netElement) {
        if (_netElement instanceof Entity) {
            // Look for identities
            for (let [idKey, idValue] of _netElement.identityMap) {
                // TODO: Better decide which identity we want to store
                if (idKey.xmllang == 'en'
                    || !idKey.xmllang
                    || idKey.xmllang == this.xmllang) {

                    // If pubsub service is discoverd save it on the pubsub/services path
                    if (idKey.type == "service"
                        && idKey.category == "pubsub") {
                        let service = new Array();
                        service["metadata"] = new Array();
                        service["metadata"]["name"] = idValue;
                        service["metadata"]["features"] = new Set();
                        service["nodes"] = new Map();
                        service["collections"] = new Map();
                        service["leaves"] = new Map();
                        this.pubsub.set(_netElement.jid, service);
                    }
                }
            }

            // Fill the pubusb service
            if (this.pubsub.has(_netElement.jid)) {
                let service = this.pubsub.get(_netElement.jid);

                // Look for collections and leaves
                for (let [idKey, idValue] of _netElement.identities) {
                    if (idKey.type == "pubsub"
                        && idKey.category == "collection") {
                        service["collections"].set(idKey.node, new Map());
                    }

                    if (idKey.type == "pubsub"
                        && idKey.category == "leaf") {
                        service["leaves"].set(idKey.node, new Map());
                    }
                }
            }

            // Look for features
            let service = null;
            if (this.pubsub.has(_netElement.jid)) {
                service = this.pubsub.get(_netElement.jid);
            }

            if (service) {
                for (let feature of _netElement.featureSet) {
                    // TODO: decide which features to track and how to use them
                    service["metadata"]["features"].add(feature);
                }
            }
        }

        browser.runtime.sendMessage({
            'subject': 'refreshNetwork',
            'network': this
        });
    }

    /*
     * Create a JSON representation of the network
     * This representation is only used to save the network to local storage
     */
    stringify() {
        let jsonNet;

        return jsonNet;
    }

    /*
     * Read the network from a JSON object
     * This will be used to restore network from local storage
     */
    parse(_jsonNet) {
        return;
    }
}
