#!/usr/bin/env tsx

/**
 * Pre-Deployment Checklist Script
 * 
 * This script performs comprehensive checks before deploying to production.
 * Run this script to verify your application is ready for deployment.
 * 
 * Usage:
 *   npx tsx scripts/pre-deploy-checklist.ts
 *   npx tsx scripts/pre-deploy-checklist.ts --fix-issues
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'skip';
  message: string;
  fix?: string;
}

class PreDeploymentChecker {
  private results: CheckResult[] = [];
  private fixIssues: boolean;

  constructor(fixIssues = false) {
    this.fixIssues = fixIssues;
  }

  private async runCommand(command: string, silent = false): Promise<string> {
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        stdio: silent ? 'pipe' : 'inherit' 
      });
    } catch (error) {
      throw new Error(`Command failed: ${command}`);
    }
  }

  private addResult(result: CheckResult) {
    this.results.push(result);
    const icon = {
      pass: '✅',
      fail: '❌',
      warning: '⚠️',
      skip: '⏭️'
    }[result.status];
    
    console.log(`${icon} ${result.name}: ${result.message}`);
    if (result.fix && result.status === 'fail') {
      console.log(`   💡 Fix: ${result.fix}`);
    }
  }

  private async checkEnvironmentVariables() {
    console.log('\n🔍 Checking Environment Variables...');
    
    // Check for .env.production.example
    const envExampleExists = existsSync('.env.production.example');
    this.addResult({
      name: 'Environment Template',
      status: envExampleExists ? 'pass' : 'fail',
      message: envExampleExists ? 
        'Production environment template exists' : 
        'Missing .env.production.example',
      fix: 'Create .env.production.example with all required variables'
    });

    // Check required environment variables for build
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      const exists = process.env[envVar] || process.env[`VERCEL_${envVar}`];
      this.addResult({
        name: `Environment Variable: ${envVar}`,
        status: exists ? 'pass' : 'warning',
        message: exists ? 
          `${envVar} is set` : 
          `${envVar} not found (will be set in Vercel)`,
        fix: `Set ${envVar} in Vercel dashboard`
      });
    }
  }

  private async checkBuildConfiguration() {
    console.log('\n🔍 Checking Build Configuration...');

    // Check Next.js config
    const nextConfigExists = existsSync('next.config.ts') || existsSync('next.config.js');
    this.addResult({
      name: 'Next.js Configuration',
      status: nextConfigExists ? 'pass' : 'fail',
      message: nextConfigExists ? 
        'Next.js config file exists' : 
        'Missing Next.js configuration',
      fix: 'Create next.config.ts with proper configuration'
    });

    // Check Vercel config
    const vercelConfigExists = existsSync('vercel.json');
    this.addResult({
      name: 'Vercel Configuration',
      status: vercelConfigExists ? 'pass' : 'fail',
      message: vercelConfigExists ? 
        'vercel.json exists' : 
        'Missing vercel.json',
      fix: 'Create vercel.json with deployment configuration'
    });

    // Check package.json build script
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const hasBuildScript = packageJson.scripts?.build;
    this.addResult({
      name: 'Build Script',
      status: hasBuildScript ? 'pass' : 'fail',
      message: hasBuildScript ? 
        'Build script exists in package.json' : 
        'Missing build script',
      fix: 'Add "build": "next build" to package.json scripts'
    });
  }

  private async checkDependencies() {
    console.log('\n🔍 Checking Dependencies...');

    try {
      // Check for security vulnerabilities
      const auditOutput = await this.runCommand('npm audit --audit-level=high', true);
      const hasVulnerabilities = auditOutput.includes('vulnerabilities found');
      
      this.addResult({
        name: 'Security Audit',
        status: hasVulnerabilities ? 'warning' : 'pass',
        message: hasVulnerabilities ? 
          'High/critical vulnerabilities found' : 
          'No high/critical vulnerabilities',
        fix: 'Run: npm audit fix'
      });

      if (hasVulnerabilities && this.fixIssues) {
        console.log('🔧 Attempting to fix vulnerabilities...');
        await this.runCommand('npm audit fix');
      }
    } catch (error) {
      this.addResult({
        name: 'Security Audit',
        status: 'warning',
        message: 'Could not run security audit',
        fix: 'Manually run: npm audit'
      });
    }

    // Check for outdated dependencies
    try {
      const outdatedOutput = await this.runCommand('npm outdated', true);
      const hasOutdated = outdatedOutput.trim().length > 0;
      
      this.addResult({
        name: 'Dependency Updates',
        status: hasOutdated ? 'warning' : 'pass',
        message: hasOutdated ? 
          'Some dependencies are outdated' : 
          'Dependencies are up to date',
        fix: 'Review and update dependencies with: npm update'
      });
    } catch (error) {
      // npm outdated exits with code 1 when outdated packages exist
      this.addResult({
        name: 'Dependency Updates',
        status: 'warning',
        message: 'Some dependencies may be outdated',
        fix: 'Check with: npm outdated'
      });
    }
  }

  private async checkCodeQuality() {
    console.log('\n🔍 Checking Code Quality...');

    // Check TypeScript compilation
    try {
      await this.runCommand('npx tsc --noEmit', true);
      this.addResult({
        name: 'TypeScript Compilation',
        status: 'pass',
        message: 'TypeScript compiles without errors'
      });
    } catch (error) {
      this.addResult({
        name: 'TypeScript Compilation',
        status: 'fail',
        message: 'TypeScript compilation errors',
        fix: 'Fix TypeScript errors: npx tsc --noEmit'
      });
    }

    // Check for common issues in API routes
    const apiDir = join(process.cwd(), 'app', 'api');
    if (existsSync(apiDir)) {
      let apiIssues = 0;
      
      // Check for missing error handling
      const checkApiFile = (filePath: string) => {
        const content = readFileSync(filePath, 'utf8');
        if (!content.includes('try') && !content.includes('catch')) {
          apiIssues++;
        }
      };

      // Simple check for API files
      const apiFiles = ['checkout/route.ts', 'stripe/webhook/route.ts'];
      apiFiles.forEach(file => {
        const fullPath = join(apiDir, file);
        if (existsSync(fullPath)) {
          checkApiFile(fullPath);
        }
      });

      this.addResult({
        name: 'API Error Handling',
        status: apiIssues === 0 ? 'pass' : 'warning',
        message: apiIssues === 0 ? 
          'API routes have error handling' : 
          `${apiIssues} API routes may lack proper error handling`,
        fix: 'Add try-catch blocks to API routes'
      });
    }
  }

  private async checkBuildProcess() {
    console.log('\n🔍 Testing Build Process...');

    try {
      console.log('Building application...');
      await this.runCommand('npm run build');
      
      this.addResult({
        name: 'Production Build',
        status: 'pass',
        message: 'Application builds successfully'
      });

      // Check build output
      const buildDir = '.next';
      if (existsSync(buildDir)) {
        const stat = statSync(buildDir);
        this.addResult({
          name: 'Build Output',
          status: 'pass',
          message: `Build directory created (${stat.size} bytes)`
        });
      }

    } catch (error) {
      this.addResult({
        name: 'Production Build',
        status: 'fail',
        message: 'Build failed',
        fix: 'Fix build errors and try again'
      });
    }
  }

  private async checkDatabaseConnection() {
    console.log('\n🔍 Checking Database Connection...');

    // Check if Supabase connection test exists
    const testFile = 'scripts/test-supabase.ts';
    if (existsSync(testFile)) {
      try {
        await this.runCommand(`npx tsx ${testFile}`, true);
        this.addResult({
          name: 'Database Connection',
          status: 'pass',
          message: 'Database connection test passed'
        });
      } catch (error) {
        this.addResult({
          name: 'Database Connection',
          status: 'fail',
          message: 'Database connection test failed',
          fix: 'Check database credentials and network connectivity'
        });
      }
    } else {
      this.addResult({
        name: 'Database Connection',
        status: 'skip',
        message: 'No database connection test found'
      });
    }
  }

  private async checkPaymentIntegration() {
    console.log('\n🔍 Checking Payment Integration...');

    // Check if Stripe verification exists
    const stripeTestFile = 'scripts/verify-stripe-webhooks.ts';
    if (existsSync(stripeTestFile)) {
      try {
        await this.runCommand(`npx tsx ${stripeTestFile}`, true);
        this.addResult({
          name: 'Stripe Integration',
          status: 'pass',
          message: 'Stripe webhook verification passed'
        });
      } catch (error) {
        this.addResult({
          name: 'Stripe Integration',
          status: 'warning',
          message: 'Stripe webhook verification issues',
          fix: 'Check Stripe configuration and webhook endpoints'
        });
      }
    } else {
      this.addResult({
        name: 'Stripe Integration',
        status: 'skip',
        message: 'No Stripe verification test found'
      });
    }
  }

  private async checkSEOAndPerformance() {
    console.log('\n🔍 Checking SEO and Performance...');

    // Check for robots.txt
    const robotsExists = existsSync('public/robots.txt');
    this.addResult({
      name: 'Robots.txt',
      status: robotsExists ? 'pass' : 'warning',
      message: robotsExists ? 
        'robots.txt exists' : 
        'Missing robots.txt',
      fix: 'Create robots.txt in public/ directory'
    });

    // Check for sitemap
    const sitemapExists = existsSync('public/sitemap.xml');
    this.addResult({
      name: 'Sitemap',
      status: sitemapExists ? 'pass' : 'warning',
      message: sitemapExists ? 
        'sitemap.xml exists' : 
        'Missing sitemap.xml',
      fix: 'Generate sitemap.xml or create API route for dynamic sitemap'
    });

    // Check for favicon
    const faviconExists = existsSync('app/favicon.ico') || existsSync('public/favicon.ico');
    this.addResult({
      name: 'Favicon',
      status: faviconExists ? 'pass' : 'warning',
      message: faviconExists ? 
        'Favicon exists' : 
        'Missing favicon',
      fix: 'Add favicon.ico to app/ or public/ directory'
    });
  }

  private generateReport() {
    console.log('\n📊 Deployment Readiness Report');
    console.log('='.repeat(50));

    const summary = this.results.reduce((acc, result) => {
      acc[result.status]++;
      return acc;
    }, { pass: 0, fail: 0, warning: 0, skip: 0 });

    console.log(`✅ Passed: ${summary.pass}`);
    console.log(`❌ Failed: ${summary.fail}`);
    console.log(`⚠️  Warnings: ${summary.warning}`);
    console.log(`⏭️  Skipped: ${summary.skip}`);

    const readinessScore = Math.round(
      ((summary.pass + summary.warning * 0.5) / this.results.length) * 100
    );

    console.log(`\n🎯 Deployment Readiness: ${readinessScore}%`);

    if (summary.fail > 0) {
      console.log('\n❌ DEPLOYMENT NOT RECOMMENDED');
      console.log('Please fix all failed checks before deploying to production.');
      return false;
    } else if (summary.warning > 0) {
      console.log('\n⚠️  DEPLOYMENT WITH CAUTION');
      console.log('Some warnings detected. Review before deploying.');
      return true;
    } else {
      console.log('\n✅ READY FOR DEPLOYMENT');
      console.log('All checks passed! Your application is ready for production.');
      return true;
    }
  }

  async runAllChecks() {
    console.log('🚀 Pre-Deployment Checklist');
    console.log('Checking deployment readiness...\n');

    await this.checkEnvironmentVariables();
    await this.checkBuildConfiguration();
    await this.checkDependencies();
    await this.checkCodeQuality();
    await this.checkDatabaseConnection();
    await this.checkPaymentIntegration();
    await this.checkSEOAndPerformance();
    await this.checkBuildProcess();

    return this.generateReport();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const fixIssues = args.includes('--fix-issues');
  
  if (fixIssues) {
    console.log('🔧 Auto-fix mode enabled\n');
  }

  const checker = new PreDeploymentChecker(fixIssues);
  const isReady = await checker.runAllChecks();

  process.exit(isReady ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Checklist failed:', error);
    process.exit(1);
  });
}