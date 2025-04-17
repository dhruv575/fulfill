# Deployment Guide: Fixing Authentication Issues

This guide addresses the cross-domain cookie authentication issues between the frontend and backend Vercel deployments.

## Backend Deployment

1. Make sure the following environment variables are set in your Vercel deployment:

   ```
   NODE_ENV=production
   FRONTEND_URL=https://fulfill-dashboard.vercel.app
   COOKIE_SECRET=hrowuifhcirebvuwfhlcbeirudhkvoerwvnehroivhenroivheroiv
   ATLAS_URI=mongodb+srv://dhruvgupta:qoE0MrtaVtUmlFyD@fulfillnj.fz1wk.mongodb.net/?retryWrites=true&w=majority&appName=fulfillNJ
   ```

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

1. Updated the cookie settings in `backend/routes/auth.js` to use:
   - `sameSite: 'none'` in production
   - `secure: true` in production
   - Proper domain settings

2. Updated the CORS configuration in `backend/server.js` to:
   - Allow appropriate origins
   - Support all necessary methods and headers
   - Properly handle credentials

3. Added environment configuration to ensure production settings are correctly applied

## Troubleshooting

If issues persist:

1. Check browser developer tools > Network tab to see if cookies are being set
2. Check browser developer tools > Console for any CORS or authentication errors
3. Verify that both frontend and backend have the correct environment variables set in Vercel
4. Try clearing browser cookies and cache before testing again 