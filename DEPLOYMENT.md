# 🚀 Deployment Guide

This guide covers deploying the AssemblyAI Transcriber App to various platforms.

## 📋 Pre-deployment Checklist

- [ ] AssemblyAI API key obtained
- [ ] Environment variables configured
- [ ] Dependencies tested locally
- [ ] Application tested end-to-end

## 🔧 Backend Deployment

### Railway (Recommended)
1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy:**
   ```bash
   cd backend
   railway login
   railway init
   railway add
   railway deploy
   ```

3. **Set Environment Variables:**
   ```bash
   railway variables set ASSEMBLYAI_API_KEY=your_api_key_here
   ```

### Heroku
1. **Create Procfile** (already included):
   ```
   web: uvicorn app:app --host 0.0.0.0 --port $PORT
   ```

2. **Deploy:**
   ```bash
   heroku create your-app-name
   heroku config:set ASSEMBLYAI_API_KEY=your_api_key_here
   git subtree push --prefix backend heroku main
   ```

### DigitalOcean App Platform
1. Connect GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set run command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
4. Add environment variable: `ASSEMBLYAI_API_KEY`

## 🌐 Frontend Deployment

### Vercel (Recommended)
1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure Environment:**
   - Update API endpoints in your frontend to point to deployed backend

### Netlify
1. **Build locally:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy:**
   - Drag and drop `dist` folder to Netlify
   - Or connect GitHub repository for automatic deployments

### GitHub Pages
1. **Install gh-pages:**
   ```bash
   cd frontend
   npm install --save-dev gh-pages
   ```

2. **Add to package.json:**
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://yourusername.github.io/assemblyai"
   }
   ```

3. **Deploy:**
   ```bash
   npm run build
   npm run deploy
   ```

## 🔗 Connecting Frontend to Backend

Update the API base URL in your frontend:

```javascript
// In frontend/src/components/FileUpload.jsx
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.railway.app'
  : 'http://localhost:8000';
```

## 🔒 Environment Variables

### Backend
- `ASSEMBLYAI_API_KEY`: Your AssemblyAI API key (required)
- `CORS_ORIGINS`: Comma-separated allowed origins for production
- `LOG_LEVEL`: Logging level (INFO, DEBUG, WARNING, ERROR)

### Frontend
- `VITE_API_URL`: Backend API URL for production builds

## 🔍 Health Checks

Both platforms support health checks:
- **Backend**: `GET /health`
- **Frontend**: Standard HTTP 200 response

## 📊 Monitoring

### Backend Monitoring
- Health endpoint: `/health`
- Metrics endpoint: `/metrics`
- Logs: Available through platform dashboards

### Frontend Monitoring
- Performance metrics built into the app
- Browser console for client-side errors
- Platform analytics (Vercel Analytics, Netlify Analytics)

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure backend CORS_ORIGINS includes frontend domain
   - Check that API URLs are correct

2. **API Key Issues:**
   - Verify ASSEMBLYAI_API_KEY is set correctly
   - Check API key permissions and quotas

3. **Build Failures:**
   - Ensure all dependencies are in requirements.txt/package.json
   - Check Node.js/Python versions match local development

4. **Performance Issues:**
   - Monitor `/metrics` endpoint for backend performance
   - Check browser network tab for slow requests
   - Verify connection pooling is working

### Debug Commands

```bash
# Check backend health
curl https://your-backend-url.railway.app/health

# Check backend metrics
curl https://your-backend-url.railway.app/metrics

# Test local backend
cd backend && uvicorn app:app --reload

# Test local frontend
cd frontend && npm run dev
```

## 🔄 CI/CD (Optional)

For automatic deployments, both Railway and Vercel support GitHub integration:

1. Connect your GitHub repository
2. Enable automatic deployments on push to main
3. Set environment variables in platform dashboard
4. Deployments will trigger automatically on code changes

## 📈 Scaling

### Backend Scaling
- Railway: Automatic scaling based on traffic
- Heroku: Scale dynos as needed
- DigitalOcean: Configure auto-scaling rules

### Frontend Scaling
- Vercel/Netlify: Automatic CDN distribution
- No additional configuration needed for static sites

## 💰 Cost Optimization

- Use free tiers for development/testing
- Monitor AssemblyAI usage and costs
- Consider caching strategies for frequently transcribed content
- Use environment-specific configurations
