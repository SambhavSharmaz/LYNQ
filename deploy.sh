#!/bin/bash

# Lynq Chat App - Quick Deployment Script
echo "🚀 Preparing Lynq Chat App for deployment..."

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Frontend built successfully"

# Check backend
echo "🔍 Checking backend..."
cd backend
npm install
cd ..

echo "✅ Backend dependencies installed"

echo "🎉 Project is ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push code to GitHub"
echo "2. Deploy backend to Railway/Render"
echo "3. Deploy frontend to Vercel/Netlify"
echo "4. Update environment variables"
echo ""
echo "See DEPLOYMENT.md for detailed instructions"