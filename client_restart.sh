#!/bin/bash

echo "restarting client"
forever restart centralDashClient.js || forever start centralDashClient.js
