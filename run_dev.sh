#!/bin/bash

# Voice AI Browser Agent - Development Server Startup Script
# This script starts both the backend and frontend development servers

set -e

echo "🚀 Starting Voice AI Browser Agent Development Environment"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ to continue."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm to continue."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cat > .env << EOL
# OpenAI API Configuration (REQUIRED)
OPENAI_API_KEY=your_openai_api_key_here

# Google OAuth (Optional - for Gmail integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# WordPress Integration (Optional)
WP_SITE_URL=https://your-wordpress-site.com
WP_ADMIN_USER=your_wp_username
WP_APP_PASSWORD=your_wp_app_password

# Server Configuration
PORT=5000
NODE_ENV=development

# Session Security
SESSION_SECRET=your_session_secret_here
EOL
    echo "✅ Created .env file. Please edit it with your API keys before continuing."
fi

# Check for required environment variables
if [ -f .env ]; then
    source .env
fi

if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
    echo ""
    echo "⚠️  WARNING: OPENAI_API_KEY is not set in .env file"
    echo "   The AI features will not work without a valid OpenAI API key."
    echo "   Please add your OpenAI API key to the .env file."
    echo ""
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
fi

# Check if dependencies are up to date
echo "🔍 Checking for dependency updates..."
npm outdated || true

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p data/sessions
mkdir -p data/profiles
mkdir -p uploads/temp

# Set file permissions
echo "🔧 Setting up file permissions..."
chmod +x run_dev.sh

# Start the development server
echo ""
echo "🎯 Starting development server..."
echo "   Frontend & Backend will be available at: http://localhost:${PORT:-5000}"
echo "   API endpoints will be available at: http://localhost:${PORT:-5000}/api"
echo ""
echo "🎤 Voice features require HTTPS or localhost to work properly"
echo "🔐 Make sure to configure your API keys in the .env file"
echo ""
echo "📚 Available features:"
echo "   • Voice control with push-to-talk"
echo "   • Browser automation and session management"
echo "   • AI-powered chat assistant"
echo "   • Task templates and automation"
echo "   • WordPress integration (if configured)"
echo "   • Action logging and audit trail"
echo ""
echo "💡 Tips:"
echo "   • Press Ctrl+C to stop the server"
echo "   • Edit files and the server will auto-reload"
echo "   • Check the browser console for client-side logs"
echo "   • Check the terminal for server-side logs"
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development server..."
    echo "👋 Thanks for using Voice AI Browser Agent!"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM

# Start the server
npm run dev

# If we get here, the server stopped unexpectedly
echo "❌ Development server stopped unexpectedly"
echo "🔍 Check the logs above for error details"
exit 1
