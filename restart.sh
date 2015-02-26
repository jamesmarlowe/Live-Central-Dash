#!/bin/bash

clear

echo "restarting nginx"
sudo service nginx restart

echo "restarting node"
forever restart centralDashServer.js
