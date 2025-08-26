import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate XML Sitemap
async function generateSitemap() {
  console.log('🗺️ Generating XML sitemap...\n')
  
  try {
    const { data: products, error } = await supabase
      .from('prints')
      .select('slug, updated_at, created_at')
    
    if (error) {
      console.error('❌ Error fetching products:', error)
      return
    }
    
    if (!products || products.length === 0) {
      console.error('❌ No products found in database')
      return
    }
    
    console.log(`📊 Found ${products.length} products for sitemap`)
    
    // You'll need to update this with your actual domain
    const baseUrl = 'https://yourstore.com'
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
  
  <!-- Products Index Page -->
  <url>
    <loc>${baseUrl}/prints</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
  
  <!-- Individual Product Pages -->
${products?.map(product => `  <url>
    <loc>${baseUrl}/prints/${product.slug}</loc>
    <lastmod>${new Date(product.updated_at || product.created_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${baseUrl}/api/images/${product.slug}/main.jpg</image:loc>
      <image:title>Fine Art Print - ${product.slug.replace(/-/g, ' ')}</image:title>
    </image:image>
  </url>`).join('\n')}
  
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/cart</loc>
    <changefreq>never</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/success</loc>
    <changefreq>never</changefreq>
    <priority>0.1</priority>
  </url>
</urlset>`
    
    // Write sitemap to public directory
    fs.writeFileSync('public/sitemap.xml', sitemap)
    console.log('✅ Sitemap generated: public/sitemap.xml')
    
    // Generate robots.txt as well
    const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Block admin and API routes
Disallow: /api/
Disallow: /dashboard/
Disallow: /sign-in/
Disallow: /sign-up/
Disallow: /cart
Disallow: /success

# Allow all image and print routes
Allow: /prints/
Allow: /api/images/`
    
    fs.writeFileSync('public/robots.txt', robotsTxt)
    console.log('✅ Robots.txt generated: public/robots.txt')
    
    // Generate a sitemap index if needed (for large sites)
    console.log('\n📊 SITEMAP GENERATION COMPLETE')
    console.log('═══════════════════════════════════════')
    console.log(`🗺️ Total URLs: ${products.length + 4}`)
    console.log(`📦 Product pages: ${products.length}`)
    console.log(`📄 Static pages: 4`)
    console.log(`📁 Files created:`)
    console.log(`   - public/sitemap.xml`)
    console.log(`   - public/robots.txt`)
    console.log(`\n🚀 Next Steps:`)
    console.log(`1. Update the baseUrl in the script with your actual domain`)
    console.log(`2. Submit sitemap to Google Search Console`)
    console.log(`3. Test sitemap: ${baseUrl}/sitemap.xml`)
    console.log(`4. Implement structured data on product pages`)
    
  } catch (err) {
    console.error('❌ Error generating sitemap:', err)
  }
}

generateSitemap().catch(console.error)