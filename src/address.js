module.exports = class Address {

    constructor(str) {
        let split = str.split(':');

        if (split.length !== 2) {
            throw new Error('Invalid address format');
        }

        this.ip = split[0];
        this.port = Number(split[1]);

        if (!this.ip || !this.port) {
            throw new Error('Invalid address');
        }
    }

    get address() {
        return this.ip + ':' + this.port;
    }


}