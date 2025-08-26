import { createClient } from '@supabase/supabase-js'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

async function downloadFromR2(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  })
  
  const response = await r2Client.send(command)
  const chunks: Uint8Array[] = []
  
  for await (const chunk of response.Body as any) {
    chunks.push(chunk)
  }
  
  return Buffer.concat(chunks)
}

async function migrateImages() {
  console.log('Starting image migration from R2 to Supabase Storage...\n')
  
  // Get all prints from Supabase
  const { data: prints, error } = await supabase
    .from('prints')
    .select('*')
  
  if (error || !prints) {
    console.error('Error fetching prints:', error)
    return
  }
  
  for (const print of prints) {
    console.log(`Processing: ${print.title}`)
    console.log(`  R2 Key: ${print.r2_key}`)
    
    try {
      // Step 1: Download from R2
      console.log('  Downloading from R2...')
      const imageBuffer = await downloadFromR2(print.r2_key)
      
      // Step 2: Upload to Supabase Storage
      const fileName = `${print.slug}.jpg`
      const filePath = `prints/${fileName}`
      
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
          r2_key: filePath // Update to store Supabase Storage path instead
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
  console.log('3. Once confirmed working, you can cancel your R2 subscription')
}

migrateImages().catch(console.error)