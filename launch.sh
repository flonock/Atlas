#!/bin/bash

# Log everything to a file for debugging
exec > /tmp/atlas-launch.log 2>&1
echo "Starting launch.sh..."

# Navigate to the workspace
cd /home/apollon/atlas-workspace

# Start Next.js in the background on port 3005
echo "Running npm run dev"
/usr/bin/npm run dev &
NEXT_PID=$!

# Wait for Next.js to boot up
echo "Waiting for Next.js to start on port 3005..."
while ! curl -s http://localhost:3005 > /dev/null; do
  sleep 1
done

echo "Next.js is up. Starting Electron..."
# Start Electron
/usr/bin/npx electron electron-main.js

# When Electron is closed, kill Next.js
echo "Electron closed. Killing Next.js (PID $NEXT_PID)"
kill $NEXT_PID
