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

// SEO/AEO Optimization Configuration
interface ProductMetadata {
  slug: string
  title: string
  seo_title: string
  meta_description: string
  long_description: string
  keywords: string[]
  location: string
  category: string
  style: string[]
  colors: string[]
  mood: string[]
  room_suggestions: string[]
  artist_notes: string
  print_details: string
  care_instructions: string
  // Schema.org structured data
  schema_data: {
    productID: string
    brand: string
    material: string
    pattern: string
    isAccessoryOrSparePartFor?: string
  }
  // AI Agent optimization
  agent_context: string
  agent_features: string[]
  agent_benefits: string[]
  voice_search_terms: string[]
  visual_alt_texts: {
    main: string
    staged: string[]
  }
}

// Location-based SEO templates
const LOCATION_CONTEXTS = {
  'sedona': {
    keywords: ['red rocks', 'arizona desert', 'southwest art', 'sedona vortex', 'desert landscape'],
    description: 'captured in the mystical red rock country of Sedona, Arizona',
    moods: ['spiritual', 'earthy', 'warm', 'majestic', 'southwestern'],
    rooms: ['living room', 'meditation space', 'office', 'spa', 'yoga studio']
  },
  'big-sur': {
    keywords: ['california coast', 'pacific ocean', 'coastal cliffs', 'highway 1', 'monterey'],
    description: 'featuring the dramatic coastline of Big Sur, California',
    moods: ['serene', 'dramatic', 'coastal', 'refreshing', 'natural'],
    rooms: ['bedroom', 'bathroom', 'coastal home', 'beach house', 'modern living room']
  },
  'hawaii': {
    keywords: ['tropical paradise', 'island art', 'pacific islands', 'aloha spirit', 'hawaiian landscape'],
    description: 'showcasing the tropical beauty of the Hawaiian islands',
    moods: ['tropical', 'peaceful', 'exotic', 'vibrant', 'paradise'],
    rooms: ['bedroom', 'bathroom', 'tropical themed room', 'vacation rental', 'spa']
  },
  'san-francisco': {
    keywords: ['city art', 'urban landscape', 'bay area', 'california cityscape', 'golden gate'],
    description: 'capturing the iconic architecture and views of San Francisco',
    moods: ['urban', 'modern', 'sophisticated', 'dynamic', 'contemporary'],
    rooms: ['office', 'modern apartment', 'loft', 'urban living room', 'startup office']
  },
  'joshua-tree': {
    keywords: ['mojave desert', 'desert photography', 'california desert', 'yucca trees', 'desert art'],
    description: 'from the otherworldly landscape of Joshua Tree, California',
    moods: ['minimalist', 'surreal', 'peaceful', 'desert', 'bohemian'],
    rooms: ['bedroom', 'meditation room', 'boho living room', 'creative space', 'desert home']
  },
  'flagstaff': {
    keywords: ['northern arizona', 'mountain art', 'pine forest', 'high country', 'route 66'],
    description: 'captured in the pine forests and mountain country of Flagstaff, Arizona',
    moods: ['rustic', 'mountain', 'cozy', 'natural', 'adventurous'],
    rooms: ['cabin', 'lodge', 'rustic living room', 'mountain home', 'ski lodge']
  }
}

