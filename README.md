# B6B32DSV  
> LE - Ch-Ro - Node.js, HTTP - shared variable

## Install

```shell script
git clone https://github.com/holubv/B6B32DSV.git
cd B6B32DSV
npm install
node app.js localhost:8000
```

## Command line arguments

```shell script
# Create a new node
node app.js localhost:8000

# Connect to an existing node
node app.js localhost:8001 localhost:8000

# node app.js <this_node_ip:port> [connect_node_ip:port]
```

## Commands

- `ping` - Sends a ping request and returns number of connected nodes
- `info` - Debug info about this node
- `exit` - Safely disconnects from the network
- `set <variable>` - Sends a set request to the leader to set the variable to the given value
- `get` - Returns a local variable value
- `fetch` - Fetches and updates local variable value from the leader