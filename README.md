Live-Central-Dash
=================

Centralized reporting interface for multiple high throughput frontends

Methodology
-----------
This project is composed of two parts. The first is a client which runs only in instances where the frontend is otherwise incapable of talking to the backend properly (which was the case with NGINX). The second is the reporting server which accepts aggregated statistics over zmq and broadcasts them to the socketio interface loaded in user's browsers. Statistics can be sent in the form of JSON over ZMQ to the server without the client in cases where that is easier.

Client
------
A nodejs server which polls the frontend for aggregated statistics and sends them on the the backend via ZMQ.

Updates are set to be polled and sent at a set interval of 1000ms, but this is configurable. This interval and the Server interval should be set to match (or code changed to work).
### setup
You will need to set the url for the Server in order for ZMQ to send to the correct place.
```
sudo apt-get update
sudo apt-get install nodejs npm
sudo ln -s "$(which nodejs)" /usr/bin/node
sudo npm install --save express@4.10.2
sudo npm install --save zmq
sudo npm install forever -g
```
### start
```
forever start centralDashClient.js
```

Server
------
A nodejs server which listens for updates over zmq, bins them for the time they arrived and aggregates, then broadcasts them via socketio to the interface.
### setup
```
sudo apt-get update
sudo apt-get install nodejs npm
sudo ln -s "$(which nodejs)" /usr/bin/node
sudo npm install --save express@4.10.2
sudo npm install --save socket.io
sudo npm install --save zmq
sudo npm install forever -g
```
### start
```
forever start centralDashServer.js
```

