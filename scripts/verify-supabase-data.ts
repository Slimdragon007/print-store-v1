import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Use anon key for read operations
)

async function verify() {
  console.log('Verifying Supabase data...\n')
  
  // Get all prints with their variants
  const { data: prints, error } = await supabase
    .from('prints')
    .select(`
      *,
      print_variants (*)
    `)
    .order('created_at')
  
  if (error) {
    console.error('Error fetching data:', error)
    return
  }
  
  console.log(`Found ${prints?.length || 0} prints in Supabase:\n`)
  
  prints?.forEach(print => {
    console.log(`📸 ${print.title}`)
    console.log(`   Slug: ${print.slug}`)
    console.log(`   R2 Key: ${print.r2_key}`)
    console.log(`   Variants: ${print.print_variants?.length || 0}`)
    print.print_variants?.forEach((v: any) => {
      console.log(`     - ${v.label} ($${v.price_cents / 100})`)
    })
    console.log()
  })
}

verify().catch(console.error)