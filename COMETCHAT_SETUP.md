# CometChat Setup Guide

## Issue Resolved
The DNS error `ENOTFOUND api-tz.cometchat.io` was caused by using an invalid CometChat region code "tz".

## Valid CometChat Regions
CometChat only supports these three regions:
- **us** - United States
- **eu** - Europe  
- **in** - India

## Environment Variables Setup

### Step 1: Create `.env.local` file
Create a file named `.env.local` in the root of your project with the following content:

```env
# CometChat Configuration
# Get these values from your CometChat dashboard: https://www.cometchat.com/

# Your CometChat App ID
NEXT_PUBLIC_COMETCHAT_APP_ID=16712913472aea194

# CometChat Region: Must be one of: "us", "eu", or "in"
NEXT_PUBLIC_COMETCHAT_REGION=us

# Auth Key (for client-side login)
NEXT_PUBLIC_COMETCHAT_AUTH_KEY=a9872929281e6788d558b02a78db2dc306e02786

# API Key (for server-side operations - keep this secret!)
COMETCHAT_API_KEY=a9872929281e6788d558b02a78db2dc306e02786
```

### Step 2: Verify Your CometChat Credentials
1. Log in to your [CometChat Dashboard](https://www.cometchat.com/)
2. Go to your app settings
3. Verify the following:
   - **App ID**: Should match `NEXT_PUBLIC_COMETCHAT_APP_ID`
   - **Region**: Check which region your app is hosted in (us/eu/in)
   - **Auth Key**: Used for client-side login
   - **REST API Key**: Used for server-side operations (keep this secret!)

### Step 3: Update Environment Variables
If your CometChat app is in a different region:
- Change `NEXT_PUBLIC_COMETCHAT_REGION` to match your app's region
- Make sure it's one of: `us`, `eu`, or `in`

### Step 4: Restart Development Server
After creating/updating `.env.local`, restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## What Was Fixed
1. ✅ Changed default region from "tz" to "us" in `app/api/cometchat/user/route.ts`
2. ✅ Added fallback values in `lib/cometchat-init.ts`
3. ✅ Added comments explaining valid regions

## Testing
After restarting your server, test CometChat user creation:
1. Navigate to your dashboard
2. Try creating a chat or logging in
3. Check the browser console and server logs for any errors

## Troubleshooting

### Still getting DNS errors?
- Verify your `.env.local` file exists and has the correct region
- Ensure the development server was restarted after creating `.env.local`
- Check that your CometChat app is active in the dashboard

### Wrong credentials error?
- Double-check your App ID, Auth Key, and API Key in the CometChat dashboard
- Ensure you're using the REST API Key (not Widget ID) for `COMETCHAT_API_KEY`

### Network connectivity issues?
- Check your internet connection
- Verify you can access https://api-us.cometchat.io (or your region's URL)
- Check if any firewall/proxy is blocking the connection

