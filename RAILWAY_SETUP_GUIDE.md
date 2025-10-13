# Deploy Your Lynq Backend to Railway

## Prerequisites
- GitHub account
- Railway account (free signup)
- Your backend code ready

## Step 1: Push Your Code to GitHub

### 1.1 Initialize Git Repository (if not already done)
```bash
# Navigate to your project root
cd C:\Users\Sambhav\Desktop\REACT(2025)\ReactProj\RP1\mern\MernProjects\Lynq

# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: Lynq chat app with backend"
```

### 1.2 Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click "+" in top-right corner → "New repository"
3. Name: `lynq-chat-app`
4. Description: `Real-time chat app with typing indicators and friend system`
5. Set to **Public** or **Private** (Railway works with both)
6. Click "Create repository"

### 1.3 Push to GitHub
```bash
# Add GitHub remote (replace with your username)
git remote add origin https://github.com/YOUR_USERNAME/lynq-chat-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Railway

### 2.1 Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub

### 2.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `lynq-chat-app` repository
4. Railway will automatically detect it's a Node.js project

### 2.3 Configure Build Settings
Railway should automatically detect your backend, but if it doesn't:

1. Click on your project
2. Go to "Settings" tab
3. Set these values:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

## Step 3: Set Environment Variables

### 3.1 Required Variables
In Railway dashboard → "Variables" tab, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `FRONTEND_ORIGIN` | `https://lynq-96f69.web.app` | Your Firebase frontend URL |
| `PORT` | `${{RAILWAY_PORT}}` | Railway auto-assigns this |

### 3.2 Optional Variables (if using AI features)
| Variable | Value | Description |
|----------|-------|-------------|
| `OPENAI_API_KEY` | `your-openai-key` | For smart replies |
| `GEMINI_API_KEY` | `your-gemini-key` | Alternative AI service |

### How to add variables:
1. Click "Variables" tab in your Railway project
2. Click "New Variable"
3. Enter name and value
4. Click "Add"

## Step 4: Verify Deployment

### 4.1 Check Deployment Status
1. Go to "Deployments" tab
2. Wait for green checkmark ✅
3. Click on the deployment to see logs

### 4.2 Get Your Backend URL
1. Go to "Settings" tab
2. Look for "Public Networking"
3. Your URL will be something like:
   `https://your-project-name-production.up.railway.app`

### 4.3 Test Your Backend
```bash
# Test health endpoint (replace with your Railway URL)
curl https://your-project-name-production.up.railway.app/api/health

# Should return: {"status":"ok","message":"Backend is running"}
```

## Step 5: Update Frontend Configuration

Update your frontend environment variables to use the Railway URL:

### 5.1 Update .env files
```bash
# In frontend/.env.production
VITE_BACKEND_URL=https://your-project-name-production.up.railway.app
VITE_SOCKET_URL=https://your-project-name-production.up.railway.app
```

### 5.2 Redeploy Frontend
After updating the backend URL, redeploy your frontend to Firebase:
```bash
cd frontend
npm run build
firebase deploy
```

## Step 6: Alternative - Railway CLI Method

### 6.1 Install Railway CLI
```bash
npm install -g @railway/cli
```

### 6.2 Login and Deploy
```bash
# Login to Railway
railway login

# Navigate to backend directory
cd backend

# Initialize Railway project
railway link

# Deploy
railway up
```

## Troubleshooting

### Common Issues:

#### ❌ Build Failed
- Check that `package.json` is in the backend directory
- Verify Node.js version compatibility
- Check Railway build logs for errors

#### ❌ App Won't Start
- Ensure `start` script is defined in `package.json`:
  ```json
  {
    "scripts": {
      "start": "node src/index.js"
    }
  }
  ```
- Check that PORT is set correctly
- Review Railway deployment logs

#### ❌ CORS Still Blocked
- Verify `FRONTEND_ORIGIN` environment variable is set
- Check Railway logs for "Allowed CORS origins" message
- Make sure deployment completed successfully

### Check Railway Logs
1. Go to Railway dashboard
2. Click on your project
3. Click "View Logs" to see real-time logs
4. Look for startup messages and errors

## Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain
1. Go to "Settings" → "Domains"
2. Click "Custom Domain"
3. Enter your domain (e.g., `api.lynq.app`)
4. Follow DNS setup instructions

### 7.2 Update Frontend
If you add a custom domain, update your frontend:
```bash
# frontend/.env.production
VITE_BACKEND_URL=https://api.lynq.app
VITE_SOCKET_URL=https://api.lynq.app
```

## Final Configuration Summary

After successful deployment, your setup should be:

### Backend (Railway)
- URL: `https://your-app.railway.app`
- Environment: `NODE_ENV=production`
- CORS: Allows `https://lynq-96f69.web.app`
- Socket.io: Enabled for typing indicators

### Frontend (Firebase)
- URL: `https://lynq-96f69.web.app`
- Backend URL: Points to Railway deployment
- Socket connection: Connected to Railway

### Features Working
- ✅ Real-time chat
- ✅ Typing indicators
- ✅ Online/offline status
- ✅ Smart replies (if AI configured)
- ✅ File uploads
- ✅ Friend system