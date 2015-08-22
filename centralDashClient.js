var app = require('express')();
var http = require('http').Server(app);
var urlib = require('http');
var zmq = require('zmq');
var redis = require("redis");

// setup
var cur_second;
var update_interval = 1000;
var central_server_connection_string = "tcp://10.0.1.1:5555";
var stat_data_options = {
  host: 'localhost',
  port: 80,
  path: '/log/'
};

// zmq client
var requester = zmq.socket('req');
requester.connect(central_server_connection_string);
requester.on("message", function(reply) {});

///// redis client /////
var client = redis.createClient();

function replacer(key, value) {
  if (typeof value === "number") {
    return value.toString();
  }
  return value;
}

// update server loop
setInterval(function(){
    cur_second = Date.now()/1000|0;
    tmp = [];
    // for redis based updates
    /*
    client.hgetall(cur_second-1, function (err, obj) {
        var data_object = {"timestamp":cur_second, "interval":update_interval, "data":JSON.stringify(obj)}
        requester.send(JSON.stringify(data_object));
    });
    */
    // for 'curl' based updates
    urlib.get(stat_data_options, function(res) {
        res.on('data', function(chunk) {
            tmp.push(chunk);
        });
        res.on('end', function(e) {
            var data = JSON.parse(tmp.join(''));
            var data_object = {"timestamp":cur_second, "interval":update_interval, "data":JSON.stringify(data, replacer)}
            requester.send(JSON.stringify(data_object));
        });
        res.on('error', function(e) {
            return;
        });
    })
}, update_interval);

// end zmq on quit
process.on('SIGINT', function() {
  producer.close();
});
