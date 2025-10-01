# NubArmory Production Deployment Guide

## Prerequisites

Before deploying to production, ensure you have:

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Database** - PostgreSQL database (recommended: Neon, Supabase, or PlanetScale)
3. **Stripe Account** - For payment processing
4. **Email Service** - SMTP credentials for order confirmations
5. **Shippo Account** - For shipping calculations (optional)

## Step 1: Database Setup

### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech) and create a new project
2. Copy the connection string (looks like: `postgresql://username:password@hostname/database`)

### Option B: Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > Database and copy the connection string

### Option C: PlanetScale
1. Create a database at [planetscale.com](https://planetscale.com)
2. Create a production branch and get the connection string

## Step 2: Environment Variables Setup

Copy the `.env.example` file and configure all required variables:

### Required Variables:

**Database:**
```
DATABASE_URL="postgresql://username:password@hostname:port/database"
```

**Authentication:**
```
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
NEXTAUTH_SECRET="your-nextauth-secret-at-least-32-characters"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

**Stripe (Production Keys):**
```
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"
```

**Email Configuration:**
```
EMAIL_USER="your-email@domain.com"
EMAIL_PASSWORD="your-app-specific-password"
```

**Shipping (Optional):**
```
SHIPPO_API_TOKEN="your_shippo_api_token"
ORIGIN_ADDRESS_NAME="NubArmory"
ORIGIN_ADDRESS_STREET1="1120 Samantha Drive"
ORIGIN_ADDRESS_CITY="Paso Robles"
ORIGIN_ADDRESS_STATE="CA"
ORIGIN_ADDRESS_ZIP="93446"
```

## Step 3: Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Connect Repository:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: `.next`

3. **Add Environment Variables:**
   - In project settings, go to "Environment Variables"
   - Add all variables from your `.env.example` file
   - Set environment to "Production"

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Step 4: Database Migration

After deployment, run database migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy
npx prisma generate

# Or connect to your deployed app
# The database will be automatically set up on first API call
```

## Step 5: Stripe Webhook Configuration

1. **Create Webhook Endpoint:**
   - Go to Stripe Dashboard > Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

2. **Configure Webhook Secret:**
   - Copy the webhook signing secret
   - Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 6: Email Configuration

### Gmail Setup:
1. Enable 2-factor authentication
2. Generate an App Password:
   - Google Account > Security > App passwords
   - Generate password for "Mail"
3. Use your Gmail address as `EMAIL_USER`
4. Use the app password as `EMAIL_PASSWORD`

### Other SMTP Providers:
- **SendGrid**: Use API key as password
- **Mailgun**: Use SMTP credentials
- **Amazon SES**: Use SMTP credentials

## Step 7: File Upload Configuration

Ensure your Vercel deployment can handle file uploads:

1. **File Size Limits:**
   - Vercel has a 4.5MB limit for serverless functions
   - Consider using external storage (AWS S3, Cloudinary) for larger files

2. **Static Files:**
   - Place 3D models in `/public/models/`
   - They'll be served from CDN automatically

## Step 8: Custom Domain (Optional)

1. **Add Domain:**
   - Go to Project Settings > Domains
   - Add your custom domain

2. **Configure DNS:**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel nameservers

## Step 9: Post-Deployment Testing

### Test Checklist:
- [ ] Homepage loads correctly
- [ ] Product pages display 3D models
- [ ] Shopping cart functionality
- [ ] Checkout process with test payments
- [ ] Admin login and product management
- [ ] Email notifications
- [ ] Stripe webhooks receiving events

### Test Payments:
Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`

## Step 10: Go Live

1. **Switch to Live Mode:**
   - Update Stripe keys to live keys
   - Update `NEXTAUTH_URL` to your production domain
   - Redeploy

2. **Create Admin User:**
   - Use the admin registration endpoint or directly in database
   - Set up initial products

3. **Monitor:**
   - Check Vercel Functions tab for errors
   - Monitor Stripe dashboard for payments
   - Set up uptime monitoring

## Troubleshooting

### Common Issues:

**Build Failures:**
- Check environment variables are set
- Ensure all dependencies are in `package.json`
- Check TypeScript errors

**Database Connection:**
- Verify DATABASE_URL format
- Check database allows connections from Vercel IPs
- Run `npx prisma migrate deploy`

**Stripe Issues:**
- Verify webhook endpoint is accessible
- Check webhook signing secret
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

**Email Issues:**
- Test SMTP credentials
- Check spam folders
- Verify app-specific passwords

## Security Checklist

- [ ] All environment variables set to production values
- [ ] No sensitive data in code
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Stripe webhook signatures verified
- [ ] JWT secrets are strong and unique
- [ ] Database access restricted
- [ ] Admin routes protected

## Performance Optimization

- [ ] Enable Vercel Edge Functions for static content
- [ ] Use Next.js Image optimization
- [ ] Implement caching strategies
- [ ] Monitor Core Web Vitals
- [ ] Optimize 3D model file sizes

## Monitoring & Analytics

Consider adding:
- **Error Tracking**: Sentry, LogRocket
- **Analytics**: Google Analytics, Vercel Analytics
- **Uptime Monitoring**: Vercel Monitoring, UptimeRobot
- **Performance**: Vercel Speed Insights

---

## Support

If you encounter issues during deployment:
1. Check Vercel Function logs
2. Review this guide for missed steps
3. Test locally with production environment variables
4. Contact support with specific error messages