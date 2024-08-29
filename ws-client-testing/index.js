var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();

// Failed handshake
client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

// Successful handshake
client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    console.log(`Time take to establish connection is ${Math.abs(new Date() - startDate)}`);
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }
    });

    function sendNumber() {
        if (connection.connected) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            connection.sendUTF(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();
});

var startDate = new Date();
client.connect('ws://localhost/notebook/terminals/websocket/1', null, '', {
    "Cookie": ``
});