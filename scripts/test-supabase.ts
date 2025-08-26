import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testConnection() {
  console.log('Testing Supabase connection...')
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  // First, try a simple insert to test if table exists
  const testId = 'test-' + Date.now()
  const { data: insertData, error: insertError } = await supabase
    .from('prints')
    .insert({
      id: testId,
      title: 'Test Print',
      image_url: 'https://example.com/test.jpg'
    })
    .select()
  
  if (insertError) {
    console.error('Error inserting into prints table:', insertError)
    
    // Check if it's a schema cache issue
    if (insertError.message?.includes('schema cache')) {
      console.log('\nThis appears to be a schema cache issue.')
      console.log('Please try one of the following:')
      console.log('1. Wait a few seconds for the cache to refresh')
      console.log('2. Go to your Supabase dashboard -> Settings -> API')
      console.log('   and click "Reload schema cache"')
      console.log('3. Make sure the tables were created in the "public" schema')
    }
  } else {
    console.log('Successfully inserted test data:', insertData)
    
    // Clean up test data
    const { error: deleteError } = await supabase
      .from('prints')
      .delete()
      .eq('id', testId)
    
    if (!deleteError) {
      console.log('Test data cleaned up successfully')
    }
  }
  
  // Try to query the table
  const { data, error } = await supabase
    .from('prints')
    .select('*')
    .limit(1)
  
  if (!error) {
    console.log('\nSuccessfully queried prints table!')
    console.log('Current records:', data)
  }
}

testConnection().catch(console.error)