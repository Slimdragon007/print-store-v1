import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function migrateImages() {
  console.log('Starting image migration to Supabase Storage...\n')
  
  // Get all prints from Supabase
  const { data: prints, error } = await supabase
    .from('prints')
    .select('*')
  
  if (error || !prints) {
    console.error('Error fetching prints:', error)
    return
  }
  
  // Use local development server URL
  const baseUrl = 'http://localhost:3000'
  
  for (const print of prints) {
    console.log(`Processing: ${print.title}`)
    
    try {
      // Step 1: Download from existing API endpoint
      const imageUrl = `${baseUrl}/api/images/${encodeURIComponent(print.r2_key)}`
      console.log(`  Downloading from: ${imageUrl}`)
      const imageBuffer = await downloadImage(imageUrl)
      console.log(`  Downloaded ${imageBuffer.length} bytes`)
      
      // Step 2: Upload to Supabase Storage
      const fileName = `${print.slug}.jpg`
      const filePath = `${fileName}` // Store directly in prints bucket
      
      console.log(`  Uploading to Supabase Storage as: ${filePath}`)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prints')
        .upload(filePath, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        })
      
      if (uploadError) {
        console.error(`  Error uploading: ${uploadError.message}`)
        continue
      }
      
      // Step 3: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('prints')
        .getPublicUrl(filePath)
      
      // Step 4: Update database record with new storage path
      const { error: updateError } = await supabase
        .from('prints')
        .update({ 
          r2_key: filePath // Now stores Supabase Storage path
        })
        .eq('id', print.id)
      
      if (updateError) {
        console.error(`  Error updating database: ${updateError.message}`)
      } else {
        console.log(`  ✅ Successfully migrated!`)
        console.log(`  Public URL: ${publicUrl}\n`)
      }
      
    } catch (err) {
      console.error(`  Error processing ${print.title}:`, err)
    }
  }
  
  console.log('Migration complete!')
  console.log('\nNext steps:')
  console.log('1. Update your API routes to serve images from Supabase Storage')
  console.log('2. Test that all images load correctly')
  console.log('3. Once confirmed working, you can remove R2 configuration')
}

// Check if running in Node environment
if (typeof window === 'undefined') {
  migrateImages().catch(console.error)
} else {
  console.error('This script must be run in Node.js environment')
}