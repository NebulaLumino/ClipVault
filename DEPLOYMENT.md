# ClipVault Deployment Guide

## Prerequisites

1. **Vercel CLI Authentication**
   ```bash
   vercel login
   # Visit the provided URL to authenticate
   ```

2. **API Keys Required**
   - `LEETIFY_API_KEY` - Get from https://leetify.com/app/developer
   - `FACEIT_API_KEY` - Get from https://developers.faceit.com/

## Quick Deployment

### Option 1: Use the deployment script (recommended)
```bash
./build-and-deploy.sh
```

### Option 2: Manual deployment

1. **Add environment variables to Vercel:**
   ```bash
   vercel env add LEETIFY_API_KEY
   vercel env add FACEIT_API_KEY
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   npm run build:web
   vercel --prod
   ```

3. **Deploy to VPS:**
   ```bash
   ssh ubuntu@your-vps-ip
   cd /home/ubuntu/github/ClipVault
   git pull origin main
   npm ci
   npm run db:generate
   npm run build
   sudo systemctl restart clipvault-bot
   ```

## Environment Variables Needed

### Vercel (Frontend)
- `LEETIFY_API_KEY`
- `FACEIT_API_KEY`
- All existing variables (DATABASE_URL, etc.)

### VPS (Backend)
Add to `/home/ubuntu/github/ClipVault/.env`:
```
LEETIFY_API_KEY=your_leetify_key_here
FACEIT_API_KEY=your_faceit_key_here
```

## Verification

1. **Check Vercel deployment:** https://clipvault.vercel.app
2. **Check VPS bot logs:**
   ```bash
   sudo journalctl -u clipvault-bot -f
   ```
3. **Test CS2 match detection:**
   - Link a Steam account in Discord
   - Check logs for "CS2 poller results" with Leetify data
   - Verify FACEIT auto-linking in logs

## Troubleshooting

- **Build errors:** Check TypeScript compilation with `npm run build`
- **API errors:** Verify API keys are set correctly
- **Bot not starting:** Check service status with `sudo systemctl status clipvault-bot`