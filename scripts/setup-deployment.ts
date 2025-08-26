#!/usr/bin/env tsx

/**
 * Deployment Setup Script
 * 
 * This script helps set up the deployment environment and verifies
 * that all necessary components are configured correctly.
 * 
 * Usage:
 *   npx tsx scripts/setup-deployment.ts
 *   npx tsx scripts/setup-deployment.ts --verify-only
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface SetupStep {
  name: string;
  description: string;
  check: () => boolean;
  setup?: () => void;
  required: boolean;
}

class DeploymentSetup {
  private verifyOnly: boolean;

  constructor(verifyOnly = false) {
    this.verifyOnly = verifyOnly;
  }

  private async runCommand(command: string, silent = false): Promise<string> {
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        stdio: silent ? 'pipe' : 'inherit' 
      });
    } catch (error) {
      if (!silent) console.error(`Command failed: ${command}`);
      throw error;
    }
  }

  private checkVercelCLI(): boolean {
    try {
      this.runCommand('vercel --version', true);
      return true;
    } catch {
      return false;
    }
  }

  private setupVercelCLI(): void {
    console.log('Installing Vercel CLI...');
    this.runCommand('npm install -g vercel');
  }

  private checkGitRepo(): boolean {
    return existsSync('.git');
  }

  private checkEnvironmentFiles(): boolean {
    return existsSync('.env.production.example');
  }

  private checkVercelConfig(): boolean {
    return existsSync('vercel.json');
  }

  private checkGitHubActions(): boolean {
    return existsSync('.github/workflows/deploy.yml');
  }

  private checkPackageScripts(): boolean {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    return !!(packageJson.scripts?.['deploy:check']);
  }

  private checkNextConfig(): boolean {
    const configExists = existsSync('next.config.ts') || existsSync('next.config.js');
    if (!configExists) return false;

    try {
      const configContent = readFileSync('next.config.ts', 'utf8');
      return configContent.includes('images') && configContent.includes('headers');
    } catch {
      return false;
    }
  }

  private generateGitIgnore(): void {
    const gitignoreContent = `
# Dependencies
node_modules/
npm-debug.log*

# Next.js
.next/
out/

# Environment variables
.env
.env*.local
.env.production

# Vercel
.vercel

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Database
*.db
*.sqlite

# Build outputs
dist/
build/
    `.trim();

    if (!existsSync('.gitignore')) {
      writeFileSync('.gitignore', gitignoreContent);
      console.log('✅ Created .gitignore file');
    }
  }

  private async setupSteps(): Promise<SetupStep[]> {
    return [
      {
        name: 'Git Repository',
        description: 'Ensure project is a Git repository',
        check: () => this.checkGitRepo(),
        setup: () => {
          this.runCommand('git init');
          this.generateGitIgnore();
        },
        required: true
      },
      {
        name: 'Vercel CLI',
        description: 'Install Vercel CLI for deployment',
        check: () => this.checkVercelCLI(),
        setup: () => this.setupVercelCLI(),
        required: true
      },
      {
        name: 'Environment Templates',
        description: 'Environment variable templates exist',
        check: () => this.checkEnvironmentFiles(),
        required: true
      },
      {
        name: 'Vercel Configuration',
        description: 'vercel.json configuration file',
        check: () => this.checkVercelConfig(),
        required: true
      },
      {
        name: 'Next.js Configuration',
        description: 'Optimized Next.js configuration',
        check: () => this.checkNextConfig(),
        required: true
      },
      {
        name: 'GitHub Actions',
        description: 'CI/CD workflow configuration',
        check: () => this.checkGitHubActions(),
        required: false
      },
      {
        name: 'Deployment Scripts',
        description: 'Package.json deployment scripts',
        check: () => this.checkPackageScripts(),
        required: true
      }
    ];
  }

  async run(): Promise<void> {
    console.log('🚀 Print Store Deployment Setup');
    console.log(this.verifyOnly ? 'Verification mode - no changes will be made' : 'Setup mode - will configure deployment');
    console.log('='.repeat(50));

    const steps = await this.setupSteps();
    let allPassed = true;
    let setupCount = 0;

    for (const step of steps) {
      const passed = step.check();
      const icon = passed ? '✅' : (step.required ? '❌' : '⚠️');
      const status = passed ? 'PASS' : (step.required ? 'FAIL' : 'OPTIONAL');
      
      console.log(`${icon} ${step.name}: ${status}`);
      console.log(`   ${step.description}`);

      if (!passed && step.required) {
        allPassed = false;
        
        if (!this.verifyOnly && step.setup) {
          try {
            console.log(`   🔧 Setting up ${step.name}...`);
            step.setup();
            setupCount++;
            console.log(`   ✅ ${step.name} configured successfully`);
          } catch (error) {
            console.log(`   ❌ Failed to setup ${step.name}: ${error}`);
          }
        }
      }
      console.log();
    }

    console.log('='.repeat(50));
    
    if (this.verifyOnly) {
      if (allPassed) {
        console.log('✅ All deployment requirements are met!');
        console.log('\nNext steps:');
        console.log('1. Run: npm run deploy:check');
        console.log('2. Set up Vercel project: vercel');
        console.log('3. Configure environment variables in Vercel dashboard');
        console.log('4. Deploy: npm run deploy:production');
      } else {
        console.log('❌ Some requirements are not met');
        console.log('Run this script without --verify-only to set up missing components');
      }
    } else {
      if (setupCount > 0) {
        console.log(`✅ Setup complete! Configured ${setupCount} components.`);
      }
      
      console.log('\n📋 Manual Steps Required:');
      console.log('1. Set up Supabase project and get API keys');
      console.log('2. Set up Stripe account and get API keys');
      console.log('3. Run: vercel (to initialize Vercel project)');
      console.log('4. Configure environment variables in Vercel dashboard');
      console.log('5. Set up GitHub repository secrets for CI/CD');
      console.log('6. Run: npm run deploy:check (to verify setup)');
      console.log('7. Deploy: npm run deploy:production');

      console.log('\n🔧 Useful Commands:');
      console.log('- npm run deploy:check        # Run deployment checklist');
      console.log('- npm run deploy:preview      # Deploy to preview');
      console.log('- npm run deploy:production   # Deploy to production');
      console.log('- npm run verify:production   # Verify production deployment');
    }

    process.exit(allPassed ? 0 : 1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const verifyOnly = args.includes('--verify-only');
  
  const setup = new DeploymentSetup(verifyOnly);
  await setup.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}