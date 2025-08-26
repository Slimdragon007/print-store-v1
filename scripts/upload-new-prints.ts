import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configuration - modify these for your photos
const PHOTOS_DIRECTORY = '/Users/michaelhaslim/Library/Mobile Documents/com~apple~CloudDocs/Etsy_Listing_Photos_BACKUP_2025-08-13/Etsy_Listing_Photos_BACKUP_2025-08-13'
const DEFAULT_VARIANTS = [
  { code: '8x10', label: '8 x 10 in', price_cents: 3000, stripe_price_id: '' },
  { code: '16x20', label: '16 x 20 in', price_cents: 9000, stripe_price_id: '' }
]

function generateSlug(filename: string): string {
  // Remove extension and clean up filename to create slug
  return filename
    .replace(/\.[^/.]+$/, '') // Remove extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
}

async function uploadNewPrint(filePath: string, title: string) {
  console.log(`\nProcessing: ${title}`)
  
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)
    const slug = generateSlug(fileName)
    
    // Step 1: Upload image to Supabase Storage
    const storagePath = `${slug}.jpg`
    console.log(`  Uploading image to: ${storagePath}`)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('prints')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (uploadError) {
      console.error(`  Error uploading image: ${uploadError.message}`)
      return
    }
    
    // Step 2: Create print record in database
    console.log(`  Creating database record...`)
    const { data: printRecord, error: printError } = await supabase
      .from('prints')
      .insert({
        slug: slug,
        title: title,
        r2_key: storagePath // Now points to Supabase Storage
      })
      .select()
      .single()
    
    if (printError) {
      console.error(`  Error creating print record: ${printError.message}`)
      return
    }
    
    // Step 3: Add variants
    console.log(`  Adding variants...`)
    const variants = DEFAULT_VARIANTS.map((v, index) => ({
      print_id: printRecord.id,
      code: v.code,
      label: v.label,
      price_cents: v.price_cents,
      stripe_price_id: v.stripe_price_id || null,
      position: index + 1
    }))
    
    const { error: variantsError } = await supabase
      .from('print_variants')
      .insert(variants)
    
    if (variantsError) {
      console.error(`  Error adding variants: ${variantsError.message}`)
      return
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('prints')
      .getPublicUrl(storagePath)
    
    console.log(`  ✅ Successfully added!`)
    console.log(`  Public URL: ${publicUrl}`)
    
  } catch (err) {
    console.error(`  Error processing ${title}:`, err)
  }
}

async function uploadAllPhotos() {
  console.log('Starting bulk upload of new prints...')
  
  // Check if directory exists
  if (!fs.existsSync(PHOTOS_DIRECTORY)) {
    console.error(`Directory not found: ${PHOTOS_DIRECTORY}`)
    console.log('\nPlease update PHOTOS_DIRECTORY in this script to point to your photos folder')
    return
  }
  
  // Get all image files
  const files = fs.readdirSync(PHOTOS_DIRECTORY)
    .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
  
  console.log(`Found ${files.length} image files to process`)
  
  for (const file of files) {
    const filePath = path.join(PHOTOS_DIRECTORY, file)
    // Generate title from filename (you can customize this)
    const title = file
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
      .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize words
    
    await uploadNewPrint(filePath, title)
  }
  
  console.log('\n✨ Upload complete!')
  console.log('Next steps:')
  console.log('1. Review your prints at: https://app.supabase.com/project/[your-project]/storage/buckets/prints')
  console.log('2. Update Stripe price IDs for the new variants')
  console.log('3. Test your website to ensure all images display correctly')
}

// Example: Upload a single photo
async function uploadSinglePhoto(filePath: string, title: string) {
  await uploadNewPrint(filePath, title)
}

// Uncomment one of these to run:

// Option 1: Upload all photos from a directory
// uploadAllPhotos().catch(console.error)

// Option 2: Upload a single photo
// uploadSinglePhoto('./path/to/photo.jpg', 'My Photo Title').catch(console.error)

console.log(`
📸 Photo Upload Script
======================

This script helps you upload new prints to Supabase.

To use it:
1. Edit the script and set PHOTOS_DIRECTORY to your photos folder
2. Uncomment the uploadAllPhotos() line at the bottom
3. Run: npx tsx scripts/upload-new-prints.ts

Or for a single photo:
1. Uncomment the uploadSinglePhoto() line
2. Set the path and title
3. Run the script
`)