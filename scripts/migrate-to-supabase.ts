import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrate() {
  console.log('Starting migration to Supabase...')

  // Read existing prints data
  const printsPath = path.join(process.cwd(), 'data', 'prints.json')
  const printsData = JSON.parse(fs.readFileSync(printsPath, 'utf-8'))

  for (const print of printsData) {
    console.log(`Migrating print: ${print.title}`)

    // Insert print record with new schema
    const { data: printRecord, error: printError } = await supabase
      .from('prints')
      .insert({
        slug: print.id, // Use the old id as slug
        title: print.title,
        r2_key: print.r2Key || '', // Use r2Key from JSON data
      })
      .select()
      .single()

    if (printError) {
      console.error(`Error inserting print ${print.id}:`, printError)
      continue
    }

    // Insert variants with new schema
    let position = 1
    for (const variant of print.variants) {
      const { error: variantError } = await supabase
        .from('print_variants')
        .insert({
          print_id: printRecord.id, // Use the UUID from the inserted print
          code: variant.id,
          label: variant.label,
          stripe_price_id: variant.stripePriceId,
          price_cents: variant.priceCents,
          position: position++
        })

      if (variantError) {
        console.error(`Error inserting variant for ${print.id}:`, variantError)
      }
    }

    console.log(`✓ Migrated print: ${print.title}`)
  }

  console.log('Migration complete!')
  console.log('\nNext steps:')
  console.log('1. Update API routes to use Supabase instead of JSON files')
  console.log('2. Continue using R2 for images (already configured)')
}

migrate().catch(console.error)