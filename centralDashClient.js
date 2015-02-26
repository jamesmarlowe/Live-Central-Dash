var app = require('express')();
var http = require('http').Server(app);
var zmq = require('zmq');

var cur_second;
var update_interval = 1000;
var central_server_connection_string = "tcp://10.0.1.1:5555";
var stat_data_options = {
  host: 'localhost',
  port: 80,
  path: '/stat_data/'
};

var requester = zmq.socket('req');
requester.connect(central_server_connection_string);
requester.on("message", function(reply) {});

setInterval(function(){
    cur_second = Date.now()/1000|0;
    tmp = [];
    http.get(stat_data_options, function(res) {
        res.on('data', function(chunk) {
            tmp.push chunk
        });
        res.on('end', function(e) {
            var data_object = {"timestamp":cur_second, "interval":update_interval, "data":tmp.join('')}
            requester.send(JSON.stringify(data_object));
        });
    })
}, update_interval);

process.on('SIGINT', function() {
  requester.close();
});
