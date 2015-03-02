var app = require('express')();
var http = require('http').Server(app);
var zmq = require('zmq');
var redis = require("redis");

// setup
var cur_second;
var update_interval = 1000;
var central_server_connection_string = "tcp://10.0.1.1:5555";
var stat_data_options = {
  host: 'localhost',
  port: 80,
  path: '/stat_data/'
};

// zmq client
var requester = zmq.socket('req');
requester.connect(central_server_connection_string);
requester.on("message", function(reply) {});

// redis client
var client = redis.createClient("/tmp/redis.sock");

// update server loop
setInterval(function(){
    cur_second = Date.now()/1000|0;
    tmp = [];
    // for redis based updates
    client.hgetall(cur_second-1, function (err, obj) {
        var data_object = {"timestamp":cur_second, "interval":update_interval, "data":JSON.stringify(obj)}
        requester.send(JSON.stringify(data_object));
    });
    // for 'curl' based updates
    /* 
    http.get(stat_data_options, function(res) {
        res.on('data', function(chunk) {
            tmp.push chunk
        });
        res.on('end', function(e) {
            var data_object = {"timestamp":cur_second, "interval":update_interval, "data":tmp.join('')}
            requester.send(JSON.stringify(data_object));
        });
    })
    */
}, update_interval);

// end zmq on quit
process.on('SIGINT', function() {
  requester.close();
});
