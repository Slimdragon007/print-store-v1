#!/usr/bin/env node

/**
 * Stripe Webhook Verification System
 * 
 * This script helps verify and test Stripe webhook integration for the print store.
 * It can test webhook endpoints, validate webhook signatures, and simulate webhook events.
 * 
 * Features:
 * - Tests webhook endpoint connectivity
 * - Validates webhook signature verification
 * - Simulates common webhook events
 * - Monitors webhook event processing
 * - Provides debugging information
 * - Supports both test and production environments
 * 
 * Usage:
 * npx tsx scripts/verify-stripe-webhooks.ts [--endpoint=URL] [--test-events] [--monitor]
 */

import { stripe } from '../lib/stripe'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import crypto from 'crypto'

// Load environment variables
dotenv.config({ path: '.env.local' })

interface WebhookTestOptions {
  endpointUrl?: string
  testEvents: boolean
  monitor: boolean
  verbose: boolean
}

interface WebhookEndpoint {
  id: string
  url: string
  status: string
  enabled_events: string[]
  created: number
}

interface WebhookEventResult {
  event: string
  status: 'success' | 'failed' | 'pending'
  timestamp: number
  response?: {
    status: number
    statusText: string
    body?: string
  }
  error?: string
}

class StripeWebhookVerifier {
  private options: WebhookTestOptions
  private webhookSecret: string
  private baseUrl: string

  constructor(options: WebhookTestOptions) {
    this.options = options
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
    this.baseUrl = options.endpointUrl || this.getDefaultWebhookUrl()

    this.log('🔍 Initializing Stripe Webhook Verifier')
    this.log(`Webhook URL: ${this.baseUrl}`)
    this.log(`Test Events: ${options.testEvents ? 'Yes' : 'No'}`)
    this.log(`Monitor Mode: ${options.monitor ? 'Yes' : 'No'}`)
    this.log(`Verbose: ${options.verbose ? 'Yes' : 'No'}`)
    this.log('─'.repeat(60))
  }

  private log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    const timestamp = new Date().toISOString()
    let prefix = 'ℹ️'
    
    switch (level) {
      case 'error': prefix = '❌'; break
      case 'warn': prefix = '⚠️'; break
      case 'success': prefix = '✅'; break
      default: prefix = 'ℹ️'
    }
    
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  private verbose(message: string) {
    if (this.options.verbose) {
      this.log(`  ${message}`)
    }
  }

  /**
   * Get default webhook URL based on environment
   */
  private getDefaultWebhookUrl(): string {
    const isDev = process.env.NODE_ENV === 'development'
    const baseUrl = isDev ? 'http://localhost:3000' : 'https://your-domain.com'
    return `${baseUrl}/api/stripe/webhook`
  }

