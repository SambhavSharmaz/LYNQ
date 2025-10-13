# Deploy Your Lynq Backend to Render

## Why Render?
- ✅ Better GitHub integration than Railway
- ✅ Free tier with 750 hours/month
- ✅ Automatic SSL certificates
- ✅ Easy environment variable management
- ✅ Great for Node.js applications

## Step 1: Prepare Your Backend for Render

### 1.1 Create render.yaml (Optional but Recommended)
This helps Render understand your project structure:

```yaml
services:
  - type: web
    name: lynq-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    rootDir: ./backend
    plan: free
    envVars:
      - key: NODE_ENV
        value: production
      - key: FRONTEND_ORIGIN
        sync: false # We'll set this manually
```

### 1.2 Update Backend Package.json
Your backend package.json looks good, but let's make sure it has the right Node version:

```json
{
  "engines": {
    "node": "18.x"
  }
}
```

## Step 2: Deploy to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended)

### 2.2 Connect Your Repository
1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub account if not already connected
4. Find and select your repository: `SambhavSharmaz/LYNQ`
5. Click "Connect"

### 2.3 Configure Deployment Settings
Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `lynq-backend` |
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

### 2.4 Set Environment Variables
In the "Environment Variables" section, add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `FRONTEND_ORIGIN` | `https://lynq-96f69.web.app` |

### 2.5 Deploy
1. Click "Create Web Service"
2. Render will start building and deploying your app
3. Wait for the deployment to complete (usually 2-5 minutes)

## Step 3: Get Your Render URL

Once deployment is complete:
1. Your service URL will be displayed in the dashboard
2. It will look like: `https://lynq-backend.onrender.com`
3. Test it by visiting: `https://your-app.onrender.com/api/health`

## Step 4: Update Frontend Configuration

Update your frontend to use the Render backend:

### 4.1 Update .env.production
Replace the backend URL in your frontend environment file:

```bash
# In frontend/.env.production
VITE_BACKEND_URL=https://lynq-backend.onrender.com
VITE_SOCKET_URL=https://lynq-backend.onrender.com
```

### 4.2 Redeploy Frontend
```bash
cd frontend
npm run build
firebase deploy
```

## Step 5: Test Everything

### 5.1 Test Backend
```bash
# Test health endpoint
curl https://lynq-backend.onrender.com/api/health

# Test CORS (should not give error)
curl -H "Origin: https://lynq-96f69.web.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://lynq-backend.onrender.com/api/ai/smart-replies
```

### 5.2 Test Frontend
1. Open `https://lynq-96f69.web.app`
2. Try logging in
3. Start a chat
4. Test typing indicators
5. Try smart replies (should work without CORS errors)

## Render-Specific Configurations

### 5.1 Health Checks
Render automatically pings your app to keep it alive. Make sure your health endpoint works:

```javascript
// This should already be in your backend
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});
```

### 5.2 Sleep Prevention (Free Tier)
Render free tier sleeps after 15 minutes of inactivity. To prevent this:

1. Use a service like [UptimeRobot](https://uptimerobot.com) (free)
2. Or upgrade to a paid Render plan ($7/month)

### 5.3 Environment Variables
You can update environment variables anytime:
1. Go to your service dashboard
2. Click "Environment" tab
3. Add/edit variables
4. Click "Save Changes" (triggers automatic redeploy)

## Troubleshooting

### Common Issues:

#### ❌ Build Failed
- **Check Build Logs**: In Render dashboard → "Events" tab
- **Node Version**: Make sure you specify Node 18.x in package.json
- **Dependencies**: Verify all dependencies are in package.json

#### ❌ App Won't Start
- **Check Logs**: Dashboard → "Logs" tab
- **Port Configuration**: Render automatically sets PORT environment variable
- **Start Command**: Verify `npm start` script exists and works

#### ❌ CORS Still Blocked
- **Check Environment Variables**: Verify `FRONTEND_ORIGIN` is set correctly
- **Check Logs**: Look for "Allowed CORS origins" message
- **Restart Service**: Sometimes you need to manually restart

#### ❌ Socket.io Not Working
- **WebSocket Support**: Render supports WebSocket on all plans
- **URL Configuration**: Make sure VITE_SOCKET_URL matches your Render URL
- **Connection Logs**: Check browser console for connection errors

### View Logs
1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab for real-time logs
4. Click "Events" tab for deployment history

## Render vs Railway Comparison

| Feature | Render | Railway |
|---------|--------|---------|
| **Free Tier** | 750 hours/month | 500 hours/month |
| **GitHub Integration** | Excellent | Sometimes problematic |
| **Build Time** | Fast | Fast |
| **Custom Domains** | Free on all plans | Paid plans only |
| **Automatic HTTPS** | ✅ | ✅ |
| **WebSocket Support** | ✅ | ✅ |

## Advanced Configuration (Optional)

### Custom Domain
1. In Render dashboard → "Settings" → "Custom Domain"
2. Add your domain (e.g., `api.lynq.app`)
3. Update DNS records as instructed
4. Update frontend environment variables

### Auto-Deploy
Render automatically deploys when you push to your main branch. To disable:
1. Go to "Settings" tab
2. Toggle "Auto-Deploy" off

### Branch Deploys
You can deploy from different branches:
1. Create new web service
2. Select different branch
3. Use for staging/testing

## Final Configuration

After successful deployment:

### Backend (Render)
- ✅ URL: `https://lynq-backend.onrender.com`
- ✅ Environment: `NODE_ENV=production`
- ✅ CORS: Allows `https://lynq-96f69.web.app`
- ✅ Socket.io: Enabled for real-time features

### Frontend (Firebase)
- ✅ URL: `https://lynq-96f69.web.app`
- ✅ Backend: Points to Render deployment
- ✅ All features working

## Cost Comparison

### Free Tier Limits:
- **Render**: 750 hours/month (enough for always-on if you only have one service)
- **Railway**: 500 hours/month + $5 credit
- **Recommendation**: Render's free tier is more generous

Your app should now be fully deployed and working on Render! 🎉