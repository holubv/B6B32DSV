module.exports = class Address {

    /**
     * @param {string} str Address in "ip:port" format
     */
    constructor(str) {
        let split = str.split(':');

        if (split.length !== 2) {
            throw new Error('Invalid address format');
        }

        /**
         * @type {string}
         */
        this.ip = split[0];

        if (this.ip === 'localhost') {
            this.ip = '127.0.0.1';
        }

        /**
         * @type {number}
         */
        this.port = Number(split[1]);

        if (!this.ip || !this.port) {
            throw new Error('Invalid address');
        }
    }

    /**
     * @returns {string}
     */
    get address() {
        return this.ip + ':' + this.port;
    }

    /**
     * @returns {string}
     */
    get http() {
        return 'http://' + this.ip + ':' + this.port + '/';
    }


}