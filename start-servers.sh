#!/bin/bash

# Audio Transcriber App - Server Startup Script (Linux/macOS)
# This script starts both frontend and backend servers

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    if port_in_use $port; then
        print_warning "Port $port is in use. Attempting to free it..."
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    print_success "Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

print_status "Starting Audio Transcriber App..."
echo "=================================="

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists python3; then
    print_error "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_success "All prerequisites are available"

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    print_error "Backend .env file not found. Please create backend/.env with your configuration."
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    print_error "Frontend .env file not found. Please create frontend/.env with your configuration."
    exit 1
fi

# Free up ports if they're in use
kill_port 8000
kill_port 3001

# Start Backend Server
print_status "Starting backend server..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate

# Check if requirements are installed
if [ ! -f ".requirements_installed" ]; then
    print_status "Installing backend dependencies..."
    pip install -r requirements.txt
    touch .requirements_installed
fi

# Start backend server in background
print_status "Launching backend server on http://localhost:8000..."
python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! port_in_use 8000; then
    print_error "Backend server failed to start on port 8000"
    exit 1
fi

print_success "Backend server started successfully"

# Start Frontend Server
print_status "Starting frontend server..."
cd ../frontend

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

# Start frontend server in background
print_status "Launching frontend server on http://localhost:3001..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend started successfully
if ! port_in_use 3001; then
    print_error "Frontend server failed to start on port 3001"
    cleanup
    exit 1
fi

print_success "Frontend server started successfully"

# Display server information
echo ""
echo "🚀 Audio Transcriber App is now running!"
echo "========================================"
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend:  http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo "💡 Health:   http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Keep script running and wait for user to stop
wait
