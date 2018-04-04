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
        // object: array(metaData, nodeMap, collectionMap, leafMap)
        // metaData:  name (string), features (set)
        this.pubsub = new Map();

        // key: serviceid
        // object: nodeid
        this.pubsubSubscriptions = new Map();
    }

    registerService(_netElement) {
        switch (typeof (_netElement)) {
        case 'Entity':

            for (let [idKey, idValue] of _netElement.identityMap) {
                if (idKey.xmllang == 'en'
                    || idKey.xmllang == this.xmllang) {

                    // If pubsub service is discoverd save it on the pubsub/services path
                    if (idKey.type == "pubsub"
                        && idKey.category == "service") {
                        let service = new Map();
                        service.set("metaData", new Map());
                        service.get("metaData").set("name", idValue);
                        service.get("metaData").set("features", new Set());
                        service.set("collections", new Map());
                        service.set("leaves", new Map());
                        this.pubsub.set(_netElement.jid, service);
                    }
                }
            }

            if (this.pubsub.has(_netElement.jid)) {
                let service = this.pubsub.get(_netElement.jid);
                for (let [idKey, idValue] of _netElement.identities) {
                    if (idKey.type == "pubsub"
                        && idKey.category == "collection") {
                        service.get("collections").set(idKey.node, new Map());
                    }

                    if (idKey.type == "pubsub"
                        && idKey.category == "leaf") {
                        service.get("leaves").set(idKey.node, new Map());
                    }
                }
            }

            for (let feature of _netElement.featureSet) {
                // TODO: decide which features to track and how to use them
                service.get("metaData").get("features").add(feature);
            }
            break;
        }

        browser.runtime.sendMessage({
            'subject': 'refreshNetwork'
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
