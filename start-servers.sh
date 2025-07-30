#!/bin/bash

# Audio Transcriber App - Server Startup Script (Linux/macOS)
# This script starts both frontend and backend servers

set -e  # Exit on any error

# Colors for output - check if terminal supports colors
if [[ -t 1 ]] && command -v tput >/dev/null 2>&1 && tput colors >/dev/null 2>&1 && [[ $(tput colors) -ge 8 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
    USE_COLORS=true
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
    USE_COLORS=false
fi

# Function to print colored output
print_status() {
    if [[ "$USE_COLORS" == "true" ]]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    else
        echo "[INFO] $1"
    fi
}

print_success() {
    if [[ "$USE_COLORS" == "true" ]]; then
        echo -e "${GREEN}[SUCCESS]${NC} $1"
    else
        echo "[SUCCESS] $1"
    fi
}

print_warning() {
    if [[ "$USE_COLORS" == "true" ]]; then
        echo -e "${YELLOW}[WARNING]${NC} $1"
    else
        echo "[WARNING] $1"
    fi
}

print_error() {
    if [[ "$USE_COLORS" == "true" ]]; then
        echo -e "${RED}[ERROR]${NC} $1"
    else
        echo "[ERROR] $1"
    fi
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

# Read ports from environment files
BACKEND_PORT=8000
FRONTEND_PORT=3001

# Read backend port from .env if available
if [ -f "backend/.env" ]; then
    BACKEND_PORT=$(grep "^PORT=" backend/.env | cut -d'=' -f2 | tr -d ' ' || echo "8000")
fi

# Read frontend port from .env if available
if [ -f "frontend/.env" ]; then
    FRONTEND_PORT=$(grep "^VITE_PORT=" frontend/.env | cut -d'=' -f2 | tr -d ' ' || echo "3001")
fi

print_status "Using ports: Backend=$BACKEND_PORT, Frontend=$FRONTEND_PORT"

# Free up ports if they're in use
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

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
if ! port_in_use $BACKEND_PORT; then
    print_error "Backend server failed to start on port $BACKEND_PORT"
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
if ! port_in_use $FRONTEND_PORT; then
    print_error "Frontend server failed to start on port $FRONTEND_PORT"
    cleanup
    exit 1
fi

print_success "Frontend server started successfully"

# Display server information
echo ""
echo "🚀 Audio Transcriber App is now running!"
echo "========================================"
echo "📱 Frontend: http://localhost:$FRONTEND_PORT"
echo "🔧 Backend:  http://localhost:$BACKEND_PORT"
echo "📊 API Docs: http://localhost:$BACKEND_PORT/docs"
echo "💡 Health:   http://localhost:$BACKEND_PORT/health"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Keep script running and wait for user to stop
wait
