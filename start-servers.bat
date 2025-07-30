@echo off
REM Audio Transcriber App - Server Startup Script (Windows)
REM This script starts both frontend and backend servers

setlocal enabledelayedexpansion

REM Colors for output (Windows 10+ with ANSI support)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

echo %BLUE%[INFO]%NC% Starting Audio Transcriber App...
echo ==================================

REM Check prerequisites
echo %BLUE%[INFO]%NC% Checking prerequisites...

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR]%NC% Python is not installed or not in PATH. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR]%NC% Node.js is not installed or not in PATH. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR]%NC% npm is not installed or not in PATH. Please install npm.
    pause
    exit /b 1
)

echo %GREEN%[SUCCESS]%NC% All prerequisites are available

REM Check if .env files exist
if not exist "backend\.env" (
    echo %RED%[ERROR]%NC% Backend .env file not found. Please create backend\.env with your configuration.
    pause
    exit /b 1
)

if not exist "frontend\.env" (
    echo %RED%[ERROR]%NC% Frontend .env file not found. Please create frontend\.env with your configuration.
    pause
    exit /b 1
)

REM Read ports from environment files
set BACKEND_PORT=8000
set FRONTEND_PORT=3001

REM Read backend port from .env if available
if exist "backend\.env" (
    for /f "tokens=2 delims==" %%a in ('findstr "^PORT=" backend\.env 2^>nul') do set BACKEND_PORT=%%a
)

REM Read frontend port from .env if available
if exist "frontend\.env" (
    for /f "tokens=2 delims==" %%a in ('findstr "^VITE_PORT=" frontend\.env 2^>nul') do set FRONTEND_PORT=%%a
)

echo %BLUE%[INFO]%NC% Using ports: Backend=%BACKEND_PORT%, Frontend=%FRONTEND_PORT%

REM Kill any existing processes on our ports
echo %BLUE%[INFO]%NC% Checking for existing processes on ports %BACKEND_PORT% and %FRONTEND_PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%BACKEND_PORT%') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%FRONTEND_PORT%') do (
    taskkill /f /pid %%a >nul 2>&1
)

REM Start Backend Server
echo %BLUE%[INFO]%NC% Starting backend server...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo %YELLOW%[WARNING]%NC% Virtual environment not found. Creating one...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if requirements are installed
if not exist ".requirements_installed" (
    echo %BLUE%[INFO]%NC% Installing backend dependencies...
    pip install -r requirements.txt
    echo. > .requirements_installed
)

REM Start backend server
echo %BLUE%[INFO]%NC% Launching backend server on http://localhost:8000...
start "Backend Server" cmd /k "python app.py"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Check if backend started (simple check)
netstat -an | findstr :%BACKEND_PORT% >nul
if %errorlevel% neq 0 (
    echo %YELLOW%[WARNING]%NC% Backend server may still be starting...
) else (
    echo %GREEN%[SUCCESS]%NC% Backend server started successfully
)

REM Start Frontend Server
echo %BLUE%[INFO]%NC% Starting frontend server...
cd ..\frontend

REM Install frontend dependencies if needed
if not exist "node_modules" (
    echo %BLUE%[INFO]%NC% Installing frontend dependencies...
    npm install
)

REM Start frontend server
echo %BLUE%[INFO]%NC% Launching frontend server on http://localhost:3001...
start "Frontend Server" cmd /k "npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

REM Check if frontend started (simple check)
netstat -an | findstr :%FRONTEND_PORT% >nul
if %errorlevel% neq 0 (
    echo %YELLOW%[WARNING]%NC% Frontend server may still be starting...
) else (
    echo %GREEN%[SUCCESS]%NC% Frontend server started successfully
)

REM Display server information
echo.
echo 🚀 Audio Transcriber App is now running!
echo ========================================
echo 📱 Frontend: http://localhost:%FRONTEND_PORT%
echo 🔧 Backend:  http://localhost:%BACKEND_PORT%
echo 📊 API Docs: http://localhost:%BACKEND_PORT%/docs
echo 💡 Health:   http://localhost:%BACKEND_PORT%/health
echo.
echo Both servers are running in separate windows.
echo Close the server windows or press Ctrl+C in them to stop the servers.
echo.

REM Open the application in default browser
echo %BLUE%[INFO]%NC% Opening application in your default browser...
timeout /t 2 /nobreak >nul
start http://localhost:%FRONTEND_PORT%

echo %GREEN%[SUCCESS]%NC% Startup complete! Check the server windows for any errors.
echo.
pause
