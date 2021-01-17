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

        /**
         * @type {boolean}
         */
        this.repairing = false;

        /**
         * @type {string|null}
         */
        this.data = null;
    }


    connect(address) {
        this.right = address;
        this.send(Message.connect());
    }

    disconnect() {
        this.send(Message.exit())
            .then(() => {
                setTimeout(() => process.exit(0), 500);
            });
    }

    /**
     * @param {object} message
     * @return {Promise}
     */
    send(message) {
        if (!this.right) {
            return Promise.resolve();
        }
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
        let right = this.right;
        return this._makeHttpRequest(message)
            .catch((e) => {
                console.error('Cannot send data to ' + right.address);
                //console.error(e);
                this._scheduleResend(message);

                if (this.repairing) {
                    return;
                }

                console.log('Attempting to repair the ring');
                this.repairing = true;

                this._makeHttpRequest({
                    ...this._messageHeader(),
                    ...Message.repair()
                }, this.left);
            });
    }

    setData(data) {
        if (this.isLeader) {
            this.data = data;
            this.send(Message.dataChange(data));
            return;
        }
        this.send(Message.setData(data));
    }

    _scheduleResend(message, retries = 0) {
        if (retries >= MAX_SEND_RETRIES) {
            console.error('Repair process was unsuccessful, application will be terminated');
            process.exit(1);
            return;
        }

        setTimeout(() => {
            console.info('Resending data type ' + message.type + ' (' + retries + ')');
            this._makeHttpRequest(message)
                .catch(() => {
                    this._scheduleResend(message, retries + 1);
                });
        }, 1000);

    }

    /**
     * @param {object} data
     * @param {module.Address} [address]
     * @return {Promise}
     */
    _makeHttpRequest(data, address) {
        if (!address) {
            address = this.right;
        }
        if (!address || address.address === this.ip.address) {
            return Promise.resolve();
        }
        return fetch(address.http, {
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

    __in_ping(msg) {
        if (this.isFromSelf(msg)) {
            console.log('Pong (visited: ' + msg.visited + ')');
            return;
        }
        msg.visited = (msg.visited || 0) + 1;
        console.log('Ping');
        this.sendRaw(msg);
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

        if (this.isLeader) {
            this.send(Message.dataChange(this.data));
        }

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
            }, this.left);
            return;
        }

        this._makeHttpRequest(msg, this.left);
    }

    __in_repaired(msg) {
        console.log('Ring was repaired successfully');
        this.repairing = false;
        this.right = new Address(msg.src);
        this.startElection();
    }

    __in_exit(msg) {
        console.log('Node @' + msg.src + ' disconnected');

        if (msg.src === this.right.address) {
            this.right = new Address(msg.dst);
            this.send(Message.setLeft());
            return;
        }

        this.sendRaw(msg);
    }

    __in_set_data(msg) {
        if (this.isFromSelf(msg)) {
            return;
        }

        if (!this.isLeader) {
            this.sendRaw(msg);
            return;
        }

        this.data = msg.data || '';
        this.send(Message.dataChange(this.data));
    }

    __in_get_data(msg) {
        if (this.isFromSelf(msg)) {
            return;
        }

        if (!this.isLeader) {
            this.sendRaw(msg);
            return;
        }

        this.send(Message.dataChange(this.data));
    }

    __in_data_change(msg) {
        if (this.isFromSelf(msg)) {
            return;
        }

        this.data = msg.data || '';
        this.sendRaw(msg);
    }
}