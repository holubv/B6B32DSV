const http = require('http');

module.exports = class Server {

    /**
     * @param {module.Node} node
     */
    constructor(node) {

        /**
         * @type {module.Node}
         */
        this.node = node;

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

                try {
                    this.handle(JSON.parse(body));
                    res.writeHead(200);
                } catch (e) {
                    console.error(e);
                    res.writeHead(500);
                }

                res.end(); //end the response
            });
        });
    }

    start() {
        this.server.listen(this.node.ip.port);
    }

    handle(json) {
        //console.log(json);

        if (!json || !json.type) {
            console.error('Invalid message type received');
            return;
        }

        let handler = this.node['__in_' + json.type.toLowerCase()];
        if (!handler) {
            console.error('Unknown received message type ' + json.type);
            return;
        }

        handler.apply(this.node, [json]);
    }

}