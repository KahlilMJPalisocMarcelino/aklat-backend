# Google OAuth Setup Guide

## Quick Setup Steps

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Create or Select a Project**

3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (or "Internal" if using Google Workspace)
   - Fill in app information:
     - App name: "Aklat Para Sa Lahat"
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (your email)

5. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "Aklat Web Client"
   - **Authorized JavaScript origins**:
     - Development: `http://localhost:5000`
     - Production: Your frontend URL (e.g., `https://your-app.vercel.app`)
   - **Authorized redirect URIs**:
     - Development: `http://localhost:5000/api/auth/google/callback`
     - Production: Your backend URL + `/api/auth/google/callback`
   - Click "Create"
   - **Copy the Client ID**

6. **Set in Your Application**:
   - Backend: Add `GOOGLE_CLIENT_ID` to `.env` file
   - Frontend: Add `GOOGLE_CLIENT_ID` to HTML configuration script

## Testing

1. Start your backend server
2. Open your frontend
3. Click "Continue with Google"
4. Sign in with a test user email
5. Should redirect back and log you in!
