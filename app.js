const http = require('http');
const readline = require('readline');
const Node = require('./src/node');
const Server = require('./src/server');
let Address = require('./src/address');
let Message = require('./src/message');


const consoleLog = console.log;
console.log = function (...args) {
    consoleLog(new Date().toISOString(), ...args);
}


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

let cmd = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

cmd.on('line', (line) => {
    line = line.trim();
    let args = line.split(' ');
    if (!args || !args.length) {
        return;
    }

    if (args[0] === 'ping') {
        node.send(Message.ping());
    }

    if (args[0] === 'info') {
        console.log({...node});
    }

    if (args[0] === 'get') {
        console.log('Local value: "' + node.data + '"');
    }

    if (args[0] === 'fetch') {
        if (node.isLeader) {
            console.log('This node is the leader, no need to fetch');
        } else {
            console.log('Requesting variable update');
            node.send(Message.getData());
        }
    }

    if (args[0] === 'exit') {
        console.log('Disconnecting node');
        node.disconnect();
    }

    if (args[0] === 'set' && args[1]) {
        console.log('Sending variable change request');
        args.shift();
        node.setData(args.join(' '));
    }
});