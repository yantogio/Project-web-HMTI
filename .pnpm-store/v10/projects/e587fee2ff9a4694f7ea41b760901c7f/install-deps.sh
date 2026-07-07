#!/bin/bash

# Script untuk install dependencies di backend HMTI
cd "c:\PROJECT WEB HMTI\hmti-backend"

# Try pnpm first
if command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm install node-cache express-rate-limit
elif command -v npm &> /dev/null; then
    echo "Using npm..."
    npm install node-cache@5.1.2 express-rate-limit@7.1.5 --save
else
    echo "ERROR: Neither pnpm nor npm found!"
    exit 1
fi

echo "✅ Dependencies installed successfully!"
