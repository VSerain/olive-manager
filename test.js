var net = require('net');

var HOST = '127.0.0.1';
var PORT = 9999;

var client = new net.Socket();
setTimeout(() => {
    client.connect(PORT, HOST, function() {
        console.log('CONNECTED TO: ' + HOST + ':' + PORT);
        client.write(JSON.stringify({
            "name" : "config",
            "data": { 
                "name": "test",
                "requireAuth": true
            },
            "uid": null})
        );
        client.on("data", data => {
            data = JSON.parse(data.toString())
            console.log(data);
            client.write(JSON.stringify({
                name: "response",
                uid: data.uid,
                data: {
                    'response': "hello world " + data.auth.user.name
                }
            }));
        })
    });
},500)
