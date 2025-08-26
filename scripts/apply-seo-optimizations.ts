import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Apply SEO optimizations from the report to the database
async function applySEOOptimizations() {
  console.log('🔄 Applying SEO optimizations to Supabase database...\n')
  
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
  
  let successCount = 0
  let errorCount = 0
  
  for (const product of reportData) {
    try {
      console.log(`🔄 Updating: ${product.title}`)
      
      // Update the product with SEO data
      const { error } = await supabase
        .from('prints')
        .update({
          title: product.seo_title,
          meta_description: product.meta_description,
          long_description: product.long_description,
          keywords: product.keywords,
          location: product.location,
          category: product.category,
          style: product.style,
          colors: product.colors,
          mood: product.mood,
          room_suggestions: product.room_suggestions,
          artist_notes: product.artist_notes,
          print_details: product.print_details,
          care_instructions: product.care_instructions,
          seo_data: product.schema_data,
          agent_context: product.agent_context,
          voice_search_terms: product.voice_search_terms
        })
        .eq('id', product.id)
      
      if (error) {
        console.error(`  ❌ Error updating ${product.title}:`, error.message)
        errorCount++
      } else {
        console.log(`  ✅ Updated successfully`)
        successCount++
      }
      
    } catch (err) {
      console.error(`  ❌ Unexpected error updating ${product.title}:`, err)
      errorCount++
    }
  }
  
  console.log('\n📊 SEO OPTIMIZATION APPLICATION COMPLETE')
  console.log('════════════════════════════════════════════════')
  console.log(`✅ Successfully updated: ${successCount} products`)
  console.log(`❌ Failed to update: ${errorCount} products`)
  console.log(`📈 Success rate: ${((successCount / reportData.length) * 100).toFixed(1)}%`)
  
  if (errorCount === 0) {
    console.log('\n🎉 All SEO optimizations applied successfully!')
  } else {
    console.log('\n⚠️  Some products failed to update. Check the error messages above.')
  }
}

applySEOOptimizations().catch(console.error)