var Stanza = function(config) {
    return {
        init: function () {
            return new Promise((resolve, reject) => {
                // XML DOM tree (cleared each time)
                config.dom = document.implementation.createDocument(null, null);

                // DOM Parser can parse XML string to DOM (created once)
                if (!config.domParser) {
                    config.domParser = new DOMParser();
                }

                // Create a DOM to XML serializer (created once)
                if (!config.xmlSerializer) {
                    config.xmlSerializer = new XMLSerializer();
                }

                resolve(config);
            });
        },

        /*
         * <open /> is used to open a stream header after WebSocket initialization
         *
         * Ref: https://tools.ietf.org/html/rfc7395#section-3.4
         */
        open: function (config) {
            return new Promise((resolve, reject) => {
                let open = config.dom.createElement("open");
                open.setAttribute("xmlns", "urn:ietf:params:xml:ns:xmpp-framing");
                open.setAttribute("to", config.to);
                open.setAttribute("version", "1.0");

                resolve(config.xmlSerializer.serializeToString(open));
            });
        },

        /*
         * <close /> is used to close a stream header before WebSocket close
         *
         * Ref: https://tools.ietf.org/html/rfc7395#section-3.6
         */
        close: function (config) {
            return new Promise((resolve, reject) => {
                let close = config.dom.createElement("close");
                close.setAttribute("xmlns", "urn:ietf:params:xml:ns:xmpp-framing");
                close.setAttribute("to", config.to);
                close.setAttribute("version", "1.0");

                resolve(config.xmlSerializer.serializeToString(close));
            });
        },
    }
}
