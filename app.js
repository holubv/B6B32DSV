const http = require('http');
const Node = require('./src/node');
const Server = require('./src/server');
let Address = require('./src/address');

let args = process.argv.slice(2);
let currentAddress = new Address(args[0]);


let node = new Node(currentAddress);
let server = new Server(node);

console.log('Running instance @' + currentAddress.address);
console.log('Current node id: ' + node.id);

server.start();

if (args[1]) {
    let connectAddress = new Address(args[1]);
    console.log('Connecting to node @' + connectAddress.address);
    node.connect(connectAddress);
}