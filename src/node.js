const fetch = require('node-fetch');

module.exports = class Node {

    constructor() {
        this.address = null;
        this.port = null;

        /**
         * @type {module.Address}
         */
        this.left = null;
        /**
         * @type {module.Address}
         */
        this.right = null;
    }

    /**
     * @param {object} message
     * @return {Promise}
     */
    send(message) {
        return fetch(this.right.http, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(message)
            }
        ).catch(() => {

        });
    }

    /*
    Incoming message handlers
     */

    __in_test(data) {

    }


}