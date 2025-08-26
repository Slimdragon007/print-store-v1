import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runSEOMigration() {
  console.log('🔄 Running SEO fields migration...\n')
  
  try {
    // Read the SEO migration SQL file
    const migrationSQL = fs.readFileSync('supabase/migrations/add_seo_fields.sql', 'utf8')
    
    console.log('📄 Executing SEO migration SQL...')
    
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration error:', error)
      
      // Try to run individual statements
      console.log('\n🔄 Trying individual migration statements...')
      const statements = migrationSQL
        .split(';')
        .filter(statement => statement.trim() && !statement.trim().startsWith('--'))
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim()
        if (statement) {
          console.log(`Executing statement ${i + 1}/${statements.length}`)
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement })
          
          if (stmtError) {
            console.error(`❌ Statement ${i + 1} failed:`, stmtError.message)
          } else {
            console.log(`✅ Statement ${i + 1} succeeded`)
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully')
    }
    
    // Verify the columns were added by checking table schema
    console.log('\n🔍 Verifying table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'prints')
      .eq('table_schema', 'public')
    
    if (tableError) {
      console.error('❌ Error checking table structure:', tableError)
    } else {
      const columns = tableInfo?.map(col => col.column_name) || []
      console.log('📋 Current prints table columns:', columns)
      
      const seoColumns = ['meta_description', 'long_description', 'keywords', 'location', 'category', 'agent_context']
      const missingColumns = seoColumns.filter(col => !columns.includes(col))
      
      if (missingColumns.length === 0) {
        console.log('✅ All SEO columns are present')
      } else {
        console.log('❌ Missing SEO columns:', missingColumns)
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

runSEOMigration().catch(console.error)