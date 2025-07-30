# Audio Transcriber App - Server Startup Script (Windows PowerShell)
# This script starts both frontend and backend servers

param(
    [switch]$NoBrowser,
    [switch]$Help
)

# Function to display help
function Show-Help {
    Write-Host @"
Audio Transcriber App - Server Startup Script

USAGE:
    .\start-servers.ps1 [OPTIONS]

OPTIONS:
    -NoBrowser    Don't automatically open the browser
    -Help         Show this help message

EXAMPLES:
    .\start-servers.ps1                 # Start servers and open browser
    .\start-servers.ps1 -NoBrowser      # Start servers without opening browser

"@ -ForegroundColor Cyan
}

if ($Help) {
    Show-Help
    exit 0
}

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if a command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    }
    catch {
        return $false
    }
}

# Function to kill processes on a specific port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        foreach ($processId in $processes) {
            Write-Warning "Stopping process $processId on port $Port"
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    }
    catch {
        # Port might not be in use, which is fine
    }
}

# Cleanup function
function Stop-Servers {
    Write-Status "Shutting down servers..."
    
    # Kill processes on our ports
    Stop-ProcessOnPort -Port 8000
    Stop-ProcessOnPort -Port 3001
    
    Write-Success "Cleanup completed"
}

# Set up cleanup on exit
$null = Register-EngineEvent PowerShell.Exiting -Action { Stop-Servers }

Write-Status "Starting Audio Transcriber App..."
Write-Host "==================================" -ForegroundColor Cyan

# Check prerequisites
Write-Status "Checking prerequisites..."

if (-not (Test-Command "python")) {
    Write-Error "Python is not installed or not in PATH. Please install Python 3.8 or higher."
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Command "node")) {
    Write-Error "Node.js is not installed or not in PATH. Please install Node.js 16 or higher."
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Error "npm is not installed or not in PATH. Please install npm."
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Success "All prerequisites are available"

# Check if .env files exist
if (-not (Test-Path "backend\.env")) {
    Write-Error "Backend .env file not found. Please create backend\.env with your configuration."
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path "frontend\.env")) {
    Write-Error "Frontend .env file not found. Please create frontend\.env with your configuration."
    Read-Host "Press Enter to exit"
    exit 1
}

# Free up ports if they're in use
Write-Status "Checking for existing processes on ports 8000 and 3001..."
Stop-ProcessOnPort -Port 8000
Stop-ProcessOnPort -Port 3001

# Start Backend Server
Write-Status "Starting backend server..."
Set-Location "backend"

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Warning "Virtual environment not found. Creating one..."
    python -m venv venv
}

# Activate virtual environment
& "venv\Scripts\Activate.ps1"

# Check if requirements are installed
if (-not (Test-Path ".requirements_installed")) {
    Write-Status "Installing backend dependencies..."
    pip install -r requirements.txt
    New-Item -Path ".requirements_installed" -ItemType File | Out-Null
}

# Start backend server
Write-Status "Launching backend server on http://localhost:8000..."
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    & "venv\Scripts\Activate.ps1"
    python app.py
}

# Wait for backend to start
Start-Sleep -Seconds 3

# Check if backend started successfully
if (Test-Port -Port 8000) {
    Write-Success "Backend server started successfully"
} else {
    Write-Warning "Backend server may still be starting..."
}

# Start Frontend Server
Write-Status "Starting frontend server..."
Set-Location "..\frontend"

# Install frontend dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Status "Installing frontend dependencies..."
    npm install
}

# Start frontend server
Write-Status "Launching frontend server on http://localhost:3001..."
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}

# Wait for frontend to start
Start-Sleep -Seconds 5

# Check if frontend started successfully
if (Test-Port -Port 3001) {
    Write-Success "Frontend server started successfully"
} else {
    Write-Warning "Frontend server may still be starting..."
}

# Display server information
Write-Host ""
Write-Host "🚀 Audio Transcriber App is now running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📱 Frontend: http://localhost:3001" -ForegroundColor Yellow
Write-Host "🔧 Backend:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "📊 API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "💡 Health:   http://localhost:8000/health" -ForegroundColor Yellow
Write-Host ""

# Open browser if requested
if (-not $NoBrowser) {
    Write-Status "Opening application in your default browser..."
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3001"
}

Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Cyan
Write-Host ""

# Keep script running and monitor jobs
try {
    while ($true) {
        if ($backendJob.State -eq "Failed" -or $frontendJob.State -eq "Failed") {
            Write-Error "One of the servers has failed. Check the job output for details."
            break
        }
        Start-Sleep -Seconds 5
    }
}
finally {
    # Cleanup jobs
    if ($backendJob) { Stop-Job $backendJob -ErrorAction SilentlyContinue; Remove-Job $backendJob -ErrorAction SilentlyContinue }
    if ($frontendJob) { Stop-Job $frontendJob -ErrorAction SilentlyContinue; Remove-Job $frontendJob -ErrorAction SilentlyContinue }
    Stop-Servers
}
