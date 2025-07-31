@echo off
echo Starting Audio Transcriber App...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Python and Node.js are available
echo.

REM Check if .env file exists
if not exist "backend\.env" (
    echo ERROR: backend\.env file not found
    echo Please create backend\.env with your ASSEMBLYAI_API_KEY
    echo Example:
    echo ASSEMBLYAI_API_KEY=your_api_key_here
    pause
    exit /b 1
)

echo ✓ Environment file found
echo.

REM Start backend in a new window
echo Starting backend server...
start "Backend Server" cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python app.py"

REM Wait a moment for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend in a new window
echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ✓ Both servers are starting...
echo ✓ Backend will be available at: http://localhost:8000
echo ✓ Frontend will be available at: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
