# Print Store Deployment Guide

This guide covers the complete deployment process for the Print Store application to Vercel, including setup, configuration, and monitoring.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Vercel Configuration](#vercel-configuration)
4. [GitHub Actions Setup](#github-actions-setup)
5. [Database Setup](#database-setup)
6. [External Services](#external-services)
7. [Deployment Process](#deployment-process)
8. [Post-Deployment](#post-deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- [x] Node.js 20.x or later
- [x] npm or yarn package manager
- [x] Git repository with your code
- [x] Vercel account
- [x] Supabase project
- [x] Stripe account (for payments)
- [x] GitHub account (for CI/CD)

## Environment Setup

### 1. Local Environment

Copy the environment template and fill in your values:

```bash
cp .env.production.example .env.local
```

### 2. Required Environment Variables

The application requires these environment variables:

#### Core Application
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_super_secure_secret_min_32_chars
```

#### Database (Supabase)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres
```

#### Payments (Stripe)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

#### Storage & CDN
```bash
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://your-project-ref.supabase.co/storage/v1
SUPABASE_STORAGE_BUCKET=print-images
```

## Vercel Configuration

### 1. Project Setup

1. **Connect Repository:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login to Vercel
   vercel login

   # Initialize project
   vercel
   ```

2. **Configure Project:**
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)
   - Install Command: `npm ci`

### 2. Environment Variables in Vercel

Set environment variables in the Vercel dashboard:

1. Go to your project settings
2. Navigate to Environment Variables
3. Add all variables from `.env.production.example`
4. Set appropriate environment scope:
   - `Production`: Live environment
   - `Preview`: Branch deployments
   - `Development`: Local development

### 3. Domain Configuration

1. **Custom Domain:**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Configure DNS records as instructed

2. **SSL Certificate:**
   - Vercel automatically provides SSL certificates
   - Verify HTTPS is working after domain setup

## GitHub Actions Setup

### 1. Repository Secrets

Add these secrets to your GitHub repository:

```bash
# Vercel Integration
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Environment Variables for CI
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Optional: Notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url
SMTP_SERVER=your_smtp_server
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
```

### 2. Workflow Configuration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

- Runs pre-flight checks and builds
- Performs security scanning
- Deploys to preview on PRs
- Deploys to production on main branch
- Sends notifications on deployment

## Database Setup

### 1. Supabase Configuration

1. **Create Project:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create new project
   - Note down project URL and API keys

2. **Run Migrations:**
   ```bash
   # Apply database migrations
   npm run db:migrate
   ```

3. **Set Up Row Level Security (RLS):**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE prints ENABLE ROW LEVEL SECURITY;
   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;

   -- Create policies (examples)
   CREATE POLICY "Public prints are viewable by everyone" 
     ON prints FOR SELECT 
     USING (published = true);

   CREATE POLICY "Users can view their own orders" 
     ON orders FOR SELECT 
     USING (auth.uid() = user_id);
   ```

4. **Configure Storage:**
   ```bash
   # Create storage bucket for images
   # This should be done through Supabase dashboard or API
   ```

### 2. Data Migration

If migrating from existing data:

```bash
# Run migration script
npm run migrate:supabase

# Verify data integrity
npm run verify:data
```

## External Services

### 1. Stripe Configuration

1. **Webhook Endpoints:**
   Configure these webhooks in your Stripe dashboard:
   ```
   https://your-domain.com/api/stripe/webhook
   ```

2. **Event Types:**
   Subscribe to these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `invoice.payment_succeeded`

3. **Test Webhooks:**
   ```bash
   npm run stripe:verify-webhooks
   ```

### 2. Email Service (Optional)

Configure email service for notifications:

```bash
# Using Resend
RESEND_API_KEY=re_your_api_key

# Or using SMTP
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASS=your_password
```

## Deployment Process

### 1. Pre-Deployment Checklist

Run the automated checklist:

```bash
# Run complete pre-deployment checks
npx tsx scripts/pre-deploy-checklist.ts

# Run with auto-fix for common issues
npx tsx scripts/pre-deploy-checklist.ts --fix-issues
```

### 2. Manual Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 3. Automated Deployment

Deployments happen automatically via GitHub Actions:

- **Preview:** On pull requests
- **Production:** On push to main branch
- **Manual:** Via GitHub Actions workflow dispatch

### 4. Deployment Verification

After deployment, verify:

1. **Application loads correctly**
2. **Database connections work**
3. **Payment flow functions**
4. **Images load properly**
5. **API endpoints respond**

```bash
# Run verification script
npm run verify:production
```

## Post-Deployment

### 1. Domain Configuration

1. **DNS Setup:**
   ```
   Type: CNAME
   Name: www (or @)
   Value: cname.vercel-dns.com
   ```

2. **Redirect Setup:**
   Configure redirects in `vercel.json` or Next.js config

### 2. Performance Optimization

1. **Enable Analytics:**
   - Vercel Analytics
   - Google Analytics
   - Core Web Vitals monitoring

2. **CDN Configuration:**
   - Verify image optimization
   - Check cache headers
   - Monitor load times

### 3. Security Configuration

1. **Security Headers:**
   Already configured in `next.config.ts` and `vercel.json`

2. **Content Security Policy:**
   ```bash
   # Add to environment variables if needed
   CSP_HEADER="default-src 'self'; script-src 'self' 'unsafe-inline'"
   ```

## Monitoring & Maintenance

### 1. Monitoring Setup

1. **Error Tracking:**
   ```bash
   # Optional: Add Sentry for error tracking
   npm install @sentry/nextjs
   ```

2. **Performance Monitoring:**
   - Vercel Analytics (built-in)
   - Google PageSpeed Insights
   - Core Web Vitals

3. **Uptime Monitoring:**
   - Vercel provides basic uptime monitoring
   - Consider additional services for comprehensive monitoring

### 2. Maintenance Tasks

1. **Regular Updates:**
   ```bash
   # Update dependencies
   npm update

   # Security updates
   npm audit fix
   ```

2. **Database Maintenance:**
   ```bash
   # Backup database
   npm run db:backup

   # Optimize queries
   npm run db:analyze
   ```

3. **Performance Reviews:**
   - Monthly performance audits
   - Bundle size optimization
   - Image optimization review

## Troubleshooting

### Common Issues

1. **Build Failures:**
   ```bash
   # Clear Next.js cache
   rm -rf .next

   # Clear npm cache
   npm cache clean --force

   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Environment Variable Issues:**
   ```bash
   # Verify environment variables
   vercel env ls

   # Pull environment variables locally
   vercel env pull .env.local
   ```

3. **Database Connection Issues:**
   ```bash
   # Test database connection
   npx tsx scripts/test-supabase.ts

   # Check connection string format
   ```

4. **Image Loading Issues:**
   ```bash
   # Verify image domains in next.config.ts
   # Check Supabase storage policies
   # Verify image URLs are accessible
   ```

5. **Payment Issues:**
   ```bash
   # Test Stripe webhooks
   npm run stripe:test-webhooks

   # Verify webhook URL in Stripe dashboard
   # Check webhook secret matches
   ```

### Debug Commands

```bash
# View deployment logs
vercel logs

# Check build output
npm run build 2>&1 | tee build.log

# Test API endpoints
curl -f https://your-domain.com/api/health

# Verify environment setup
npm run verify:environment
```

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

## Scripts Reference

The project includes several deployment and maintenance scripts:

```bash
# Deployment
npm run build                    # Build for production
npx tsx scripts/pre-deploy-checklist.ts  # Run deployment checks

# Database
npm run db:setup                 # Initialize database
npm run db:migrate              # Run migrations
npm run db:seed                 # Seed database

# Stripe
npm run stripe:setup            # Setup Stripe products
npm run stripe:verify-webhooks  # Verify webhook configuration

# Verification
npm run verify:production       # Verify production deployment
npm run verify:environment      # Verify environment setup
```

## Security Considerations

1. **Environment Variables:**
   - Never commit production secrets
   - Use different keys for different environments
   - Rotate keys regularly

2. **Database Security:**
   - Enable Row Level Security (RLS)
   - Use service role key only on server-side
   - Regular security audits

3. **API Security:**
   - Rate limiting implemented
   - Input validation on all endpoints
   - CORS properly configured

4. **Content Security:**
   - CSP headers configured
   - XSS protection enabled
   - Safe image handling

---

For questions or issues with deployment, please check the troubleshooting section or create an issue in the repository.