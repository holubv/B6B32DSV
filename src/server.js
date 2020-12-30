const http = require('http');

module.exports = class Server {

    /**
     * @param {module.Node} node
     */
    constructor(node) {

        /**
         * @type {http.Server}
         */
        this.server = http.createServer((req, res) => {

            let body = [];
            req.on('error', (err) => {
                console.error(err);
            }).on('data', (chunk) => {
                body.push(chunk);
            }).on('end', () => {
                body = Buffer.concat(body).toString();

                this.handle(JSON.parse(body));

                res.writeHead(200);
                res.end(); //end the response
            });
        });
    }

    start() {
        this.server.listen(this.node.port);
    }

    handle(json) {
        if (!json || !json.type) {
            console.error('Invalid message type');
            return;
        }

        this.node['__in_' + json.type.toLowerCase()](json);
    }

}