  /**
   * Validate environment setup
   */
  private validateEnvironment(): void {
    const required = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ]

    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }

    this.log('✅ Environment variables validated', 'success')
  }

  /**
   * Test Stripe connection
   */
  private async testStripeConnection(): Promise<void> {
    try {
      const account = await stripe.accounts.retrieve()
      this.log(`✅ Stripe connection successful (${account.country})`, 'success')
      this.verbose(`Account ID: ${account.id}`)
      this.verbose(`Business Type: ${account.business_type}`)
    } catch (error) {
      throw new Error(`Stripe connection failed: ${error}`)
    }
  }

  /**
   * List all webhook endpoints
   */
  private async listWebhookEndpoints(): Promise<WebhookEndpoint[]> {
    try {
      const endpoints = await stripe.webhookEndpoints.list({ limit: 10 })
      
      this.log(`📋 Found ${endpoints.data.length} webhook endpoints:`)
      
      const results: WebhookEndpoint[] = []
      
      for (const endpoint of endpoints.data) {
        const webhookData: WebhookEndpoint = {
          id: endpoint.id,
          url: endpoint.url,
          status: endpoint.status,
          enabled_events: endpoint.enabled_events,
          created: endpoint.created
        }
        
        results.push(webhookData)
        
        this.log(`  📍 ${endpoint.url}`)
        this.verbose(`    ID: ${endpoint.id}`)
        this.verbose(`    Status: ${endpoint.status}`)
        this.verbose(`    Events: ${endpoint.enabled_events.length} configured`)
        this.verbose(`    Created: ${new Date(endpoint.created * 1000).toISOString()}`)
      }

      return results
    } catch (error) {
      this.log(`❌ Error listing webhook endpoints: ${error}`, 'error')
      return []
    }
  }

  /**
   * Test webhook endpoint connectivity
   */
  private async testWebhookConnectivity(): Promise<boolean> {
    try {
      this.log(`🌐 Testing webhook endpoint connectivity: ${this.baseUrl}`)
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Stripe-Webhook-Verifier'
        },
        body: JSON.stringify({ test: 'connectivity' })
      })

      this.verbose(`Response status: ${response.status}`)
      this.verbose(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)

      if (response.status === 200 || response.status === 400) {
        this.log('✅ Webhook endpoint is reachable', 'success')
        return true
      } else {
        this.log(`⚠️ Webhook endpoint returned status ${response.status}`, 'warn')
        return false
      }
    } catch (error) {
      this.log(`❌ Webhook endpoint connectivity test failed: ${error}`, 'error')
      return false
    }
  }

  /**
   * Create a test webhook signature
   */
  private createWebhookSignature(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000)
    const signedPayload = `${timestamp}.${payload}`
    const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')
    return `t=${timestamp},v1=${signature}`
  }

  /**
   * Test webhook signature verification
   */
  private async testWebhookSignature(): Promise<boolean> {
    try {
      this.log('🔐 Testing webhook signature verification...')

      const testPayload = JSON.stringify({
        id: 'evt_test_webhook_signature',
        object: 'event',
        api_version: '2025-07-30.basil',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'test_signature_verification'
          }
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null
        },
        type: 'test.signature.verification'
      })

      const signature = this.createWebhookSignature(testPayload, this.webhookSecret)

      this.verbose(`Test payload: ${testPayload}`)
      this.verbose(`Generated signature: ${signature}`)

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': signature,
          'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
        },
        body: testPayload
      })

      const responseText = await response.text()
      this.verbose(`Response: ${response.status} ${response.statusText}`)
      this.verbose(`Response body: ${responseText}`)

      if (response.status === 200) {
        this.log('✅ Webhook signature verification working correctly', 'success')
        return true
      } else {
        this.log(`⚠️ Webhook signature verification returned ${response.status}`, 'warn')
        return false
      }
    } catch (error) {
      this.log(`❌ Webhook signature test failed: ${error}`, 'error')
      return false
    }
  }

  /**
   * Simulate webhook events for testing
   */
  private async simulateWebhookEvents(): Promise<WebhookEventResult[]> {
    const events = [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'invoice.payment_succeeded',
      'customer.subscription.created'
    ]

    this.log('🧪 Simulating webhook events...')
    const results: WebhookEventResult[] = []

    for (const eventType of events) {
      try {
        this.log(`Testing event: ${eventType}`)

        // Create a test event in Stripe
        const event = await stripe.events.create({
          type: eventType as any,
          data: {
            object: this.createMockEventData(eventType)
          }
        })

        // Send the event to our webhook endpoint
        const payload = JSON.stringify(event)
        const signature = this.createWebhookSignature(payload, this.webhookSecret)

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Stripe-Signature': signature,
            'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
          },
          body: payload
        })

        const responseText = await response.text()

        const result: WebhookEventResult = {
          event: eventType,
          status: response.status === 200 ? 'success' : 'failed',
          timestamp: Date.now(),
          response: {
            status: response.status,
            statusText: response.statusText,
            body: responseText
          }
        }

        if (response.status === 200) {
          this.log(`  ✅ ${eventType}: Success`, 'success')
        } else {
          this.log(`  ❌ ${eventType}: Failed (${response.status})`, 'error')
          result.error = `HTTP ${response.status}: ${response.statusText}`
        }

        results.push(result)
        this.verbose(`  Response: ${responseText}`)

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        this.log(`  ❌ ${eventType}: Error - ${error}`, 'error')
        results.push({
          event: eventType,
          status: 'failed',
          timestamp: Date.now(),
          error: error.toString()
        })
      }
    }

    return results
  }

  /**
   * Create mock event data for testing
   */
  private createMockEventData(eventType: string): any {
    const mockData = {
      'checkout.session.completed': {
        id: 'cs_test_webhook',
        object: 'checkout.session',
        amount_total: 3000,
        currency: 'usd',
        customer: 'cus_test_webhook',
        payment_status: 'paid',
        status: 'complete'
      },
      'payment_intent.succeeded': {
        id: 'pi_test_webhook',
        object: 'payment_intent',
        amount: 3000,
        currency: 'usd',
        status: 'succeeded',
        customer: 'cus_test_webhook'
      },
      'payment_intent.payment_failed': {
        id: 'pi_test_webhook_failed',
        object: 'payment_intent',
        amount: 3000,
        currency: 'usd',
        status: 'requires_payment_method',
        last_payment_error: {
          type: 'card_error',
          code: 'card_declined',
          message: 'Your card was declined.'
        }
      },
      'invoice.payment_succeeded': {
        id: 'in_test_webhook',
        object: 'invoice',
        amount_paid: 3000,
        currency: 'usd',
        status: 'paid',
        customer: 'cus_test_webhook'
      },
      'customer.subscription.created': {
        id: 'sub_test_webhook',
        object: 'subscription',
        customer: 'cus_test_webhook',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000
      }
    }

    return mockData[eventType] || { id: 'test_webhook_object', object: 'unknown' }
  }

  /**
   * Monitor webhook events in real-time
   */
  private async monitorWebhooks(): Promise<void> {
    this.log('👀 Starting webhook monitoring mode...')
    this.log('Press Ctrl+C to stop monitoring')

    let lastEventId: string | undefined

    const checkEvents = async () => {
      try {
        const events = await stripe.events.list({
          limit: 10,
          ...(lastEventId && { starting_after: lastEventId })
        })

        for (const event of events.data.reverse()) {
          if (!lastEventId || event.id !== lastEventId) {
            this.log(`📨 Event: ${event.type} (${event.id})`)
            this.verbose(`  Created: ${new Date(event.created * 1000).toISOString()}`)
            this.verbose(`  Livemode: ${event.livemode}`)
            
            if (event.request) {
              this.verbose(`  Request ID: ${event.request.id}`)
            }
          }
        }

        if (events.data.length > 0) {
          lastEventId = events.data[0].id
        }

      } catch (error) {
        this.log(`Error fetching events: ${error}`, 'error')
      }
    }

    // Initial check
    await checkEvents()

    // Set up periodic checking
    const interval = setInterval(checkEvents, 5000)

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.log('👋 Stopping webhook monitoring...')
      clearInterval(interval)
      process.exit(0)
    })

    // Keep the process alive
    return new Promise(() => {})
  }

  /**
   * Print test results summary
   */
  private printTestResults(results: WebhookEventResult[]): void {
    this.log('─'.repeat(60))
    this.log('📊 Webhook Test Results:')
    
    const successful = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'failed').length
    
    this.log(`  Total Tests: ${results.length}`)
    this.log(`  Successful: ${successful}`)
    this.log(`  Failed: ${failed}`)
    this.log(`  Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`)
    
    if (failed > 0) {
      this.log('\n❌ Failed Tests:')
      results.filter(r => r.status === 'failed').forEach(result => {
        this.log(`  - ${result.event}: ${result.error || 'Unknown error'}`)
      })
    }
    
    this.log('─'.repeat(60))
  }

  /**
   * Main verification process
   */
  async run(): Promise<void> {
    try {
      // Validation
      this.validateEnvironment()
      await this.testStripeConnection()

      // List existing webhooks
      await this.listWebhookEndpoints()

      // Test connectivity
      const connectivityOk = await this.testWebhookConnectivity()
      
      // Test signature verification
      const signatureOk = await this.testWebhookSignature()

      // Test events if requested
      let eventResults: WebhookEventResult[] = []
      if (this.options.testEvents) {
        eventResults = await this.simulateWebhookEvents()
        this.printTestResults(eventResults)
      }

      // Monitor mode
      if (this.options.monitor) {
        await this.monitorWebhooks()
      }

      // Final summary
      if (!this.options.monitor) {
        this.log('─'.repeat(60))
        if (connectivityOk && signatureOk) {
          this.log('✅ All webhook tests passed!', 'success')
        } else {
          this.log('⚠️ Some webhook tests failed. Check the logs above.', 'warn')
        }
      }

    } catch (error) {
      this.log(`Fatal error: ${error}`, 'error')
      process.exit(1)
    }
  }
}

