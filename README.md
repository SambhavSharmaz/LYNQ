# Lynq

Tagline: "Stay Lynq’d. Always."

Lynq is a modern, AI-enhanced real-time chat application that combines the simplicity of WhatsApp with the scalability of Discord. It enables seamless 1:1 and group conversations, file sharing, and smart AI features — all within a clean, elegant interface.

## Tech Stack
- Frontend: React (Vite) + TailwindCSS + Framer Motion
- Backend: Node.js + Express + Socket.IO
- Database: Firebase Firestore
- Authentication: Firebase Auth (Email + Google Sign-in)
- Storage: Firebase Storage (for media)
- AI API: Gemini (smart replies, summaries, moderation)
- Notifications: Firebase Cloud Messaging (web push)
- Deployment: Docker + Jenkins CI/CD
- Proxy: Nginx reverse proxy for frontend/backend routing
- Orchestration: Docker Compose

## Quick start (Docker)

1. Copy `.env.example` to `.env` and fill values (Firebase + Gemini):
   - VITE_FIREBASE_* variables from your Firebase project settings
   - GEMINI_API_KEY from Google AI Studio

2. Build and run:
   ```bash
   docker compose build
   docker compose up -d
   ```

3. Open http://localhost:8080

Backend API will be available via Nginx at `/api`, websockets at `/socket.io`.

## Local development (without Docker)

- Backend
  ```bash
  cd backend
  cp .env.example .env   # set GEMINI_API_KEY and FRONTEND_ORIGIN
  npm install
  npm run dev
  ```
  The backend runs at http://localhost:5000

- Frontend
  ```bash
  cd frontend
  cp .env.example .env   # paste your Firebase Web App config and backend URLs
  npm install
  npm run dev
  ```
  The frontend runs at http://localhost:5173. Ensure frontend/.env has:
  - VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID, VITE_FIREBASE_MEASUREMENT_ID (optional), VITE_FIREBASE_VAPID_KEY (optional)
  - VITE_BACKEND_URL and VITE_SOCKET_URL pointing to http://localhost:5000

## Firebase Setup
- Create a Firebase project and enable:
  - Authentication: Email/Password + Google
  - Firestore: in production or test mode
  - Storage
  - Cloud Messaging: generate a VAPID key and set VITE_FIREBASE_VAPID_KEY
- Download your web app config and map to VITE_FIREBASE_* env vars.

### Security Rules
This repo includes recommended security rules:
- Firestore: `firebase/firestore.rules`
- Storage: `firebase/storage.rules`

Deploy them with the Firebase CLI:
```bash path=null start=null
# Install CLI if needed
npm i -g firebase-tools

# Login and select your project
firebase login
firebase use <your-project-id>

# Deploy rules
firebase deploy --only firestore:rules,storage:rules --project <your-project-id>
```

Notes:
- FCM receiving is wired via `public/firebase-messaging-sw.js` but sending notifications typically requires server credentials or Cloud Functions. This template does not send push notifications on the server by default.

## Environment Variables
See `.env.example` for all required variables.

## Jenkins CI/CD
A sample `Jenkinsfile` is provided that builds and deploys with Docker Compose. Adjust agents and credentials to your infrastructure.

## Security
- Do not commit real secrets.
- Backend expects `GEMINI_API_KEY` via environment variable.

## License
MIT
