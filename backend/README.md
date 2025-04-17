# Backend for Fulfill NJ Data Dashboard

This is the backend API for the Fulfill NJ Data Dashboard, built with Node.js, Express, and MongoDB.

## Deployment to Vercel

### Prerequisites

- A Vercel account
- The Vercel CLI installed (`npm i -g vercel`)

### Environment Variables

The following environment variables need to be set in the Vercel dashboard:

- `ATLAS_URI`: MongoDB connection string
- `COOKIE_SECRET`: Secret for cookie-parser
- `FRONTEND_URL`: URL of the deployed frontend (e.g., https://fulfill-dashboard.vercel.app)

### Deployment Steps

1. Login to Vercel CLI:
   ```
   vercel login
   ```

2. Deploy from the backend directory:
   ```
   cd backend
   vercel
   ```

3. For production deployment:
   ```
   vercel --prod
   ```

### Configuration

The backend is configured for Vercel deployment using the `vercel.json` file, which sets up the build configuration and routing.

## Development

To run the backend locally:

```
npm install
npm run dev
```

The server will run on port 5000 by default, or the port specified in the .env file. 