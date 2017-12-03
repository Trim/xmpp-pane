/*
 * Stanza is implementation of XMPP stanzas as in defined in XMPP Core.
 *
 * [RFC-6120]: https://xmpp.org/rfcs/rfc6120.html
 */
var Stanza = function (config) {
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

        presence: function (config) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        },

        message: function (config) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        },

        iq: function (config) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        },

    }
}
