#!/bin/bash

clear

echo "restarting nginx"
sudo nginx -s stop -p `pwd`
sudo nginx -c conf/nginx$1.conf -p `pwd`

echo "restarting node"
forever restart centralDashServer.js || forever start centralDashServer.js
