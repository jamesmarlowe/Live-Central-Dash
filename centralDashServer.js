var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var zmq = require('zmq');

var cur_second = 0, cur_data = {};
var update_interval = 1000;
var central_server_connection_string = "tcp://localhost:5555";

app.get('/health/', function(req, res){
  res.send('healthy\n');
});

var responder = zmq.socket('rep');
responder.connect(central_server_connection_string);
responder.on("message", function(msg) {
    setTimeout(function() {
        responder.send("received");
    }, 1000);
    var tmp = JSON.parse(msg);
    if (tmp["timestamp"] < cur_second && tmp["timestamp"] > cur_second - update_interval) {
        for (var key in JSON.parse(tmp["data"])) {
            if (key in cur_data){
                cur_data[key] += tmp[key];
            } else {
                cur_data[key] = tmp[key];
            }
        }
    }
});

setInterval(function(){
    cur_second = Date.now()/1000|0;
    cur_data["timestamp"] = cur_second;
    io.emit("data", JSON.stringify(cur_data));
    cur_data = {}
}, update_interval);

http.listen(8080, function(){
  console.log('listening on *:8080');
});

process.on('SIGINT', function() {
  responder.close();
});
