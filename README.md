# WebRTC App - Backend

This is the backend server for the WebRTC application. It handles user authentication, dashboard data, real-time chat, and WebRTC signaling (using Socket.io) for peer-to-peer connections.

## Tech Stack
- **Node.js & Express:** Core server framework
- **TypeScript:** For type safety
- **Socket.io:** Real-time WebRTC signaling and chat
- **MySQL:** Database for storing users and metadata
- **Google Auth Library:** For OAuth authentication

## Local Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Copy the `.env.example` file to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in the missing values in your `.env` file (e.g., Database credentials, Google Client ID, JWT Secret).

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:8000` (or your defined `PORT`).

## Production Deployment
To deploy this application, build the TypeScript code first:
```bash
npm run build
```
Then start the server:
```bash
npm start
```
Make sure to set the production environment variables (like `NODE_ENV=production` and `FRONTEND_URL`) in your deployment host dashboard (e.g., Render, Railway).
