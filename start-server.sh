#!/bin/bash
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=384"
while true; do
  node .next/standalone/server.js 2>&1
  sleep 1
 done
