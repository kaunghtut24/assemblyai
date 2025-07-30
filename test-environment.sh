#!/bin/bash

# Test script for environment variable configuration
# This script tests different environment configurations for the audio transcriber app

echo "🧪 Testing Environment Variable Configuration"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_api() {
    local url=$1
    local description=$2
    
    echo -n "Testing $description... "
    
    if curl -s --max-time 5 "$url/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

echo ""
echo "📋 Current Environment Configuration:"
echo "------------------------------------"

# Check backend environment
if [ -f "backend/.env" ]; then
    echo "Backend .env file:"
    grep -E "^(CORS_ORIGINS|PORT|HOST|VITE_API_URL)" backend/.env 2>/dev/null || echo "  No relevant config found"
else
    echo "  ❌ No backend .env file found"
fi

echo ""

# Check frontend environment  
if [ -f "frontend/.env" ]; then
    echo "Frontend .env file:"
    grep -E "^VITE_API_URL" frontend/.env 2>/dev/null || echo "  No VITE_API_URL found"
else
    echo "  ❌ No frontend .env file found"
fi

echo ""
echo "🔍 Testing API Endpoints:"
echo "------------------------"

# Test localhost
test_api "http://localhost:8000" "localhost:8000"

# Test 127.0.0.1
test_api "http://127.0.0.1:8000" "127.0.0.1:8000"

echo ""
echo "📊 Configuration Validation:"
echo "---------------------------"

# Check if CORS origins are properly configured
if [ -f "backend/.env" ]; then
    cors_origins=$(grep "^CORS_ORIGINS=" backend/.env 2>/dev/null | cut -d'=' -f2)
    if [ -n "$cors_origins" ]; then
        echo -e "${GREEN}✅${NC} CORS_ORIGINS configured: $cors_origins"
    else
        echo -e "${YELLOW}⚠️${NC}  CORS_ORIGINS not configured (will use fallback)"
    fi
else
    echo -e "${RED}❌${NC} Backend .env file missing"
fi

# Check if frontend API URL is configured
if [ -f "frontend/.env" ]; then
    api_url=$(grep "^VITE_API_URL=" frontend/.env 2>/dev/null | cut -d'=' -f2)
    if [ -n "$api_url" ]; then
        echo -e "${GREEN}✅${NC} VITE_API_URL configured: $api_url"
    else
        echo -e "${YELLOW}⚠️${NC}  VITE_API_URL not configured (will use fallback)"
    fi
else
    echo -e "${RED}❌${NC} Frontend .env file missing"
fi

echo ""
echo "🚀 Deployment Readiness Check:"
echo "-----------------------------"

# Check if all required files exist
files_to_check=(
    "backend/.env.example"
    "frontend/.env.example" 
    "backend/start.py"
    "frontend/src/config/api.js"
)

all_files_exist=true
for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file exists"
    else
        echo -e "${RED}❌${NC} $file missing"
        all_files_exist=false
    fi
done

echo ""
if [ "$all_files_exist" = true ]; then
    echo -e "${GREEN}🎉 All configuration files are ready for deployment!${NC}"
else
    echo -e "${RED}⚠️  Some configuration files are missing${NC}"
fi

echo ""
echo "📖 Next Steps for Deployment:"
echo "----------------------------"
echo "1. Update backend/.env with your production CORS_ORIGINS"
echo "2. Update frontend/.env with your production VITE_API_URL"
echo "3. Use 'python backend/start.py' to start the backend"
echo "4. Use 'npm run dev' or 'npm run build' for the frontend"
echo ""
echo "Example production configuration:"
echo "Backend: CORS_ORIGINS=https://your-frontend.vercel.app"
echo "Frontend: VITE_API_URL=https://your-backend.railway.app"
