module.exports = class Message {


    static connect() {
        return {
            type: 'connect'
        }
    }

    static setRight() {
        return {
            type: 'set_right'
        }
    }

    static setLeft() {
        return {
            type: 'set_left'
        }
    }

    static election() {
        return {
            type: 'election'
        }
    }

    static elected() {
        return {
            type: 'elected'
        }
    }

    static repair() {
        return {
            type: 'repair'
        }
    }

    static repaired() {
        return {
            type: 'repaired'
        }
    }

    static exit() {
        return {
            type: 'exit'
        }
    }

    static ping() {
        return {
            type: 'ping',
            visited: 0
        }
    }

    static getData() {
        return {
            type: 'get_data'
        }
    }

    static setData(data) {
        return {
            type: 'set_data',
            data: data
        }
    }

    static dataChange(data) {
        return {
            type: 'data_change',
            data: data
        }
    }

}