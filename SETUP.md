# Quick Setup Guide

## Step 1: Get your API keys

### Anthropic API Key
1. Go to https://console.anthropic.com
2. API Keys → Create Key
3. Copy to ANTHROPIC_API_KEY in .env

### Database (Neon - free)
1. Go to https://neon.tech → Sign up
2. Create project → Copy connection string
3. Paste as DATABASE_URL in .env

### GitHub OAuth
1. GitHub → Settings → Developer settings → OAuth Apps → New
2. Homepage URL: http://localhost:3000
3. Callback URL: http://localhost:3000/api/auth/callback/github
4. Copy Client ID and Secret to .env

### Google OAuth
1. console.cloud.google.com → New project
2. APIs & Services → Credentials → OAuth 2.0 Client
3. Authorized redirect URI: http://localhost:3000/api/auth/callback/google
4. Copy Client ID and Secret to .env

### NEXTAUTH_SECRET
Run: openssl rand -base64 32

## Step 2: Setup database
```
npx prisma generate
npx prisma db push
```

## Step 3: Run
```
npm run dev
```

## Deploy to Vercel
1. Push to GitHub
2. vercel.com → Import → Add all env vars
3. For Neon, update DATABASE_URL to use pooled connection
4. Add NEXTAUTH_URL = your vercel URL
