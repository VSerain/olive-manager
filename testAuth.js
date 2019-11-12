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
                "name": "authService",
                isAuth: true,
                "requireAuth": true
            },
            "uid": null})
        );
        client.on("data", data => {
            data = JSON.parse(data.toString())
            const response = {
                name: "authResponse",
                uid: data.uid,
                data: {}
            }
            if (data.req.headers['api-key'] === "aaaaaa") {
                response.data = {
                    status: 200,
                    data: {
                        user: {
                            name: "victor",
                            groups: ["admin", "user"]
                        }
                    }
                };
            }
            else {
                response.data = {
                    status: 401,
                };
            }
            client.write(JSON.stringify(response));
        })
    });
},500)
