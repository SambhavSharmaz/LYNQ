# Deploy Updated Backend to Railway

## What was updated:
1. ✅ **CORS Configuration**: Now allows your Firebase frontend (`https://lynq-96f69.web.app`)
2. ✅ **Socket Events**: Added typing indicators and presence system
3. ✅ **Better Error Handling**: More detailed CORS logging

## Deploy Methods:

### Method 1: Git Push (Recommended)
```bash
# Navigate to project root
cd C:\Users\Sambhav\Desktop\REACT(2025)\ReactProj\RP1\mern\MernProjects\Lynq

# Add changes
git add .

# Commit changes
git commit -m "fix: Update CORS for Firebase frontend and add typing indicators"

# Push to main branch (Railway auto-deploys)
git push origin main
```

### Method 2: Railway CLI
```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Navigate to backend directory
cd backend

# Deploy
railway deploy
```

### Method 3: Manual Upload
1. Go to [railway.app](https://railway.app)
2. Find your Lynq project
3. Go to "Deployments" tab
4. Click "Deploy from GitHub" or upload files manually

## Environment Variables to Set in Railway:

Make sure these are set in your Railway project:

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | ✅ |
| `FRONTEND_ORIGIN` | `https://lynq-96f69.web.app` | ✅ |
| `PORT` | (Railway sets automatically) | ✅ |

### How to set variables:
1. Go to Railway dashboard
2. Select your project
3. Click "Variables" tab
4. Add/update:
   - `FRONTEND_ORIGIN` = `https://lynq-96f69.web.app`

## Verify Deployment:

After deployment completes:

### 1. Check Backend Health
```bash
curl https://your-backend-app.railway.app/api/health
```

### 2. Check CORS Headers
```bash
curl -H "Origin: https://lynq-96f69.web.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-backend-app.railway.app/api/ai/smart-replies
```

Should return CORS headers allowing your origin.

### 3. Test from Frontend
1. Open `https://lynq-96f69.web.app`
2. Start a chat
3. Try typing (should show typing indicators)
4. Try smart replies (should work without CORS errors)

## Updated Backend Features:

### ✅ Enhanced CORS
- Allows multiple origins (dev + production)
- Better error messages
- Proper preflight handling

### ✅ Typing Indicators
- `typing-start` - User starts typing
- `typing-stop` - User stops typing
- Real-time broadcast to chat members

### ✅ Presence System
- `user-online` - User comes online
- `user-offline` - User goes offline
- `user-heartbeat` - Keep connection alive
- `user-status-change` - Broadcast status updates

### ✅ Better Socket Management
- Proper room joining/leaving
- Graceful disconnect handling
- Connection logging

## Troubleshooting:

### Still getting CORS errors?
1. Check Railway logs for the "Allowed CORS origins" message
2. Verify `FRONTEND_ORIGIN` environment variable is set
3. Make sure deployment completed successfully

### Typing indicators not working?
1. Check browser console for socket connection
2. Verify WebSocket connection in Network tab
3. Make sure backend logs show socket connections

### Backend not responding?
1. Check Railway deployment status
2. View Railway logs for errors
3. Verify all environment variables are set