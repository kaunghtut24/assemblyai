# 🪟 Windows Setup Guide

## Quick Start

### Prerequisites
1. **Python 3.8+** - Download from [python.org](https://python.org)
2. **Node.js 16+** - Download from [nodejs.org](https://nodejs.org)
3. **AssemblyAI API Key** - Get from [assemblyai.com](https://assemblyai.com)

### Easy Setup (Recommended)

1. **Download/Clone** this project to your Windows machine
2. **Create environment file**: Create `backend\.env` with your API key:
   ```
   ASSEMBLYAI_API_KEY=your_api_key_here
   ```
3. **Run the startup script**: Double-click `start-windows.bat`

The script will:
- ✅ Check if Python and Node.js are installed
- ✅ Install all dependencies automatically
- ✅ Start both backend and frontend servers
- ✅ Open the app in your browser

### Manual Setup

If the automatic script doesn't work, follow these steps:

#### Backend Setup
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### Frontend Setup (in a new terminal)
```cmd
cd frontend
npm install
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

### Troubleshooting

#### CORS Errors
If you see "Cross-Origin Request Blocked" errors:
1. Make sure the backend server is running on port 8000
2. Check that both servers are running on the same machine
3. Try refreshing the frontend page

#### Port Already in Use
If ports 3000 or 8000 are busy:
- **Frontend**: The Vite dev server will automatically try the next available port
- **Backend**: Edit `backend/app.py` and change the port in the last line

#### Python/Node.js Not Found
1. Make sure Python and Node.js are installed
2. Add them to your Windows PATH environment variable
3. Restart your command prompt/terminal

#### API Key Issues
1. Verify your AssemblyAI API key is correct
2. Make sure the `.env` file is in the `backend` folder
3. Check that there are no extra spaces in the `.env` file

### Features Available

✅ **Upload & Transcribe** audio/video files  
✅ **Estimated Time** display before transcription  
✅ **Simple Animation** during processing  
✅ **Collapse/Expand** transcript results  
✅ **Dark/Light Theme** toggle  
✅ **Copy to Clipboard** functionality  
✅ **Download Transcript** as text file  
✅ **Audio Playback** with word highlighting  
✅ **Transcript History** management  

### Performance Notes

- The app includes intelligent caching for faster repeat transcriptions
- Performance metrics are shown when the backend is available
- File uploads are optimized for large audio files
- The interface is mobile-friendly and touch-optimized

### Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify both servers are running and accessible
3. Make sure your AssemblyAI API key has sufficient credits
4. Try uploading a smaller audio file first to test the setup
