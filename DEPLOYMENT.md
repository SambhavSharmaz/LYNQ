# 🚀 Lynq Chat App Deployment Guide

## 📋 Prerequisites
- GitHub account
- Firebase project setup
- Your environment variables from `.env` file

## 🔧 Deployment Steps

### **Step 1: Prepare Your Code**

1. **Commit your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Lynq chat app"
   git branch -M main
   git remote add origin https://github.com/yourusername/lynq-chat.git
   git push -u origin main
   ```

### **Step 2: Deploy Backend (Railway - Recommended)**

1. **Go to [Railway](https://railway.app/)**
2. **Sign up** with your GitHub account
3. **Click "New Project"** → **"Deploy from GitHub repo"**
4. **Select your repository** and choose the `backend` folder
5. **Add environment variables** in Railway dashboard:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - Add any other backend env variables you have
6. **Deploy** and note your Railway app URL (e.g., `https://your-app-name.railway.app`)

### **Step 3: Deploy Frontend (Vercel - Recommended)**

1. **Go to [Vercel](https://vercel.com/)**
2. **Sign up** with your GitHub account
3. **Click "New Project"** → **Import your GitHub repo**
4. **Configure project:**
   - Framework: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add environment variables** in Vercel dashboard:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=lynq-96f69.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=lynq-96f69
   VITE_FIREBASE_STORAGE_BUCKET=lynq-96f69.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_FIREBASE_VAPID_KEY=your_vapid_key
   VITE_BACKEND_URL=https://your-railway-app.railway.app
   ```
6. **Deploy**

### **Step 4: Update Firebase Configuration**

1. **Go to Firebase Console** → **Authentication** → **Settings**
2. **Add your Vercel domain** to authorized domains:
   - `your-app-name.vercel.app`
3. **Update Firestore security rules** if needed
4. **Test your deployed app**

## 🎯 Alternative Platforms

### **Frontend Alternatives:**
- **Netlify**: Similar to Vercel, drag & drop deployment
- **GitHub Pages**: Free but static only
- **Surge.sh**: Simple CLI deployment

### **Backend Alternatives:**
- **Render**: 750 hours free/month, sleeps after 15min inactivity
- **Fly.io**: Good free tier with persistent storage
- **Heroku**: Limited free tier (7 hours/day)

## 🔗 Final URLs
After deployment, you'll have:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`
- **Firebase**: Already hosted by Google

## 🐛 Troubleshooting

### **Common Issues:**
1. **Build fails**: Check Node.js version compatibility
2. **Environment variables not working**: Make sure they're prefixed with `VITE_`
3. **CORS errors**: Update backend CORS configuration for your frontend URL
4. **Firebase auth fails**: Add your production domain to Firebase authorized domains

### **Debug Steps:**
1. Check browser console for errors
2. Verify environment variables are loaded
3. Test API endpoints directly
4. Check Firebase console for authentication logs

## 📞 Support
If you encounter issues, check:
- Vercel/Railway deployment logs
- Firebase console logs
- Browser developer tools console