#!/usr/bin/env node

/**
 * Comprehensive Stripe Product Setup System
 * 
 * This script creates Stripe products and prices for all prints in the Supabase database
 * and updates the print_variants table with Stripe price IDs.
 * 
 * Features:
 * - Connects to both Stripe and Supabase
 * - Creates products for each print in the database
 * - Creates price objects for all size variants
 * - Updates Supabase with Stripe price IDs
 * - Handles test vs production environments
 * - Provides dry-run mode for safety
 * - Comprehensive error handling and logging
 * 
 * Usage:
 * npx tsx scripts/setup-stripe-products.ts [--dry-run] [--env=test|prod]
 */

import { stripe } from '../lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/supabase/types'
import dotenv from 'dotenv'
import { randomUUID } from 'crypto'

// Load environment variables
dotenv.config({ path: '.env.local' })

// TypeScript interfaces
interface PrintVariant {
  size: string
  label: string
  priceCents: number
}

interface PrintData {
  id: string
  title: string
  image_url: string
  variants?: PrintVariant[]
}

interface StripeProductResult {
  productId: string
  variants: Array<{
    size: string
    label: string
    stripePriceId: string
    priceCents: number
  }>
}

interface SetupOptions {
  dryRun: boolean
  environment: 'test' | 'prod'
  verbose: boolean
}

// Configuration
const PRINT_SIZES: PrintVariant[] = [
  { size: '8x10', label: '8 x 10 in', priceCents: 3000 },
  { size: '11x14', label: '11 x 14 in', priceCents: 5500 },
  { size: '16x20', label: '16 x 20 in', priceCents: 9000 },
  { size: '24x36', label: '24 x 36 in', priceCents: 15000 }
]

class StripeProductSetup {
  private supabase: ReturnType<typeof createClient<Database>>
  private options: SetupOptions
  private stats = {
    processed: 0,
    created: 0,
    updated: 0,
    errors: 0,
    skipped: 0
  }

  constructor(options: SetupOptions) {
    this.options = options
    
    // Initialize Supabase client
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    this.log('🚀 Initializing Stripe Product Setup')
    this.log(`Environment: ${options.environment}`)
    this.log(`Dry Run: ${options.dryRun ? 'Yes' : 'No'}`)
    this.log(`Verbose: ${options.verbose ? 'Yes' : 'No'}`)
    this.log('─'.repeat(50))
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️'
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  private verbose(message: string) {
    if (this.options.verbose) {
      this.log(`  ${message}`)
    }
  }

  /**
   * Validate environment variables
   */
  private validateEnvironment(): void {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY'
    ]

    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }

