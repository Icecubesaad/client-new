# cPanel Deployment Guide

This guide explains how to deploy your Next.js application to cPanel using Git deployment.

## Prerequisites

1. cPanel hosting account with Git deployment support
2. Node.js installed locally for building the application
3. Git repository connected to your cPanel

## Deployment Steps

### 1. Prepare for Deployment

Run the deployment preparation script:

```bash
npm run deploy:prepare
```

This will:
- Clean any previous builds
- Build the Next.js application for static export
- Generate the `out` directory with static files

### 2. Configure cPanel Path

Edit `.cpanel.yml` and update the `DEPLOYPATH` variable:

```yaml
- export DEPLOYPATH=/home/yourusername/public_html/
```

Replace `yourusername` with your actual cPanel username.

### 3. Set Production Environment Variables

Before building, make sure to set your production environment variables:

- `NEXT_PUBLIC_BACKEND_URL`: Your production backend URL

You can set these in your local environment or create a `.env.production` file (not tracked in Git).

### 4. Commit and Push

```bash
git add .
git commit -m "Prepare for cPanel deployment"
git push origin main
```

### 5. Deploy via cPanel

1. Log into your cPanel
2. Go to "Git Version Control"
3. Find your repository and click "Manage"
4. Click "Pull or Deploy" to deploy the latest changes

## File Structure After Deployment

```
public_html/
├── _next/           # Next.js static assets
├── index.html       # Main application entry point
├── .htaccess        # Apache configuration for routing
└── [other pages]    # Additional static pages
```

## Troubleshooting

### Common Issues

1. **404 errors on page refresh**: Make sure `.htaccess` is properly copied to your web root
2. **Assets not loading**: Check that the `_next` directory is properly deployed
3. **API calls failing**: Verify your `NEXT_PUBLIC_BACKEND_URL` environment variable

### Environment Variables

For production deployment, you may need to set:
- `NEXT_PUBLIC_BACKEND_URL`: Your production API endpoint

### Build Issues

If the build fails:
1. Check that all dependencies are installed: `npm install`
2. Ensure your code doesn't use server-side only features
3. Verify all dynamic routes are properly configured for static export

## Notes

- This deployment creates a static export of your Next.js app
- Server-side features like API routes won't work with this setup
- The app will work as a Single Page Application (SPA)
- Make sure your backend API supports CORS for your domain
