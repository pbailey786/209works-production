# Google OAuth Configuration Fix

## Current Issue

- App running on: `http://localhost:3000`
- NEXTAUTH_URL was: `http://localhost:3002` (FIXED ✅)
- Google OAuth client expects: `http://localhost:3002/api/auth/callback/google`

## Required Google Cloud Console Changes

### 1. Go to Google Cloud Console

- URL: https://console.cloud.google.com/
- Navigate to: APIs & Services → Credentials

### 2. Edit OAuth 2.0 Client

- Client ID: `1035337828892-12r8l5j6ifc64nkum1ptfc2e8i3rgn8v.apps.googleusercontent.com`
- Click "Edit" button

### 3. Update Authorized Redirect URIs

Add these URIs (replace any existing localhost ones):

**Development:**

```
http://localhost:3000/api/auth/callback/google
```

**Production (when ready):**

```
https://209.works/api/auth/callback/google
https://www.209.works/api/auth/callback/google
```

### 4. Save Changes

- Click "Save" in Google Cloud Console
- Changes take effect immediately

## After Making Changes

1. **Restart your dev server:**

   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test Google Sign-in:**
   - Go to http://localhost:3000/signup
   - Click "Sign in with Google"
   - Should work without "Authorization Error"

## Alternative: Create New OAuth Client

If you can't edit the existing client, create a new one:

1. In Google Cloud Console → Credentials
2. Click "+ CREATE CREDENTIALS" → "OAuth 2.0 Client ID"
3. Application type: "Web application"
4. Name: "209jobs-dev"
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
6. Copy the new Client ID and Secret to your .env file

## Verification

After fixing, you should see:

- No "Authorization Error" page
- Successful redirect to Google OAuth
- Proper callback to your app
- User logged in successfully
