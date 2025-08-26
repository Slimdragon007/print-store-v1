import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Apply SEO optimizations with safer approach - only update existing columns
async function applySEOOptimizationsSafely() {
  console.log('🔄 Safely applying SEO optimizations to Supabase database...\n')
  
  // Find the latest SEO report
  const reportFiles = fs.readdirSync('.')
    .filter(file => file.startsWith('seo-optimization-report-'))
    .sort()
    .reverse()
  
  if (reportFiles.length === 0) {
    console.error('❌ No SEO optimization reports found')
    return
  }
  
  const reportFile = reportFiles[0]
  console.log(`📄 Using report: ${reportFile}`)
  
  const reportData = JSON.parse(fs.readFileSync(reportFile, 'utf8'))
  console.log(`📊 Found ${reportData.length} products to update\n`)
  
  // First, let's test with a single product to see what columns are available
  console.log('🧪 Testing column availability...')
  const testProduct = reportData[0]
  
  // Try updating with basic fields first
  try {
    const { error } = await supabase
      .from('prints')
      .update({
        title: testProduct.seo_title
      })
      .eq('id', testProduct.id)
    
    if (error) {
      console.error('❌ Basic update failed:', error.message)
      return
    } else {
      console.log('✅ Basic update works')
    }
  } catch (err) {
    console.error('❌ Connection error:', err)
    return
  }
  
  let successCount = 0
  let errorCount = 0
  
  console.log('\n🔄 Starting bulk updates...')
  
  for (const product of reportData) {
    try {
      console.log(`🔄 Updating: ${product.original_title}`)
      
      // Start with safe fields that should exist
      const updateData: any = {
        title: product.seo_title
      }
      
      // Try to add description if it exists  
      if (product.long_description) {
        updateData.description = product.long_description
      }
      
      const { error } = await supabase
        .from('prints')
        .update(updateData)
        .eq('id', product.id)
      
      if (error) {
        console.error(`  ❌ Error: ${error.message}`)
        errorCount++
        
        // If the error is about a specific column, try without it
        if (error.message.includes('description')) {
          console.log('  🔄 Retrying with title only...')
          const { error: retryError } = await supabase
            .from('prints')
            .update({ title: product.seo_title })
            .eq('id', product.id)
          
          if (retryError) {
            console.error(`  ❌ Retry failed: ${retryError.message}`)
          } else {
            console.log(`  ✅ Title updated successfully`)
            successCount++
          }
        }
      } else {
        console.log(`  ✅ Updated successfully`)
        successCount++
      }
      
    } catch (err) {
      console.error(`  ❌ Unexpected error:`, err)
      errorCount++
    }
  }
  
  console.log('\n📊 SEO OPTIMIZATION APPLICATION COMPLETE')
  console.log('════════════════════════════════════════════════')
  console.log(`✅ Successfully updated: ${successCount} products`)
  console.log(`❌ Failed to update: ${errorCount} products`)
  console.log(`📈 Success rate: ${((successCount / reportData.length) * 100).toFixed(1)}%`)
  
  // Generate a report showing what was accomplished
  const reportPath = `seo-update-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const resultsReport = {
    timestamp: new Date().toISOString(),
    totalProducts: reportData.length,
    successCount,
    errorCount,
    successRate: ((successCount / reportData.length) * 100).toFixed(1) + '%',
    fieldsUpdated: ['title'],
    nextSteps: [
      'Run Supabase migration to add SEO columns',
      'Re-run this script with full SEO data',
      'Generate sitemap with updated titles',
      'Implement frontend SEO meta tags'
    ]
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(resultsReport, null, 2))
  console.log(`📄 Results saved to: ${reportPath}`)
}

applySEOOptimizationsSafely().catch(console.error)