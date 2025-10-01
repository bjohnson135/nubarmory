# CI/CD Setup Guide

This document explains how to configure the CI/CD pipeline for NubArmory.

## Required GitHub Secrets

To enable all features of the CI/CD pipeline, you need to configure the following secrets in your GitHub repository:

### Repository Settings → Secrets and variables → Actions

#### Required Secrets:

1. **`VERCEL_TOKEN`** - Vercel API token for deployments
   - Go to [Vercel Dashboard](https://vercel.com/account/tokens)
   - Create a new token
   - Add it as a repository secret

2. **`VERCEL_ORG_ID`** - Vercel organization ID
   - Found in your Vercel team settings
   - Add it as a repository secret

3. **`VERCEL_PROJECT_ID`** - Vercel project ID
   - Found in your Vercel project settings
   - Add it as a repository secret

#### Optional Secrets (for enhanced security):

4. **`SNYK_TOKEN`** - Snyk security scanning token
   - Create account at [Snyk](https://snyk.io/)
   - Generate API token
   - Add it as a repository secret

5. **`CODECOV_TOKEN`** - Codecov coverage reporting token
   - Create account at [Codecov](https://codecov.io/)
   - Add your repository
   - Copy the token and add as secret

## Environment Variables for Deployment

### Production Environment
Configure these in your Vercel project dashboard:

```env
# Database
DATABASE_URL=your_production_database_url

# Authentication
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=https://your-domain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Admin
ADMIN_EMAIL=your_admin_email@domain.com
ADMIN_PASSWORD=your_secure_admin_password

# Email (if using)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
```

### Staging Environment
Similar to production but with test/staging values:

```env
# Database
DATABASE_URL=your_staging_database_url

# Authentication
NEXTAUTH_SECRET=your_staging_secret
NEXTAUTH_URL=https://your-staging-domain.com

# Stripe (use test keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret
```

## Workflow Overview

### 1. CI Pipeline (`ci.yml`)
- **Triggers**: Push to main/develop, PR to main
- **Jobs**:
  - **Test**: Runs on Node.js 18.x and 20.x
    - Linting with ESLint
    - Type checking with TypeScript
    - Unit/integration tests with Jest
    - Coverage reporting
  - **Build**: Compiles the application
    - Prisma generation
    - Next.js build
    - Artifact upload
  - **Security**: Security audits
    - npm audit
    - Dependency vulnerability check
  - **Deploy**: Conditional deployment
    - Staging (develop branch)
    - Production (main branch)

### 2. Security Pipeline (`security.yml`)
- **Triggers**: Daily schedule, package.json changes
- **Jobs**:
  - Security vulnerability scanning
  - Dependency update monitoring
  - License compliance checking
  - Automated issue creation for outdated packages

### 3. Vercel Deployment (`deploy-vercel.yml`)
- **Triggers**: Push to main, PR to main
- **Features**:
  - Preview deployments for PRs
  - Production deployment for main branch
  - Automatic PR comments with preview URLs
  - Test execution before deployment

### 4. PR Validation (`pr-validation.yml`)
- **Triggers**: PR creation/updates
- **Checks**:
  - Conventional commit messages
  - File size validation
  - Code quality checks
  - Test coverage requirements (70% minimum)
  - Sensitive information detection
  - Build size monitoring

## Setting up Vercel Integration

### 1. Install Vercel CLI locally:
```bash
npm install -g vercel@latest
```

### 2. Link your project:
```bash
vercel link
```

### 3. Get your project configuration:
```bash
vercel env pull .env.local
```

### 4. Add the project ID and org ID to GitHub secrets:
- Find these values in `.vercel/project.json`
- Add `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` as repository secrets

## Branch Protection Rules

Recommended branch protection rules for `main`:

1. **Require PR reviews**: At least 1 approval
2. **Require status checks**: All CI jobs must pass
3. **Require branches to be up to date**: Before merging
4. **Restrict pushes**: Only allow via PR
5. **Include administrators**: Apply rules to admins too

## Monitoring and Notifications

### GitHub Environments
The workflows use GitHub environments for:
- **staging**: For develop branch deployments
- **production**: For main branch deployments

Configure environment protection rules:
- Required reviewers for production
- Deployment restrictions by branch

### Notifications
Consider setting up notifications for:
- Failed deployments
- Security vulnerabilities
- Dependency updates

## Troubleshooting

### Common Issues:

1. **Build fails on Vercel**
   - Check environment variables are set
   - Verify database connection
   - Review build logs in Vercel dashboard

2. **Tests fail in CI**
   - Environment variables missing
   - Database setup issues
   - Node.js version differences

3. **Security scan failures**
   - Update vulnerable dependencies
   - Review npm audit output
   - Check Snyk dashboard for details

### Debug Commands:
```bash
# Test locally with CI environment
CI=true npm test

# Check TypeScript errors
npx tsc --noEmit

# Run security audit
npm audit --audit-level=moderate

# Test Vercel deployment locally
vercel dev
```

## Maintenance

### Regular Tasks:
1. **Weekly**: Review dependency update issues
2. **Monthly**: Update GitHub Actions versions
3. **Quarterly**: Review and update security policies
4. **As needed**: Update environment variables

### Updating Workflows:
When modifying workflows:
1. Test changes in a feature branch
2. Use `workflow_dispatch` for manual testing
3. Monitor first run carefully
4. Update documentation if needed

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use least-privilege access** for tokens
3. **Regularly rotate secrets** (quarterly)
4. **Monitor security advisories** via GitHub
5. **Keep dependencies updated** via automated PRs
6. **Review PR changes carefully** before merging

## Support

For issues with the CI/CD pipeline:
1. Check GitHub Actions logs
2. Review this documentation
3. Check Vercel deployment logs
4. Consult GitHub Actions documentation