// Generate SEO-optimized content
function generateSEOContent(slug: string, originalTitle: string): ProductMetadata {
  // Extract location from slug
  const locationKey = Object.keys(LOCATION_CONTEXTS).find(key => 
    slug.toLowerCase().includes(key)
  ) || 'sedona'
  
  const location = LOCATION_CONTEXTS[locationKey as keyof typeof LOCATION_CONTEXTS]
  
  // Parse slug for better understanding
  const words = slug.split('-').filter(w => w.length > 2)
  
  // Detect subject matter
  const subjects = {
    'ocean': ['ocean', 'sea', 'waves', 'beach', 'coastal', 'marine'],
    'mountain': ['mountain', 'peak', 'hill', 'ridge', 'summit'],
    'desert': ['desert', 'sand', 'dune', 'cactus', 'arid'],
    'sunset': ['sunset', 'sunrise', 'golden hour', 'dusk', 'dawn'],
    'golf': ['golf', 'course', 'green', 'fairway'],
    'cliff': ['cliff', 'bluff', 'precipice', 'edge'],
    'waterfall': ['waterfall', 'falls', 'cascade'],
    'cityscape': ['city', 'urban', 'skyline', 'building', 'architecture'],
    'beach': ['beach', 'shore', 'sand', 'coast'],
    'forest': ['forest', 'tree', 'wood', 'pine']
  }
  
  let detectedSubject = 'landscape'
  let subjectKeywords: string[] = []
  
  for (const [subject, keywords] of Object.entries(subjects)) {
    if (keywords.some(keyword => slug.includes(keyword))) {
      detectedSubject = subject
      subjectKeywords = keywords
      break
    }
  }
  
  // Generate rich, SEO-optimized title
  const cleanTitle = originalTitle
    .replace(/^\w+\s/, '') // Remove product codes
    .replace(/\d+$/, '') // Remove trailing numbers
    .trim()
  
  const seoTitle = `${cleanTitle} | Fine Art Photography Print | ${locationKey.charAt(0).toUpperCase() + locationKey.slice(1)}`
  
  // Generate comprehensive meta description (155-160 chars for Google)
  const metaDescription = `Professional ${detectedSubject} photography print ${location.description}. Museum-quality archival paper, multiple sizes available. Free shipping on orders over $100.`
  
  // Generate long-form description for product page
  const longDescription = `This stunning ${detectedSubject} photograph was ${location.description}. The image captures the natural beauty and unique character of the region, making it a perfect addition to any ${location.rooms.slice(0, 3).join(', ')} or ${location.rooms[3]}. 

Printed on premium archival paper using fade-resistant inks, this artwork will maintain its vibrant colors for generations. The ${location.moods.slice(0, 2).join(' and ')} atmosphere of this piece creates a ${location.moods[2]} focal point in any space.

Available in multiple sizes to suit your space, from intimate 8x10 prints perfect for gallery walls to impressive 24x36 statement pieces. Each print is carefully inspected for quality before shipping.`
  
  // Generate voice search optimized terms
  const voiceSearchTerms = [
    `${detectedSubject} wall art near me`,
    `best ${locationKey} landscape prints`,
    `where to buy ${detectedSubject} photography`,
    `${location.moods[0]} wall decor for ${location.rooms[0]}`,
    `professional ${locationKey} photographer prints`,
    `what size print for ${location.rooms[0]}`,
    `how to decorate with ${detectedSubject} art`
  ]
  
  // Generate AI agent context (for AEO)
  const agentContext = `Professional landscape photography print featuring ${detectedSubject} from ${locationKey}. This artwork is ideal for ${location.rooms.join(', ')} with ${location.moods.join(', ')} aesthetics. Printed on archival quality paper with fade-resistant inks. Available in 4 sizes: 8x10 ($25), 11x14 ($35), 16x20 ($45), 24x36 ($65). Ships within 3-5 business days. Perfect for ${subjects[detectedSubject as keyof typeof subjects]?.join(', ')} enthusiasts and interior designers seeking authentic landscape photography.`
  
  // Generate alt texts for accessibility and image SEO
  const mainAltText = `${cleanTitle} - Professional ${detectedSubject} photograph taken in ${locationKey}, showing ${location.moods.slice(0, 2).join(' and ')} scenery`
  
  const stagedAltTexts = [
    `${cleanTitle} shown framed in a ${location.rooms[0]} setting`,
    `Close-up detail of ${cleanTitle} print quality and color reproduction`,
    `${cleanTitle} in multiple size options for wall display`,
    `${cleanTitle} print shown in natural lighting conditions`,
    `Gallery wall featuring ${cleanTitle} with complementary artwork`
  ]
  
  return {
    slug,
    title: cleanTitle,
    seo_title: seoTitle,
    meta_description: metaDescription,
    long_description: longDescription,
    keywords: [
      ...location.keywords,
      ...subjectKeywords,
      `${locationKey} art`,
      `${locationKey} prints`,
      `${locationKey} photography`,
      `${detectedSubject} print`,
      `${detectedSubject} wall art`,
      'landscape photography',
      'fine art print',
      'wall decor',
      'home decor',
      'interior design'
    ],
    location: locationKey,
    category: detectedSubject,
    style: ['photography', 'landscape', 'contemporary', 'fine art'],
    colors: extractColors(slug),
    mood: location.moods,
    room_suggestions: location.rooms,
    artist_notes: `Captured during optimal lighting conditions to showcase the natural beauty of ${locationKey}. This piece represents the unique character and atmosphere of the region.`,
    print_details: 'Printed on premium 280gsm archival matte paper using pigment-based inks for maximum longevity. Prints have a small white border for framing.',
    care_instructions: 'Handle with clean hands. Frame behind UV-protective glass for best preservation. Avoid direct sunlight and humid environments.',
    schema_data: {
      productID: slug,
      brand: 'Your Brand Name',
      material: 'Archival Matte Paper',
      pattern: detectedSubject
    },
    agent_context: agentContext,
    agent_features: [
      'Museum-quality archival paper',
      'Fade-resistant pigment inks',
      'Multiple size options',
      'Ready for framing',
      'Protective packaging',
      'Certificate of authenticity included'
    ],
    agent_benefits: [
      'Transform your space with professional photography',
      'Support independent artists',
      'Investment in lasting quality',
      'Unique conversation piece',
      'Enhances room ambiance',
      'Makes a thoughtful gift'
    ],
    voice_search_terms: voiceSearchTerms,
    visual_alt_texts: {
      main: mainAltText,
      staged: stagedAltTexts
    }
  }
}

