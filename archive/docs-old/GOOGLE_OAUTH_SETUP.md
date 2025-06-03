# Google OAuth Setup Guide for 209Jobs

## Overview

This guide will help you set up Google OAuth authentication for your 209Jobs application. Users will be able to sign up and sign in using their Google accounts.

## Prerequisites

- Google Cloud Console account
- 209Jobs application running locally or deployed

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `209jobs-oauth` (or your preferred name)
4. Click "Create"

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace)
3. Fill in the required information:
   - **App name**: 209Jobs
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes (click "Add or Remove Scopes"):
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Save and continue through the remaining steps

### 1.4 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the name: `209Jobs Web Client`
5. Add Authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For development (port 3003): `http://localhost:3003/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
6. Click "Create"
7. Copy the **Client ID** and **Client Secret** (you'll need these for environment variables)

## Step 2: Environment Configuration

### 2.1 Create Environment File

Create a `.env.local` file in your project root with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id-from-step-1.4"
GOOGLE_CLIENT_SECRET="your-google-client-secret-from-step-1.4"

# Database (if not already configured)
DATABASE_URL="postgresql://username:password@localhost:5432/209jobs"

# Email Configuration (if not already configured)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASS="your-app-password"
EMAIL_FROM="209jobs <noreply@209jobs.com>"
```

### 2.2 Generate NextAuth Secret

If you don't have a `NEXTAUTH_SECRET`, generate one:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 3: Testing the Setup

### 3.1 Start Your Application

```bash
npm run dev
```

### 3.2 Test Google Sign Up

1. Navigate to `http://localhost:3000/signup`
2. You should see a "Continue with Google" button
3. Click the button
4. You should be redirected to Google's OAuth consent screen
5. Grant permissions
6. You should be redirected back to your application and logged in

### 3.3 Verify User Creation

Check your database to ensure the user was created with the Google OAuth data.

## Step 4: Production Deployment

### 4.1 Update OAuth Redirect URIs

1. Go back to Google Cloud Console → "APIs & Services" → "Credentials"
2. Edit your OAuth 2.0 Client ID
3. Add your production domain to Authorized redirect URIs:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

### 4.2 Update Environment Variables

Update your production environment variables:

```bash
NEXTAUTH_URL="https://yourdomain.com"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Troubleshooting

### Common Issues

**Error: "redirect_uri_mismatch"**

- Check that your redirect URI in Google Cloud Console exactly matches your application URL
- Ensure you're using the correct port (3000 or 3003)
- Make sure there are no trailing slashes

**Error: "invalid_client"**

- Verify your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check that the OAuth client is enabled in Google Cloud Console

**Users not being created in database**

- Ensure your database is running and accessible
- Check that the Prisma adapter is properly configured
- Verify your database schema includes the necessary NextAuth tables

**OAuth consent screen issues**

- Make sure you've published your OAuth consent screen
- Verify all required fields are filled in
- Check that your app is not in testing mode (or add test users)

### Debug Mode

Enable NextAuth debug mode by adding to your environment:

```bash
NEXTAUTH_DEBUG=true
```

## Security Considerations

1. **Keep credentials secure**: Never commit your `.env.local` file to version control
2. **Use HTTPS in production**: Google OAuth requires HTTPS for production domains
3. **Restrict redirect URIs**: Only add the exact URIs you need
4. **Monitor usage**: Keep an eye on your Google Cloud Console for unusual activity
5. **Rotate secrets**: Periodically rotate your OAuth credentials

## Features Enabled

With Google OAuth configured, users can:

- Sign up with their Google account
- Sign in with their Google account
- Have their profile information (name, email, profile picture) automatically populated
- Skip email verification (since Google has already verified the email)

## Next Steps

Consider implementing:

- Profile picture display from Google account
- Additional OAuth providers (GitHub, LinkedIn, etc.)
- Account linking (allowing users to connect multiple OAuth providers)
- Role-based access control for OAuth users