// Parse command line arguments
function parseArgs(): WebhookTestOptions {
  const args = process.argv.slice(2)
  
  const endpointArg = args.find(arg => arg.startsWith('--endpoint='))
  const endpointUrl = endpointArg ? endpointArg.split('=')[1] : undefined
  
  return {
    endpointUrl,
    testEvents: args.includes('--test-events'),
    monitor: args.includes('--monitor'),
    verbose: args.includes('--verbose') || args.includes('-v')
  }
}

// Show usage information
function showUsage() {
  console.log(`
Stripe Webhook Verifier

Usage: npx tsx scripts/verify-stripe-webhooks.ts [options]

Options:
  --endpoint=URL     Custom webhook endpoint URL (default: auto-detect)
  --test-events      Run webhook event simulation tests
  --monitor          Monitor webhook events in real-time
  --verbose, -v      Enable verbose logging
  --help, -h         Show this help message

Examples:
  npx tsx scripts/verify-stripe-webhooks.ts --test-events
  npx tsx scripts/verify-stripe-webhooks.ts --endpoint=https://example.com/webhook
  npx tsx scripts/verify-stripe-webhooks.ts --monitor --verbose
`)
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsage()
    return
  }

  const options = parseArgs()
  const verifier = new StripeWebhookVerifier(options)
  await verifier.run()
}

// Only run if this script is executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { StripeWebhookVerifier }