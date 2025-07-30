# 🚀 Audio Transcriber App - Startup Guide

This guide helps you quickly start the Audio Transcriber App using the provided startup scripts.

## 📋 Quick Reference

| Platform | Script | Command |
|----------|--------|---------|
| Linux/macOS | `start-servers.sh` | `./start-servers.sh` |
| Windows (CMD) | `start-servers.bat` | `start-servers.bat` |
| Windows (PowerShell) | `start-servers.ps1` | `.\start-servers.ps1` |

## 🔧 Prerequisites

Before running the startup scripts, ensure you have:

1. **Python 3.8+** installed and accessible via `python` or `python3` command
2. **Node.js 16+** installed and accessible via `node` command
3. **npm** installed and accessible via `npm` command
4. **AssemblyAI API Key** ([Get one free](https://www.assemblyai.com/dashboard/signup))

## 📁 Required Configuration Files

The startup scripts will check for these files and exit if they're missing:

### Backend Configuration (`backend/.env`)
```env
# AssemblyAI Configuration
ASSEMBLYAI_API_KEY=your_api_key_here

# Server Configuration
HOST=0.0.0.0
PORT=8000

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://your-domain.com

# Upload Configuration
UPLOAD_DIR=uploads/
MAX_FILE_SIZE=100MB

# Logging Configuration
LOG_LEVEL=INFO
```

### Frontend Configuration (`frontend/.env`)
```env
# API Configuration
VITE_API_URL=http://localhost:8000

# Development Configuration
VITE_DEV_MODE=true
```

## 🚀 Starting the Application

### Linux/macOS

1. **Make the script executable** (first time only):
   ```bash
   chmod +x start-servers.sh
   ```

2. **Run the startup script**:
   ```bash
   ./start-servers.sh
   ```

### Windows (Command Prompt)

1. **Open Command Prompt** in the project directory
2. **Run the batch script**:
   ```cmd
   start-servers.bat
   ```

### Windows (PowerShell)

1. **Open PowerShell** in the project directory
2. **Allow script execution** (if needed, run as Administrator):
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. **Run the PowerShell script**:
   ```powershell
   .\start-servers.ps1
   ```

**PowerShell Options:**
- `.\start-servers.ps1 -NoBrowser` - Don't open browser automatically
- `.\start-servers.ps1 -Help` - Show help information

## 🌐 Accessing the Application

Once both servers are running, you can access:

- **🖥️ Main Application**: http://localhost:3001
- **🔧 Backend API**: http://localhost:8000
- **📚 API Documentation**: http://localhost:8000/docs
- **💚 Health Check**: http://localhost:8000/health

## 🛑 Stopping the Servers

### Linux/macOS
- Press `Ctrl+C` in the terminal running the script

### Windows (Command Prompt)
- Close the server windows or press `Ctrl+C` in each window

### Windows (PowerShell)
- Press `Ctrl+C` in the PowerShell window

## 🔍 Troubleshooting

### Common Issues

#### 1. "Command not found" errors
**Problem**: Python, Node.js, or npm not found
**Solution**: 
- Install the missing software
- Ensure it's added to your system PATH
- Restart your terminal/command prompt

#### 2. "Port already in use" errors
**Problem**: Ports 8000 or 3001 are occupied
**Solution**: 
- The scripts automatically try to free these ports
- Manually kill processes using these ports:
  ```bash
  # Linux/macOS
  lsof -ti :8000 | xargs kill -9
  lsof -ti :3001 | xargs kill -9
  
  # Windows (PowerShell)
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
  ```

#### 3. ".env file not found" errors
**Problem**: Missing configuration files
**Solution**: 
- Create the required `.env` files in `backend/` and `frontend/` directories
- Use the templates provided above

#### 4. "Virtual environment creation failed"
**Problem**: Python venv module not available
**Solution**:
```bash
# Install python3-venv (Ubuntu/Debian)
sudo apt-get install python3-venv

# Or use pip to install virtualenv
pip install virtualenv
```

#### 5. "npm install failed"
**Problem**: Node.js dependencies installation failed
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf frontend/node_modules
cd frontend && npm install
```

#### 6. PowerShell execution policy error
**Problem**: PowerShell script execution is disabled
**Solution**:
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Getting Help

If you encounter issues not covered here:

1. **Check the server logs** in the terminal windows
2. **Verify your configuration files** match the templates
3. **Ensure all prerequisites are properly installed**
4. **Check the main README.md** for additional setup instructions

### Manual Startup (Fallback)

If the startup scripts don't work, you can start the servers manually:

```bash
# Terminal 1: Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/macOS
# OR
venv\Scripts\activate.bat  # Windows
pip install -r requirements.txt
python app.py

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

## 🎯 Success Indicators

You'll know everything is working when you see:

- ✅ Backend server logs showing "Uvicorn running on http://0.0.0.0:8000"
- ✅ Frontend server logs showing "Local: http://localhost:3001/"
- ✅ Browser opens automatically to the application
- ✅ No error messages in the terminal outputs

Happy transcribing! 🎉
