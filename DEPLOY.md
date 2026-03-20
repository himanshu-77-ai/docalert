# DocAlert — Deployment Guide
## Live in 30 minutes on Vercel + Supabase

---

## Step 1: Supabase Setup (Database + Storage)

1. Go to **supabase.com** → New project
2. Copy the **DATABASE_URL** from Settings → Database → URI
3. Create a storage bucket named `docalert-files` (set as Public)
4. Copy **SUPABASE_URL** and **SUPABASE_SERVICE_KEY** from Settings → API

---

## Step 2: SendGrid Setup (Email)

1. Create account at **sendgrid.com**
2. Go to Settings → API Keys → Create API Key (Full access)
3. Verify a sender email address
4. Copy the API key

---

## Step 3: Twilio Setup (WhatsApp + SMS)

1. Create account at **twilio.com**
2. Copy **Account SID** and **Auth Token**
3. For WhatsApp: Join sandbox at console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
4. For production WhatsApp: Apply for WhatsApp Business API approval (takes 1-7 days)

---


## Step 4: Razorpay Setup (Payments — India)

1. Create account at **razorpay.com** (free, instant)
2. Go to Settings → API Keys → Generate Test Keys
3. Copy **Key ID** and **Key Secret**
4. Create 2 subscription plans:
   - Go to Subscriptions → Plans → Create Plan
   - Plan 1: "DocAlert Business" — ₹1,599/month recurring → copy Plan ID
   - Plan 2: "DocAlert Enterprise" — ₹3,999/month recurring → copy Plan ID
5. For Webhooks:
   - Go to Settings → Webhooks → Add New Webhook
   - URL: `https://yourdomain.com/api/razorpay/webhook`
   - Events: `subscription.activated`, `subscription.charged`, `subscription.halted`, `subscription.cancelled`, `payment.captured`, `payment.failed`
   - Copy **Webhook Secret**
6. Add to `.env`: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RAZORPAY_BUSINESS_PLAN_ID, RAZORPAY_ENTERPRISE_PLAN_ID

**Test card:** 4111 1111 1111 1111 · Any future date · Any CVV
**Test UPI:** success@razorpay

## Step 5: Google OAuth (optional)

1. Go to **console.cloud.google.com**
2. New Project → Enable Google+ API
3. Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URI: `https://yourdomain.com/api/auth/callback/google`
5. Copy Client ID and Secret

---

## Step 6: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# In project root
vercel

# Add all environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... (add all from .env.example)

# Deploy to production
vercel --prod
```

Or use Vercel Dashboard:
1. Go to **vercel.com** → New Project → Import from GitHub
2. Add all environment variables in Project Settings → Environment Variables
3. Deploy

---

## Step 7: Database Migration

```bash
# After setting DATABASE_URL
npx prisma db push
npx prisma generate
```

---

## Step 8: Setup Cron Job

Vercel auto-runs the cron job daily at 8AM based on `vercel.json`.
Add `CRON_SECRET` env var to Vercel.

---

## Environment Variables Checklist

| Variable | Required | Where to get |
|----------|----------|-------------|
| DATABASE_URL | ✅ | Supabase |
| NEXTAUTH_SECRET | ✅ | `openssl rand -base64 32` |
| NEXTAUTH_URL | ✅ | Your domain |
| EMAIL_SERVER_* | ✅ | SendGrid |
| EMAIL_FROM | ✅ | Verified sender |
| TWILIO_ACCOUNT_SID | WhatsApp/SMS | Twilio |
| TWILIO_AUTH_TOKEN | WhatsApp/SMS | Twilio |
| STRIPE_SECRET_KEY | Payments | Stripe |
| STRIPE_WEBHOOK_SECRET | Payments | Stripe |
| STRIPE_BUSINESS_PRICE_ID | Payments | Stripe |
| STRIPE_ENTERPRISE_PRICE_ID | Payments | Stripe |
| NEXT_PUBLIC_SUPABASE_URL | Storage | Supabase |
| SUPABASE_SERVICE_KEY | Storage | Supabase |
| ANTHROPIC_API_KEY | AI Scan | anthropic.com |
| CRON_SECRET | Cron | Any random string |
| GOOGLE_CLIENT_ID | OAuth | Google Console |
| GOOGLE_CLIENT_SECRET | OAuth | Google Console |

---

## Mobile App (PWA)

DocAlert is a **Progressive Web App (PWA)**. Users can install it on mobile:

**Android:** Open in Chrome → Menu (⋮) → "Add to Home Screen"
**iPhone:** Open in Safari → Share (⬆) → "Add to Home Screen"

The app will work offline for cached pages and feel like a native app.

---

## Custom Domain

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g. `app.docalert.com`)
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your domain
5. Update Google OAuth redirect URIs if used

---

## Post-Launch Checklist

- [ ] Test registration + email verification
- [ ] Test password reset flow
- [ ] Add first document and verify alert
- [ ] Test WhatsApp alert (if Twilio configured)
- [ ] Test Stripe payment flow (use test card: 4242 4242 4242 4242)
- [ ] Verify cron job runs (check Vercel Functions logs)
- [ ] Set up error monitoring (Sentry recommended)

---

## Sentry Setup — Error Monitoring (Zaroori!)

**Kyun:** Jab koi user ko error aaye, aapko turant email milegi with exact error + line number.

1. **sentry.io** pe free account banao (GitHub se sign up)
2. New Project → Next.js → copy DSN
3. Settings → Auth Tokens → Create token
4. Vercel mein env vars daalo:
   - `NEXT_PUBLIC_SENTRY_DSN` = DSN from step 2
   - `SENTRY_ORG` = your org name
   - `SENTRY_PROJECT` = your project name
   - `SENTRY_AUTH_TOKEN` = token from step 3

**Free plan mein milta hai:** 5,000 errors/month — launch ke liye kaafi hai!

---

## Jab Bug Aaye — Step by Step

1. **Sentry dashboard** pe jao → exact error + stack trace dekho
2. Error message copy karo
3. Claude se poocho: "Ye error aa rahi hai: [paste error] — kaise fix karein?"
4. Fix deploy karo: `git add . && git commit -m "fix: xyz" && git push`
5. Vercel automatically redeploy kar deta hai

## Database Issues

- **Supabase Studio** pe seedha data dekho/edit karo
- `npx prisma studio` se local DB browser open karo
- Logs: Supabase Dashboard → Logs → API/DB logs

## Scaling Guide

| Users | DB | Hosting | Est. Cost |
|-------|-----|---------|-----------|
| 0–100 | Supabase Free | Vercel Free | ₹0 |
| 100–500 | Supabase Pro ($25) | Vercel Free | ~₹2,100 |
| 500–2000 | Supabase Pro | Vercel Pro ($20) | ~₹3,800 |
| 2000+ | Dedicated PG | Vercel Pro | ~₹8,000+ |

Supabase free mein ~1 lakh documents comfortable handle hote hain.
