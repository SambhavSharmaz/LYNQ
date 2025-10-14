# 🚀 Agora RTC Setup Guide - Step by Step

## Step 1: Create Agora Account & Project

### 1.1 Sign up for Agora
1. Go to **https://console.agora.io/**
2. Click **"Sign Up"** if you don't have an account
3. Verify your email and complete registration

### 1.2 Create a New Project
1. After logging in, click **"Create"** button
2. Choose **"Project"**
3. Enter project name: **"Lynq Video Calls"**
4. Choose **"Secured mode: APP ID + Token (Recommended)"**
5. Click **"Submit"**

## Step 2: Get Your App ID

1. In your project dashboard, you'll see:
   ```
   Project Name: Lynq Video Calls
   App ID: [32-character string like: a1b2c3d4e5f6789...]
   ```
2. **Copy this App ID** (not the one currently in your .env file)

## Step 3: Generate Temporary Token

1. In your project dashboard, click **"Generate temp token"** 
   OR
2. Go to **"Tools" > "Token Generator"** in the left sidebar
3. Fill in:
   - **Channel Name**: `test-channel` (you can use any name)
   - **UID**: `0` (for dynamic assignment)
   - **Expiration**: `24 hours` (default)
4. Click **"Generate"**
5. **Copy the generated token**

## Step 4: Update Your Environment File

Replace the content in your `.env.local` file:

```env
# Agora RTC Configuration - Updated with NEW credentials
VITE_AGORA_APP_ID=YOUR_NEW_APP_ID_HERE
VITE_AGORA_TEMP_TOKEN=YOUR_NEW_TOKEN_HERE

# Backend URL for Socket.IO connection (use localhost for development)
VITE_BACKEND_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# Note: For production, implement a token server instead of using temporary tokens
# Temporary tokens expire after 24 hours and should only be used for testing
```

## Step 5: Test the Connection

1. **Save your `.env.local` file**
2. **Restart your development server**:
   ```bash
   # Stop with Ctrl+C, then restart
   npm run dev
   ```
3. **Use the AgoraTest component** in your app to verify the connection

## 🔍 Troubleshooting

### If you still get "invalid vendor key" error:
- ✅ Make sure you created a **new project** (don't use existing/demo projects)
- ✅ Copy the **exact App ID** from your project dashboard
- ✅ Ensure there are **no spaces or extra characters** in your .env file
- ✅ **Restart your dev server** after updating .env.local

### If you get "token expired" error:
- ✅ Generate a **new token** from Tools > Token Generator
- ✅ Make sure the **channel name matches** what you're using in tests

### Common Mistakes to Avoid:
- ❌ Using demo/example App IDs from tutorials
- ❌ Copying App ID with extra spaces or quotes
- ❌ Not restarting dev server after env changes
- ❌ Using the wrong project (make sure it's your own project)

## 🎯 Expected Result

After following these steps, you should see:
- ✅ Environment variables loaded correctly in debug panel
- ✅ "Successfully connected to Agora!" message in AgoraTest
- ✅ Video calls working without errors

## 📞 Support

If you continue having issues:
1. Double-check you're logged into the correct Agora account
2. Make sure your project is in "Secured mode"
3. Try generating a new token with a different channel name
4. Contact Agora support if the App ID still shows as invalid