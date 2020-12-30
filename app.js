
let Address = require('./src/address');

let args = process.argv.slice(2);
let currentAddress = new Address(args[0]);

console.log('Running instance @' + currentAddress.address);

//create a server object:
http.createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    })
    res.write('{}'); //write a response to the client
    res.end(); //end the response
}).listen(currentAddress.port);