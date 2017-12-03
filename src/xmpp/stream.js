/*
 * Stream is implementation of XMPP stream as in defined in XMPP Core.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
var Stream = function (config) {
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

        initiate: function (config) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        },

        restart: function (config) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        },

        negotiate: function (config) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        },

        authenticate: function (config) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        },

        bind: function (config) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        },
    }
}
