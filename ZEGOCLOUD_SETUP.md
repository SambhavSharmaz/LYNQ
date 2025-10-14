# Zegocloud Integration Setup Guide

## Overview
This guide will help you complete the migration from Agora to Zegocloud for video/voice calling functionality in your Lynq project.

## 1. Create Zegocloud Account & Get Credentials

1. **Sign up for Zegocloud:**
   - Go to [https://console.zegocloud.com/](https://console.zegocloud.com/)
   - Create an account and verify your email

2. **Create a Project:**
   - In the Zegocloud Console, click "Create Project"
   - Choose "Voice & Video Call" or "All-in-one SDK"
   - Give your project a name (e.g., "Lynq Video Calls")

3. **Get Your Credentials:**
   - Once your project is created, you'll see:
     - **App ID**: A numeric ID (e.g., 123456789)
     - **Server Secret**: A long string (e.g., abc123def456...)

## 2. Update Environment Variables

Update your `.env` file in the frontend directory:

```env
# Replace the placeholder values with your actual Zegocloud credentials
VITE_ZEGO_APP_ID=your_actual_app_id_here
VITE_ZEGO_SERVER_SECRET=your_actual_server_secret_here
```

**Example:**
```env
VITE_ZEGO_APP_ID=1234567890
VITE_ZEGO_SERVER_SECRET=abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef
```

## 3. Test the Integration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser and navigate to the Chat page**

3. **Use the ZegoTest component:**
   - You'll see a "Zegocloud Connection Test" button in the top-right corner
   - Click it to test your credentials
   - If successful, you'll see "✅ Successfully connected to Zegocloud!"

## 4. What's Been Changed

### Dependencies
- ❌ Removed: `agora-rtc-sdk-ng`
- ✅ Added: `zego-express-engine-webrtc`

### Files Updated
- **New Hook**: `src/hooks/useZegoCloud.js` - Replaces `useAgoraRTC.js`
- **Updated Component**: `src/components/VideoCallInterface.jsx` - Now uses HTML5 video elements
- **Updated Page**: `src/pages/Chat.jsx` - Uses new Zegocloud hook
- **New Test Component**: `src/components/ZegoTest.jsx` - For testing connectivity
- **Environment**: `.env` - Updated with Zegocloud credentials

### Key Differences from Agora
1. **Video Rendering**: Uses HTML5 `<video>` elements instead of Agora's track system
2. **Stream Management**: Direct MediaStream handling instead of Agora tracks
3. **Token Generation**: Done client-side for development (should be server-side in production)
4. **Event Handling**: Different event names and structures

## 5. Production Considerations

### Security (Important!)
- **Move token generation to your backend** - The current implementation generates tokens on the client side, which exposes your Server Secret
- Create an API endpoint on your backend to generate tokens securely
- Example backend endpoint:
  ```javascript
  app.post('/api/generate-zego-token', (req, res) => {
    const { userId, roomId } = req.body;
    const token = generateZegoToken(userId, roomId); // Use your server secret here
    res.json({ token });
  });
  ```

### Environment Variables
- Keep your `VITE_ZEGO_SERVER_SECRET` secure and don't commit it to public repositories
- Consider using different credentials for development and production

## 6. Testing Video Calls

1. **Single Device Test:**
   - Use the ZegoTest component to verify connection
   - Check browser console for any errors

2. **Two Device Test:**
   - Open your app on two different devices/browsers
   - Initiate a call from one device
   - Accept the call on the other device
   - Test video/audio toggle functionality

## 7. Troubleshooting

### Common Issues:

1. **"App ID or Server Secret not found"**
   - Check your `.env` file has the correct variable names
   - Restart your development server after changing `.env`

2. **"Invalid App ID"**
   - Verify the App ID is correct in Zegocloud Console
   - Ensure it's a numeric value (no quotes in .env)

3. **Video not showing****
   - Check browser permissions for camera/microphone
   - Ensure HTTPS is used (or localhost for development)
   - Check browser console for WebRTC errors

4. **Connection timeout**
   - Verify your internet connection
   - Check if firewall is blocking WebRTC traffic

### Browser Compatibility
- Chrome: Full support ✅
- Firefox: Full support ✅
- Safari: Full support ✅
- Edge: Full support ✅

## 8. Next Steps

After completing the setup:
1. Test the video calling functionality thoroughly
2. Implement server-side token generation for production
3. Add error handling and user feedback improvements
4. Consider implementing call quality monitoring
5. Add features like screen sharing, recording, etc.

## Support
- Zegocloud Documentation: [https://docs.zegocloud.com/](https://docs.zegocloud.com/)
- Zegocloud Console: [https://console.zegocloud.com/](https://console.zegocloud.com/)