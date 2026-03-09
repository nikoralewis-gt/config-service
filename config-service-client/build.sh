#!/bin/bash
# Build script for Config Hub Client Library

echo "Building Config Hub Client Library..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the library
echo "Compiling TypeScript..."
npm run build

echo "Build complete! Output in dist/"
