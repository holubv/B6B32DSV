const fetch = require('node-fetch');
const Message = require('./message');
const Address = require('./address');

const MAX_SEND_RETRIES = 10;

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
            ...this._messageHeader(),
            ...message
        });
    }

    /**
     * @param {object} message
     * @return {Promise}
     */
    sendRaw(message) {
        return this._makeHttpRequest(message)
            .catch(() => {
                console.error('Cannot send data to ' + this.right.address);
                console.log('Attempting to repair the ring');

                this.send(Message.repair());

                this._makeHttpRequest({
                    ...this._messageHeader(),
                    ...Message.repair()
                }, this.left.http);

                this._scheduleResend(message);
            });
    }

    _scheduleResend(message, retries = 0) {
        if (retries >= MAX_SEND_RETRIES) {
            console.error('Repair process was unsuccessful, application will be terminated');
            process.exit(1);
            return;
        }

        console.info('Resending data type ' + message.type + ' (' + retries + ')');

        setTimeout(() => {
            this._makeHttpRequest(message)
                .catch(() => {
                    this._scheduleResend(message, retries + 1);
                });
        }, 200);

    }

    /**
     * @param url
     * @param {object} data
     * @return {Promise}
     */
    _makeHttpRequest(data, url) {
        if (!url) {
            url = this.right.http;
        }
        return fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(data)
            }
        );
    }

    _messageHeader() {
        return {
            src: this.ip.address,
            dst: this.right.address
        }
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

    __in_repair(msg) {
        if (msg.src === this.ip.address) {
            return;
        }

        if (msg.dst === this.left.address) {
            this.left = new Address(msg.src);
            this._makeHttpRequest({
                ...this._messageHeader(),
                ...Message.repaired()
            }, this.left.http);
            return;
        }

        this._makeHttpRequest(msg, this.left.http);
    }

    __in_repaired(msg) {
        console.log('Ring was repaired successfully');
        this.right = new Address(msg.src);
        this.startElection();
    }
}