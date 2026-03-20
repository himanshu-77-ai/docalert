# DocAlert — SaaS Document Expiry Tracker

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
# Fill in your values in .env
```

### 3. Setup database (Supabase)
- Create a project at supabase.com
- Copy the database URL to .env
```bash
npm run db:push
npm run db:generate
```

### 4. Run development server
```bash
npm run dev
```

Open http://localhost:3000

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

## Services needed
| Service | Purpose | Free tier |
|---------|---------|-----------|
| Supabase | Database + Storage | Yes |
| Vercel | Hosting + Cron | Yes |
| SendGrid | Email alerts | Yes (100/day) |
| Twilio | WhatsApp + SMS | Paid |
| Stripe | Subscriptions | Free |
| Google OAuth | Social login | Free |

## Features
- Multi-tenant SaaS with workspaces
- Document tracking with expiry alerts
- Email, WhatsApp, SMS notifications
- Team roles: Owner, Admin, Manager, Viewer
- File upload & in-browser viewer
- Daily cron job for automatic alerts
- Stripe subscription billing
