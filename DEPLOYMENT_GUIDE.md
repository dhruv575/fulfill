# Deployment Guide: Fixing Authentication Issues

This guide addresses the cross-domain cookie authentication issues between the frontend and backend Vercel deployments.

## Backend Deployment

1. Make sure the following environment variables are set in your Vercel deployment:

   ```
   NODE_ENV=production
   FRONTEND_URL=https://fulfill-theta.vercel.app
   COOKIE_SECRET=hrowuifhcirebvuwfhlcbeirudhkvoerwvnehroivhenroivheroiv
   ATLAS_URI=mongodb+srv://dhruvgupta:qoE0MrtaVtUmlFyD@fulfillnj.fz1wk.mongodb.net/?retryWrites=true&w=majority&appName=fulfillNJ
   ```

   **IMPORTANT**: Make sure there is NO trailing slash in the FRONTEND_URL.

2. Redeploy the backend to Vercel:
   ```
   cd backend
   vercel --prod
   ```

## Frontend Deployment

1. Make sure the environment variable is set in your Vercel deployment:
   ```
   REACT_APP_API_URL=https://fulfill-backend.vercel.app/api
   ```

2. Redeploy the frontend to Vercel:
   ```
   vercel --prod
   ```

## Testing the Fix

1. Open the frontend application in an incognito/private browser window
2. Log in with the password "MonmouthAndOcean"
3. Navigate to the Data Dashboard page to verify that data is loaded properly
4. Check the browser console for any remaining errors

## What Changed

The following changes were made to fix the authentication issues:

1. Updated the cookie settings in `backend/routes/auth.js`:
   - Removed the `domain` property which was causing issues
   - Kept `sameSite: 'none'` and `secure: true` for production

2. Enhanced the CORS configuration in `backend/server.js`:
   - Added more allowed origins including the actual frontend URL
   - Added a function-based origin handler with debugging
   - Added logic to handle trailing slashes in URLs

3. Added debugging to the auth middleware to help diagnose issues

4. Fixed the trailing slash in the FRONTEND_URL environment variable

## Troubleshooting

If issues persist:

1. Check that third-party cookies are allowed in your browser
   - Some browsers block third-party cookies by default
   - For Chrome, check Settings > Privacy and Security > Cookies and Site Data
   - For Safari, check Preferences > Privacy > Website tracking

2. Verify the backend logs for authentication debugging info
   - Look for "Auth middleware called" messages
   - Check if cookies are being received properly

3. Try using a different browser to rule out browser-specific issues

4. Ensure your frontend is making requests to the correct backend URL

5. If all else fails, implement a token-based authentication system using localStorage instead of cookies 