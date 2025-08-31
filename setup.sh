#!/bin/bash

# DuckDB WASM Demo Setup Script
echo "🚀 Setting up DuckDB WASM Demo..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    echo "Please upgrade Node.js and try again."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Project built successfully"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🎉 Setup complete! You can now:"
echo ""
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. Open http://localhost:3000 in your browser"
echo ""
echo "3. Wait for DuckDB WASM to initialize (5-10 seconds)"
echo ""
echo "4. Try the sample queries to test the functionality"
echo ""
echo "📚 For deployment instructions, see deploy.md"
echo "📖 For more details, see README.md"
echo ""
echo "Happy querying! 🦆"