// Extract colors from filename/slug
function extractColors(slug: string): string[] {
  const colors: string[] = []
  const colorMap = {
    'black': 'black',
    'white': 'white',
    'bw': 'black and white',
    'color': 'full color',
    'blue': 'blue',
    'red': 'red',
    'green': 'green',
    'sunset': 'orange, pink, purple',
    'ocean': 'blue, turquoise',
    'desert': 'red, orange, brown',
    'forest': 'green, brown'
  }
  
  for (const [key, value] of Object.entries(colorMap)) {
    if (slug.includes(key)) {
      colors.push(value)
    }
  }
  
  return colors.length > 0 ? colors : ['full color']
}

// Update Supabase with SEO data
async function updateProductSEO() {
  console.log('🔍 Starting SEO/AEO Optimization Process...\n')
  
  // Get all products from Supabase
  const { data: products, error } = await supabase
    .from('prints')
    .select('*')
    .order('created_at')
  
  if (error || !products) {
    console.error('Error fetching products:', error)
    return
  }
  
  console.log(`Found ${products.length} products to optimize\n`)
  
  const seoReport: any[] = []
  
  for (const product of products) {
    console.log(`📸 Optimizing: ${product.title}`)
    
    // Generate SEO content
    const seoData = generateSEOContent(product.slug, product.title)
    
    // First, check if we need to add SEO columns to the database
    // This would normally be done via migration, but showing structure here
    const updateData = {
      title: seoData.seo_title,
      // These fields would need to be added to your Supabase table:
      // meta_description: seoData.meta_description,
      // long_description: seoData.long_description,
      // keywords: seoData.keywords,
      // location: seoData.location,
      // category: seoData.category,
      // seo_data: JSON.stringify(seoData)
    }
    
    // For now, we'll save to a JSON file for review
    seoReport.push({
      id: product.id,
      slug: product.slug,
      original_title: product.title,
      ...seoData
    })
    
    console.log(`  ✅ SEO optimized: ${seoData.seo_title}`)
    console.log(`  📍 Location: ${seoData.location}`)
    console.log(`  🎨 Category: ${seoData.category}`)
    console.log(`  🔑 Keywords: ${seoData.keywords.length} terms`)
    console.log(`  🎯 Voice search: ${seoData.voice_search_terms.length} phrases`)
    console.log()
  }
  
  // Save SEO report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportPath = path.join(process.cwd(), `seo-optimization-report-${timestamp}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(seoReport, null, 2))
  
  console.log('📊 SEO OPTIMIZATION COMPLETE')
  console.log('════════════════════════════════════════')
  console.log(`✅ Optimized ${products.length} products`)
  console.log(`📄 Report saved to: ${reportPath}`)
  console.log('\n🚀 Next Steps:')
  console.log('1. Review the SEO report')
  console.log('2. Add SEO columns to Supabase (meta_description, keywords, etc.)')
  console.log('3. Update your frontend to use the optimized content')
  console.log('4. Implement Schema.org structured data')
  console.log('5. Set up XML sitemap with all products')
  console.log('6. Configure robots.txt and meta tags')
}

// Generate XML Sitemap
async function generateSitemap() {
  const { data: products } = await supabase
    .from('prints')
    .select('slug, updated_at')
  
  const baseUrl = 'https://yourstore.com'
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/prints</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${products?.map(product => `  <url>
    <loc>${baseUrl}/prints/${product.slug}</loc>
    <lastmod>${new Date(product.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${baseUrl}/api/images/${product.slug}/main.jpg</image:loc>
    </image:image>
  </url>`).join('\n')}
</urlset>`
  
  fs.writeFileSync('public/sitemap.xml', sitemap)
  console.log('✅ Sitemap generated: public/sitemap.xml')
}

// Run optimization
updateProductSEO()
  .then(() => generateSitemap())
  .catch(console.error)