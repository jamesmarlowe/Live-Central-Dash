var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var zmq = require('zmq');
var redis = require("redis");

var cur_second = 0, cur_data = {}, percents = [];
var update_interval = 1000;
var central_server_connection_string = "tcp://*:5558";

///// redis client /////
var client = null;
try {
    //client = redis.createClient();
} catch(e) {
    console.log(e);
}
    
///// health check /////
app.get('/health/', function(req, res){
    res.send('healthy\n');
});

app.get('/csv/', function(req, res){
    if (client){
        client.eval("local time=redis.call(\"TIME\")[1] local stats = {} for i=0,ARGV[1]-1 do     local current = redis.call(\"hgetall\",time-i)     for _, key in pairs(current) do         local sm = redis.call(\"hget\",time-i,key)         stats[key] = (stats[key] or 0) + (sm or 0)     end end local aggregate = {} for k,v in pairs(stats) do     if (not tonumber(k)) then table.insert(aggregate, k..\" : \"..v) end end return aggregate", 0, req.query.seconds?req.query.seconds:1, function (err, resp) {
            console.dir(err);
            res.send(resp);
        });
    } else {
        console.dir("no redis client");
        res.send("datastore disconnected");
    }
});

var responder = zmq.socket('rep');
responder.bind(central_server_connection_string, function(err) {
    if (err) throw err;
    console.log('bound!');

    responder.on('message', function(msg) {
        responder.send("1");
        console.log(msg.toString());
        var tmp = JSON.parse(msg.toString());
        if (true){//(tmp["timestamp"] < cur_second && tmp["timestamp"] > cur_second - update_interval) {
            var tmpdata = JSON.parse(tmp["data"]);
            for (var key in tmpdata) {
                if (key.indexOf(" filled") > -1){
                    percents.push(key)
                }
                if (key in cur_data){
                    cur_data[key] += Number(tmpdata[key]);
                } else {
                    cur_data[key] = Number(tmpdata[key]);
                }
            }
        }
    });
});

setInterval(function(){
    cur_second = Date.now()/1000|0;
    cur_data["timestamp"] = cur_second;
    if (client) {
        for (var key in cur_data) {
            client.hset(cur_second, key, cur_data[key]);
            client.expire(cur_second, 600)
        }
    }
    for (var i in percents) {
        var key = percents[i],key_root = "";
        if (key.indexOf(" not filled")>-1){
            key_root = key.substring(0,key.indexOf(" not filled"));
        }else if (key.indexOf(" filled")>-1){
            key_root = key.substring(0,key.indexOf(" filled"));
        }
        var not_filled = cur_data[key_root+" not filled"];
        delete cur_data[key_root+" not filled"];
        var filled = cur_data[key_root+" filled"];
        delete cur_data[key_root+" filled"];
        if (filled && not_filled) {
            cur_data[key_root+" fill percent"] = filled/(filled+not_filled);
        }
    }
    io.emit("data", JSON.stringify(cur_data));
    cur_data = {};
    percents = [];
}, update_interval);

io.on('connection', function (socket) {
  console.log("connection");
});

http.listen(8080, function(){
  console.log('listening on *:8080');
});

process.on('SIGINT', function() {
  responder.close();
});
