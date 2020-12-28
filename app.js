let http = require('http');
const port = 8080;
//create a server object:
http.createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    })
    res.write('{}'); //write a response to the client
    res.end(); //end the response
}).listen(port);