    this.log('✅ Environment variables validated')
  }

  /**
   * Test connections to Stripe and Supabase
   */
  private async testConnections(): Promise<void> {
    try {
      // Test Stripe connection
      const account = await stripe.accounts.retrieve()
      this.log(`✅ Stripe connection successful (${account.country})`)

      // Test Supabase connection
      const { data, error } = await this.supabase
        .from('prints')
        .select('id')
        .limit(1)
      
      if (error) throw error
      this.log('✅ Supabase connection successful')

    } catch (error) {
      throw new Error(`Connection test failed: ${error}`)
    }
  }

  /**
   * Fetch all prints from Supabase
   */
  private async fetchPrints(): Promise<PrintData[]> {
    this.log('📖 Fetching prints from Supabase...')
    
    const { data, error } = await this.supabase
      .from('prints')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch prints: ${error.message}`)
    }

    this.log(`Found ${data.length} prints in database`)
    return data as PrintData[]
  }

  /**
   * Check if Stripe product already exists for a print
   */
  private async findExistingProduct(printId: string): Promise<string | null> {
    try {
      const products = await stripe.products.search({
        query: `metadata['print_id']:'${printId}'`,
        limit: 1
      })

      return products.data.length > 0 ? products.data[0].id : null
    } catch (error) {
      this.verbose(`Error searching for existing product: ${error}`)
      return null
    }
  }

  /**
   * Create or update Stripe product for a print
   */
  private async createStripeProduct(print: PrintData): Promise<StripeProductResult> {
    const existingProductId = await this.findExistingProduct(print.id)
    
    let productId: string
    
    if (existingProductId) {
      productId = existingProductId
      this.verbose(`Using existing product: ${productId}`)
      this.stats.updated++
    } else {
      if (this.options.dryRun) {
        productId = `prod_dry_run_${Date.now()}`
        this.verbose(`[DRY RUN] Would create product: ${print.title}`)
      } else {
        const product = await stripe.products.create({
          name: print.title,
          description: `High-quality print: ${print.title}`,
          images: print.image_url ? [print.image_url] : undefined,
          metadata: {
            print_id: print.id,
            created_by: 'setup-script',
            environment: this.options.environment
          }
        })
        productId = product.id
        this.verbose(`Created product: ${print.title} (${productId})`)
        this.stats.created++
      }
    }

    // Create prices for each size variant
    const variants = []
    
    for (const variant of PRINT_SIZES) {
      let priceId: string

      if (this.options.dryRun) {
        priceId = `price_dry_run_${Date.now()}_${variant.size}`
        this.verbose(`[DRY RUN] Would create price: ${variant.label} - $${variant.priceCents / 100}`)
      } else {
        // Check if price already exists
        const existingPrices = await stripe.prices.search({
          query: `product:'${productId}' AND metadata['size']:'${variant.size}'`,
          limit: 1
        })

        if (existingPrices.data.length > 0) {
          priceId = existingPrices.data[0].id
          this.verbose(`Using existing price: ${variant.label} (${priceId})`)
        } else {
          const price = await stripe.prices.create({
            product: productId,
            unit_amount: variant.priceCents,
            currency: 'usd',
            metadata: {
              size: variant.size,
              label: variant.label,
              print_id: print.id,
              environment: this.options.environment
            }
          })
          priceId = price.id
          this.verbose(`Created price: ${variant.label} - $${variant.priceCents / 100} (${priceId})`)
        }
      }

      variants.push({
        size: variant.size,
        label: variant.label,
        stripePriceId: priceId,
        priceCents: variant.priceCents
      })
    }

    return { productId, variants }
  }

  /**
   * Update Supabase with Stripe price IDs
   */
  private async updateSupabasePriceIds(printId: string, variants: any[]): Promise<void> {
    if (this.options.dryRun) {
      this.verbose(`[DRY RUN] Would update ${variants.length} variants in Supabase`)
      return
    }

    // First, check what exists
    const { data: existingVariants } = await this.supabase
      .from('print_variants')
      .select('*')
      .eq('print_id', printId)

    for (const variant of variants) {
      const existing = existingVariants?.find(v => v.label === variant.label)
      
      if (existing) {
        // Update existing variant
        const { error } = await this.supabase
          .from('print_variants')
          .update({
            stripe_price_id: variant.stripePriceId,
            price_cents: variant.priceCents
          })
          .eq('id', existing.id)

        if (error) {
          throw new Error(`Failed to update variant ${variant.label}: ${error.message}`)
        }
        this.verbose(`Updated variant: ${variant.label}`)
      } else {
        // Insert new variant
        const { error } = await this.supabase
          .from('print_variants')
          .insert({
            id: randomUUID(),
            print_id: printId,
            label: variant.label,
            stripe_price_id: variant.stripePriceId,
            price_cents: variant.priceCents
          })

        if (error) {
          throw new Error(`Failed to insert variant ${variant.label}: ${error.message}`)
        }
        this.verbose(`Created variant: ${variant.label}`)
      }
    }
  }

  /**
   * Process a single print
   */
  private async processprint(print: PrintData): Promise<void> {
    this.stats.processed++
    this.log(`Processing: ${print.title} (${this.stats.processed})`)

    try {
      // Create Stripe product and prices
      const result = await this.createStripeProduct(print)
      
      // Update Supabase with price IDs
      await this.updateSupabasePriceIds(print.id, result.variants)
      
      this.log(`✅ Completed: ${print.title}`)
    } catch (error) {
      this.stats.errors++
      this.log(`❌ Failed to process ${print.title}: ${error}`, 'error')
    }
  }

  /**
   * Clean up orphaned Stripe products (products not in Supabase)
   */
  private async cleanupOrphanedProducts(): Promise<void> {
    if (this.options.dryRun) {
      this.log('[DRY RUN] Would check for orphaned products')
      return
    }

    this.log('🧹 Checking for orphaned Stripe products...')
    
    try {
      // Get all prints from Supabase
      const prints = await this.fetchPrints()
      const printIds = new Set(prints.map(p => p.id))

      // Get all Stripe products with print_id metadata
      const products = await stripe.products.search({
        query: 'metadata["print_id"]:*',
        limit: 100
      })

      let orphanedCount = 0
      for (const product of products.data) {
        const printId = product.metadata?.print_id
        if (printId && !printIds.has(printId)) {
          this.log(`Found orphaned product: ${product.name} (${product.id})`, 'warn')
          // Uncomment to actually delete orphaned products
          // await stripe.products.update(product.id, { active: false })
          orphanedCount++
        }
      }

      this.log(`Found ${orphanedCount} orphaned products`)
    } catch (error) {
      this.log(`Warning: Could not check for orphaned products: ${error}`, 'warn')
    }
  }

  /**
   * Print final statistics
   */
  private printStats(): void {
    this.log('─'.repeat(50))
    this.log('📊 Setup Summary:')
    this.log(`  Processed: ${this.stats.processed}`)
    this.log(`  Created: ${this.stats.created}`)
    this.log(`  Updated: ${this.stats.updated}`)
    this.log(`  Errors: ${this.stats.errors}`)
    this.log(`  Skipped: ${this.stats.skipped}`)
    this.log('─'.repeat(50))
    
    if (this.stats.errors > 0) {
      this.log('⚠️  Some errors occurred during setup. Check the logs above.', 'warn')
    } else if (this.options.dryRun) {
      this.log('✨ Dry run completed successfully! Run without --dry-run to apply changes.')
    } else {
      this.log('✨ Setup completed successfully!')
    }
  }

  /**
   * Main setup process
   */
  async run(): Promise<void> {
    try {
      // Validation
      this.validateEnvironment()
      await this.testConnections()

      // Fetch prints
      const prints = await this.fetchPrints()
      
      if (prints.length === 0) {
        this.log('No prints found in database', 'warn')
        return
      }

      // Process each print
      this.log(`🏗️  Processing ${prints.length} prints...`)
      
      for (const print of prints) {
        await this.processprint(print)
        
        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Cleanup
      await this.cleanupOrphanedProducts()

      // Stats
      this.printStats()

    } catch (error) {
      this.log(`Fatal error: ${error}`, 'error')
      process.exit(1)
    }
  }
}

// Parse command line arguments
function parseArgs(): SetupOptions {
  const args = process.argv.slice(2)
  
  return {
    dryRun: args.includes('--dry-run'),
    environment: args.includes('--env=prod') ? 'prod' : 'test',
    verbose: args.includes('--verbose') || args.includes('-v')
  }
}

// Main execution
async function main() {
  const options = parseArgs()
  const setup = new StripeProductSetup(options)
  await setup.run()
}

// Only run if this script is executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { StripeProductSetup }