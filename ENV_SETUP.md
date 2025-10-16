# Environment Variables Setup for Signademy

This guide explains how to set up and use environment variables for the Signademy project to protect sensitive Supabase credentials.

## Option 1: Using the Simple Server (Recommended for Development)

The project includes a simple Node.js server that handles environment variables securely.

### Prerequisites

- Node.js installed on your system (download from [nodejs.org](https://nodejs.org/))

### Setup Steps

1. **Clone or download the project repository**

2. **Install dependencies (optional, not needed for the basic server)**
   ```
   npm install
   ```

3. **Configure your environment variables**
   - Edit the `.env` file in the root directory with your credentials:
   ```
   # Supabase credentials - DO NOT commit this file to git
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_key_here
   STORAGE_BUCKET=your_storage_bucket_name
   ```

4. **Start the server**
   ```
   node server.js
   ```

5. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## Option 2: Using Environment Variables in Production

For production environments, you should set environment variables at the hosting level.

### Netlify

1. Go to your Netlify site dashboard
2. Navigate to Site settings > Build & deploy > Environment
3. Add the following environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `STORAGE_BUCKET`

### Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the same environment variables as listed above

### GitHub Pages

GitHub Pages doesn't support environment variables directly. You'll need to use a build step to inject the variables:

1. Create a `.github/workflows/deploy.yml` file to set up GitHub Actions
2. Use secrets in the GitHub repository settings
3. During the build, have the workflow replace placeholders with actual values

## Security Considerations

- **Never commit your `.env` file to Git** (it's already added to `.gitignore`)
- The client-side environment loader only exposes selected variables that are needed in the browser
- For additional security, consider using Supabase Row Level Security policies

## Troubleshooting

If you encounter issues loading environment variables:

1. Make sure the `.env` file is properly formatted (no spaces around equals sign)
2. Check browser console for any errors related to loading the env-loader.js
3. When using the server, ensure you're accessing the site through the server URL, not as a file://

## Additional Resources

- [Supabase Security Best Practices](https://supabase.io/docs/guides/auth#security)
- [Managing Environment Variables in JavaScript](https://www.twilio.com/blog/environment-variables-node-js)