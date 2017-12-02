var Stanza = function(config) {
    return {
        init: function () {
            return new Promise((resolve, reject) => {
                config.dom = document.implementation.createDocument(null, null);
                config.domParser = new DOMParser();
                config.xmlSerializer = new XMLSerializer();

                resolve(config);
            });
        },

        /*
         * open Stanza is used to initate XMPP Stream after WebSocket initialization
         *
         * Ref: https://tools.ietf.org/html/rfc7395
         */
        open: function (config) {
            return new Promise((resolve, reject) => {
                let open = config.dom.createElement("open");
                open.setAttribute("xmlns", "urn:ietf:params:xml:ns:xmpp-framing");
                open.setAttribute("to", config.to);
                open.setAttribute("version", "1.0");

                resolve(config.xmlSerializer.serializeToString(open));
            });
        }
    }
}
