# CORS Fix Instructions

## Problem
Your backend is deployed on Railway but the CORS policy is blocking requests from your frontend deployed on Firebase Hosting (`https://lynq-96f69.web.app`).

## Solution 1: Update Railway Environment Variables (Recommended)

### Step 1: Login to Railway
1. Go to [railway.app](https://railway.app)
2. Login to your account
3. Find your Lynq backend project

### Step 2: Set Environment Variable
1. Go to your project dashboard
2. Click on "Variables" tab
3. Add a new environment variable:
   - **Name**: `FRONTEND_ORIGIN`
   - **Value**: `https://lynq-96f69.web.app`
4. Click "Add" or "Save"

### Step 3: Redeploy
1. Railway should automatically redeploy after adding the environment variable
2. If not, trigger a manual deployment

## Solution 2: Allow Multiple Origins (Alternative)

If you want to allow multiple origins (development + production), update your backend code:

```javascript
// In backend/src/index.js
const allowedOrigins = [
  'http://localhost:3000',           // Development
  'http://localhost:5173',           // Vite dev server
  'https://lynq-96f69.web.app',     // Production frontend
  process.env.FRONTEND_ORIGIN        // Additional custom origin
].filter(Boolean);

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

// Also update Socket.io CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  },
  path: '/socket.io'
});
```

## Solution 3: Temporary Fix (Allow All Origins - NOT for production)

For testing purposes only, you can temporarily allow all origins:

```javascript
// ONLY FOR TESTING - DO NOT USE IN PRODUCTION
app.use(cors({ origin: true, credentials: true }));
```

## Quick Railway CLI Fix (If you have Railway CLI)

```bash
# Install Railway CLI if not installed
npm install -g @railway/cli

# Login to Railway
railway login

# Set the environment variable
railway variables set FRONTEND_ORIGIN=https://lynq-96f69.web.app

# Deploy
railway deploy
```

## Verify the Fix

After applying the fix:

1. Wait for deployment to complete
2. Open your frontend at `https://lynq-96f69.web.app`
3. Try using the smart replies feature
4. Check browser console - the CORS error should be gone

## Current Backend CORS Configuration

Your backend is correctly set up to use environment variables:

```javascript
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({ 
  origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN, 
  credentials: true 
}));
```

The issue is just that `FRONTEND_ORIGIN` is not set in Railway, so it's probably defaulting to Railway's domain.