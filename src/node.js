const fetch = require('node-fetch');
const Message = require('./message');
const Address = require('./address');

module.exports = class Node {

    /**
     * @param ip
     */
    constructor(ip) {
        /**
         * @type {module.Address}
         */
        this.ip = ip;

        /**
         * @type {module.Address}
         */
        this.left = null;

        /**
         * @type {module.Address}
         */
        this.right = null;

        /**
         * @type {number}
         */
        this.id = this._generateId(ip);

        /**
         * @type {boolean}
         */
        this.isLeader = false;

        /**
         * @type {module.Address}
         */
        this.leader = null;

        /**
         * @type {boolean}
         */
        this.voting = false;
    }


    connect(address) {
        this.right = address;
        this.send(Message.connect());
    }

    /**
     * @param {object} message
     * @return {Promise}
     */
    send(message) {
        return this.sendRaw({
            src: this.ip.address,
            dst: this.right.address,
            ...message
        });
    }

    /**
     * @param {object} message
     * @return {Promise}
     */
    sendRaw(message) {
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

    startElection() {
        this.voting = true;
        this.send(Message.election());
    }

    isFromSelf(msg) {
        return this.ip.address === msg.src;
    }

    /**
     * @param {module.Address|string} address
     * @return {number}
     * @private
     */
    _generateId(address) {
        if (address.address) {
            address = address.address;
        }
        return Number(address.replace(/[.:]/g, ''));
    }

    /*
    Incoming message handlers
     */

    __in_test(msg) {
        console.log('test data received');
    }

    __in_connect(msg) {
        if (msg.src === msg.dst) {
            return;
        }

        if (!this.right || !this.left) {
            // first connected node

            this.right = new Address(msg.src);
            this.left = this.right;

            this.send(Message.setLeft());
            return;
        }

        let oldRight = this.right.address;
        this.right = new Address(msg.src);

        this.sendRaw({
            src: this.ip.address,
            dst: oldRight,
            ...Message.setRight()
        });
    }

    __in_set_left(msg) {
        this.left = new Address(msg.src);
        this.startElection();
    }

    __in_set_right(msg) {
        this.left = new Address(msg.src);
        this.right = new Address(msg.dst);
        this.send(Message.setLeft());
    }

    __in_election(msg) {
        let srcId = this._generateId(msg.src);

        if (srcId > this.id) {
            this.voting = true;
            this.sendRaw(msg);
            return;
        }

        if (srcId < this.id && !this.voting) {
            this.voting = true;
            this.send(Message.election());
            return;
        }

        if (srcId === this.id) {
            this.send(Message.elected());
        }
    }

    __in_elected(msg) {
        this.voting = false;
        this.leader = new Address(msg.src);
        console.log('Leader was elected: ' + this.leader.address);

        if (this.isFromSelf(msg)) {
            this.isLeader = true;
            console.log('   (this node is the leader now)');
            return;
        }

        this.isLeader = false;
        this.sendRaw(msg);
    }
}