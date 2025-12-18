#!/bin/bash
# killall.sh - Clear all port conflicts and prepare for Replit app restart
# Usage: ./scripts/killall.sh or npm run killall

echo "🔪 Killing all Node/Next.js processes..."

# Method 1: Kill process on port 5000 using fuser (most reliable on Replit)
fuser -k 5000/tcp 2>/dev/null || true

# Method 2: Kill all node/next processes
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "node" 2>/dev/null || true

# Wait for processes to fully terminate
sleep 2

# Find and kill any remaining stubborn processes on port 5000
PID=$(ss -tlnp 2>/dev/null | grep ":5000" | grep -oP 'pid=\K\d+' | head -1)
if [ -n "$PID" ]; then
    echo "🎯 Found stubborn process $PID on port 5000, killing..."
    kill -9 $PID 2>/dev/null || true
    sleep 1
fi

# Clear Next.js build cache
echo "🗑️  Clearing .next cache..."
rm -rf .next

# Final wait
sleep 1

# Verify port is free
if ss -tlnp 2>/dev/null | grep -q ":5000"; then
    echo "⚠️  Warning: Port 5000 may still be in use"
    ss -tlnp | grep ":5000"
else
    echo "✅ Port 5000 is free"
fi

echo "✅ Cleanup complete - ready for restart"
