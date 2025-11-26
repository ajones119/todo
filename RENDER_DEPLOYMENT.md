# Render.com Deployment Guide

This guide covers deploying both the API server and web app to Render.com.

## Prerequisites

- Render.com account
- Supabase project set up
- GitHub repository connected to Render

---

## 1. Deploy API Server (Backend)

### Service Type
**Web Service**

### Build & Deploy Settings

**Root Directory:** (leave empty - deploy from repo root)

**Environment:** `Node`

**Build Command:**
```bash
cd apps/server && pnpm install && pnpm build
```

**Start Command:**
```bash
cd apps/server && pnpm start
```

**Node Version:** `20.x` (or latest LTS)

### Environment Variables

Add these in Render Dashboard → Environment:

```
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
CLIENT_URL=https://your-web-app.onrender.com
PORT=10000
HOST=0.0.0.0
DEV_MODE=False
```

**Note:** 
- `PORT` is automatically set by Render, but you can override it
- `CLIENT_URL` should be your web app's Render URL (update after deploying web app)
- Set `DEV_MODE=True` only if you want developer endpoints enabled

### Health Check Path
```
/ping
```

### Auto-Deploy
- Enable "Auto-Deploy" if you want automatic deployments on git push
- Branch: `main` (or your production branch)

---

## 2. Deploy Web App (Frontend)

### Service Type
**Static Site**

### Build & Deploy Settings

**Root Directory:** `apps/web`

**Build Command:**
```bash
pnpm install && pnpm build
```

**Publish Directory:**
```
dist
```

### Environment Variables

Add these in Render Dashboard → Environment:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_KEY=your-anon-key
VITE_API_URL=https://your-api-service.onrender.com
VITE_CLIENT_URL=https://your-web-app.onrender.com
VITE_DEV_MODE=False
```

**Important:**
- `VITE_API_URL` should be your API server's Render URL
- `VITE_CLIENT_URL` should match this web app's URL
- Set `VITE_DEV_MODE=True` only if you want developer tools visible

### Custom Domain (Optional)
- Add your custom domain in Render Dashboard
- Update `VITE_CLIENT_URL` and server's `CLIENT_URL` to match

---

## 3. Deployment Order

1. **Deploy API Server first**
   - Get the API URL (e.g., `https://pinegate-api.onrender.com`)
   
2. **Deploy Web App second**
   - Use the API URL in `VITE_API_URL`
   - Get the web app URL (e.g., `https://pinegate-village.onrender.com`)
   
3. **Update API Server**
   - Update `CLIENT_URL` in API server to match web app URL
   - Redeploy API server (or it will auto-update if auto-deploy is enabled)

---

## 4. Post-Deployment Checklist

- [ ] API server responds to `/ping`
- [ ] Web app loads and shows login page
- [ ] CORS is working (check browser console)
- [ ] Authentication works (login/signup)
- [ ] API calls from web app succeed
- [ ] PWA icons are visible (if added)
- [ ] Developer tools are hidden (if `DEV_MODE=False`)

---

## 5. Troubleshooting

### API Server Issues

**Port binding error:**
- Render sets `PORT` automatically, ensure your code uses `process.env.PORT`

**CORS errors:**
- Verify `CLIENT_URL` matches your web app URL exactly (no trailing slash)
- Check browser console for exact CORS error

**Build fails:**
- Ensure `pnpm` is available (Render should detect it from `packageManager` field)
- Check build logs for TypeScript errors

### Web App Issues

**API calls failing:**
- Verify `VITE_API_URL` is correct
- Check that API server is running
- Ensure CORS is configured on API server

**Environment variables not working:**
- Vite requires `VITE_` prefix for client-side variables
- Rebuild after changing environment variables
- Check browser console for undefined values

**Build fails:**
- Check for TypeScript errors
- Ensure all dependencies are in `package.json`
- Verify `pnpm` workspace setup

---

## 6. Monorepo Considerations

Since this is a pnpm monorepo:

1. **Root `package.json`** has workspace configuration
2. **Render needs to install from root** to get workspace dependencies
3. **Build commands** should `cd` into the specific app directory
4. **Workspace dependencies** (`@todo/types`) will be resolved automatically

---

## 7. Alternative: Using render.yaml

You can also use a `render.yaml` file in your repo root:

```yaml
services:
  - type: web
    name: pinegate-api
    env: node
    buildCommand: cd apps/server && pnpm install && pnpm build
    startCommand: cd apps/server && pnpm start
    envVars:
      - key: SUPABASE_PROJECT_ID
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: CLIENT_URL
        sync: false
      - key: DEV_MODE
        value: False

  - type: web
    name: pinegate-web
    env: static
    buildCommand: cd apps/web && pnpm install && pnpm build
    staticPublishPath: apps/web/dist
    envVars:
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_KEY
        sync: false
      - key: VITE_API_URL
        sync: false
      - key: VITE_CLIENT_URL
        sync: false
      - key: VITE_DEV_MODE
        value: False
```

Then set the actual values in Render Dashboard.

---

## 8. Cost Optimization

- **Free tier:** Both services can run on free tier (spins down after inactivity)
- **Upgrade:** For always-on services, upgrade to paid tier
- **Database:** Supabase free tier should be sufficient for development

---

## Quick Reference

### API Server URLs
- Health: `https://your-api.onrender.com/ping`
- Dev endpoints: `https://your-api.onrender.com/dev/weekly-workflow` (if DEV_MODE=True)

### Web App
- Main: `https://your-web-app.onrender.com`
- Login: `https://your-web-app.onrender.com/login`

