# Build frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app/frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/ .

# Vite will pick up VITE_* env vars at build-time
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_FIREBASE_VAPID_KEY
ARG VITE_BACKEND_URL
ARG VITE_SOCKET_URL

ENV VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
ENV VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
ENV VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
ENV VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
ENV VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
ENV VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID}
ENV VITE_FIREBASE_VAPID_KEY=${VITE_FIREBASE_VAPID_KEY}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

# Generate SW config for FCM background messages (optional)
# This file is imported by /public/firebase-messaging-sw.js at runtime
RUN set -eux; \
  printf "self.FIREBASE_SW_CONFIG = {\\n  apiKey: '%s',\\n  authDomain: '%s',\\n  projectId: '%s',\\n  storageBucket: '%s',\\n  messagingSenderId: '%s',\\n  appId: '%s',\\n  measurementId: '%s'\\n};\\n" \
  "$VITE_FIREBASE_API_KEY" \
  "$VITE_FIREBASE_AUTH_DOMAIN" \
  "$VITE_FIREBASE_PROJECT_ID" \
  "$VITE_FIREBASE_STORAGE_BUCKET" \
  "$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  "$VITE_FIREBASE_APP_ID" \
  "${VITE_FIREBASE_MEASUREMENT_ID:-}" \
  > /app/frontend/public/firebase-config-sw.js

RUN npm run build

# Nginx to serve built assets and proxy to backend
FROM nginx:1.25-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build-frontend /app/frontend/dist /usr/share/nginx/html
