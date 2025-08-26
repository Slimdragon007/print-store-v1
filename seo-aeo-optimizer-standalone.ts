/**
 * SEO/AEO Optimizer Tool - Standalone Version
 * 
 * This tool can be used for any e-commerce project to optimize:
 * - Product titles and descriptions for SEO
 * - Voice search optimization
 * - AI Agent Engine Optimization (AEO)
 * - Schema.org structured data
 * - Location-based content
 * 
 * Author: Claude & Michael
 * Date: August 2025
 * License: MIT
 */

interface LocationContext {
  keywords: string[]
  description: string
  moods: string[]
  rooms: string[]
}

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
  schema_data: {
    productID: string
    brand: string
    material: string
    pattern: string
    isAccessoryOrSparePartFor?: string
  }
  agent_context: string
  agent_features: string[]
  agent_benefits: string[]
  voice_search_terms: string[]
  visual_alt_texts: {
    main: string
    staged: string[]
  }
}

export class SEOAEOOptimizer {
  private locationContexts: Record<string, LocationContext>
  private subjectKeywords: Record<string, string[]>
  private brandName: string
  private baseUrl: string

  constructor(config?: { brandName?: string; baseUrl?: string }) {
    this.brandName = config?.brandName || 'Your Brand'
    this.baseUrl = config?.baseUrl || 'https://example.com'
    
    // Define location contexts (expandable)
    this.locationContexts = {
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
      },
      'new-york': {
        keywords: ['nyc', 'manhattan', 'urban photography', 'city that never sleeps', 'empire state'],
        description: 'featuring the iconic skyline and energy of New York City',
        moods: ['energetic', 'cosmopolitan', 'bold', 'iconic', 'metropolitan'],
        rooms: ['loft', 'modern office', 'urban apartment', 'penthouse', 'gallery']
      },
      'paris': {
        keywords: ['city of lights', 'french art', 'eiffel tower', 'european photography', 'parisian'],
        description: 'capturing the romantic beauty of Paris, France',
        moods: ['romantic', 'elegant', 'classic', 'sophisticated', 'artistic'],
        rooms: ['bedroom', 'dining room', 'french-inspired decor', 'boutique hotel', 'cafe']
      }
    }

    // Define subject detection keywords
    this.subjectKeywords = {
      'ocean': ['ocean', 'sea', 'waves', 'beach', 'coastal', 'marine', 'shore', 'tide'],
      'mountain': ['mountain', 'peak', 'hill', 'ridge', 'summit', 'alpine', 'highlands'],
      'desert': ['desert', 'sand', 'dune', 'cactus', 'arid', 'mesa', 'canyon'],
      'sunset': ['sunset', 'sunrise', 'golden hour', 'dusk', 'dawn', 'twilight'],
      'golf': ['golf', 'course', 'green', 'fairway', 'links', 'putting'],
      'cliff': ['cliff', 'bluff', 'precipice', 'edge', 'outcrop'],
      'waterfall': ['waterfall', 'falls', 'cascade', 'rapids'],
      'cityscape': ['city', 'urban', 'skyline', 'building', 'architecture', 'downtown'],
      'beach': ['beach', 'shore', 'sand', 'coast', 'seaside', 'surf'],
      'forest': ['forest', 'tree', 'wood', 'pine', 'redwood', 'grove'],
      'lake': ['lake', 'pond', 'water', 'reflection', 'shore'],
      'bridge': ['bridge', 'span', 'crossing', 'viaduct'],
      'abstract': ['abstract', 'pattern', 'texture', 'geometric', 'artistic']
    }
  }

  /**
   * Main optimization function
   */
  optimizeProduct(slug: string, originalTitle: string, config?: {
    priceRange?: { min: number; max: number }
    sizes?: string[]
    productType?: string
  }): ProductMetadata {
    const location = this.detectLocation(slug)
    const subject = this.detectSubject(slug)
    const cleanTitle = this.cleanTitle(originalTitle)
    
    return {
      slug,
      title: cleanTitle,
      seo_title: this.generateSEOTitle(cleanTitle, location.name, subject),
      meta_description: this.generateMetaDescription(subject, location.context, config),
      long_description: this.generateLongDescription(subject, location, cleanTitle, config),
      keywords: this.generateKeywords(location, subject, slug),
      location: location.name,
      category: subject,
      style: this.detectStyles(slug, subject),
      colors: this.extractColors(slug),
      mood: location.context.moods,
      room_suggestions: location.context.rooms,
      artist_notes: this.generateArtistNotes(location.name, subject),
      print_details: this.generatePrintDetails(config?.productType),
      care_instructions: this.generateCareInstructions(),
      schema_data: this.generateSchemaData(slug, subject),
      agent_context: this.generateAgentContext(cleanTitle, location, subject, config),
      agent_features: this.generateFeatures(config?.productType),
      agent_benefits: this.generateBenefits(subject, location.context.moods),
      voice_search_terms: this.generateVoiceSearchTerms(subject, location.name, config),
      visual_alt_texts: this.generateAltTexts(cleanTitle, subject, location.name)
    }
  }

  private detectLocation(slug: string): { name: string; context: LocationContext } {
    const defaultLocation = {
      name: 'landscape',
      context: {
        keywords: ['landscape', 'nature', 'scenery', 'outdoor', 'natural'],
        description: 'featuring stunning natural landscapes',
        moods: ['peaceful', 'natural', 'calming', 'inspiring'],
        rooms: ['living room', 'bedroom', 'office', 'hallway']
      }
    }

    for (const [key, context] of Object.entries(this.locationContexts)) {
      if (slug.toLowerCase().includes(key.replace('-', ''))) {
        return { name: key, context }
      }
    }

    return defaultLocation
  }

  private detectSubject(slug: string): string {
    for (const [subject, keywords] of Object.entries(this.subjectKeywords)) {
      if (keywords.some(keyword => slug.toLowerCase().includes(keyword))) {
        return subject
      }
    }
    return 'landscape'
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/^[A-Z0-9]+\s/, '') // Remove product codes
      .replace(/\d+$/, '') // Remove trailing numbers
      .replace(/[-_]/g, ' ') // Replace separators with spaces
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  private generateSEOTitle(cleanTitle: string, location: string, subject: string): string {
    const locationName = location.charAt(0).toUpperCase() + location.slice(1).replace('-', ' ')
    return `${cleanTitle} | ${subject.charAt(0).toUpperCase() + subject.slice(1)} Photography Print | ${locationName}`
  }

  private generateMetaDescription(
    subject: string, 
    location: LocationContext,
    config?: { priceRange?: { min: number; max: number } }
  ): string {
    const price = config?.priceRange 
      ? ` Starting at $${config.priceRange.min}.` 
      : ' Multiple sizes available.'
    
    return `Professional ${subject} photography print ${location.description}. Museum-quality archival paper.${price} Free shipping on orders over $100.`
  }

  private generateLongDescription(
    subject: string,
    location: { name: string; context: LocationContext },
    cleanTitle: string,
    config?: { sizes?: string[] }
  ): string {
    const sizes = config?.sizes?.join(', ') || '8x10, 11x14, 16x20, 24x36'
    
    return `This stunning ${subject} photograph was ${location.context.description}. The image captures the natural beauty and unique character of the region, making it a perfect addition to any ${location.context.rooms.slice(0, 3).join(', ')} or ${location.context.rooms[3]}.

Printed on premium archival paper using fade-resistant inks, this artwork will maintain its vibrant colors for generations. The ${location.context.moods.slice(0, 2).join(' and ')} atmosphere of this piece creates a ${location.context.moods[2]} focal point in any space.

Available in multiple sizes (${sizes}) to suit your space, from intimate prints perfect for gallery walls to impressive statement pieces. Each print is carefully inspected for quality before shipping.

This ${cleanTitle} print showcases the photographer's eye for composition and timing, captured during optimal lighting conditions to bring out the natural beauty of the scene.`
  }

  private generateKeywords(
    location: { name: string; context: LocationContext },
    subject: string,
    slug: string
  ): string[] {
    const keywords = new Set([
      ...location.context.keywords,
      ...(this.subjectKeywords[subject] || []),
      `${location.name} art`,
      `${location.name} prints`,
      `${location.name} photography`,
      `${subject} print`,
      `${subject} wall art`,
      `${subject} decor`,
      'landscape photography',
      'fine art print',
      'wall decor',
      'home decor',
      'interior design',
      'gallery wall',
      'framed art',
      'canvas print',
      'photo print',
      'artwork',
      'wall hanging',
      'modern art',
      'contemporary photography'
    ])

    return Array.from(keywords)
  }

  private detectStyles(slug: string, subject: string): string[] {
    const styles = ['photography', 'contemporary', 'fine art']
    
    if (slug.includes('bw') || slug.includes('black')) styles.push('black and white')
    if (slug.includes('abstract')) styles.push('abstract')
    if (subject === 'cityscape') styles.push('urban', 'modern')
    if (subject === 'sunset') styles.push('romantic', 'warm')
    if (subject === 'ocean') styles.push('coastal', 'nautical')
    if (subject === 'desert') styles.push('southwestern', 'minimalist')
    
    return styles
  }

  private extractColors(slug: string): string[] {
    const colors: string[] = []
    const colorMap: Record<string, string> = {
      'black': 'black',
      'white': 'white',
      'bw': 'black and white',
      'color': 'full color',
      'blue': 'blue',
      'red': 'red',
      'green': 'green',
      'golden': 'gold',
      'sunset': 'orange, pink, purple',
      'ocean': 'blue, turquoise',
      'desert': 'red, orange, brown',
      'forest': 'green, brown'
    }
    
    for (const [key, value] of Object.entries(colorMap)) {
      if (slug.toLowerCase().includes(key)) {
        colors.push(value)
      }
    }
    
    return colors.length > 0 ? colors : ['full color']
  }

  private generateArtistNotes(location: string, subject: string): string {
    return `Captured during optimal lighting conditions to showcase the natural beauty of ${location}. This ${subject} piece represents the unique character and atmosphere of the region, carefully composed to create visual balance and emotional impact.`
  }

  private generatePrintDetails(productType?: string): string {
    return productType === 'canvas' 
      ? 'Gallery-wrapped canvas with 1.5" depth, ready to hang. UV-resistant coating protects against fading.'
      : 'Printed on premium 280gsm archival matte paper using pigment-based inks for maximum longevity. Prints have a small white border for framing.'
  }

  private generateCareInstructions(): string {
    return 'Handle with clean hands. Frame behind UV-protective glass for best preservation. Avoid direct sunlight and humid environments. Dust gently with a soft, dry cloth.'
  }

  private generateSchemaData(slug: string, subject: string) {
    return {
      productID: slug,
      brand: this.brandName,
      material: 'Archival Matte Paper',
      pattern: subject
    }
  }

  private generateAgentContext(
    title: string,
    location: { name: string; context: LocationContext },
    subject: string,
    config?: { priceRange?: { min: number; max: number }; sizes?: string[] }
  ): string {
    const sizes = config?.sizes || ['8x10', '11x14', '16x20', '24x36']
    const price = config?.priceRange 
      ? `Prices range from $${config.priceRange.min} to $${config.priceRange.max}`
      : 'Multiple price points available'
    
    return `Professional ${subject} photography print titled "${title}" from ${location.name}. Ideal for ${location.context.rooms.join(', ')} with ${location.context.moods.join(', ')} aesthetics. Printed on archival quality paper with fade-resistant inks. Available in ${sizes.length} sizes: ${sizes.join(', ')}. ${price}. Ships within 3-5 business days. Perfect for ${subject} enthusiasts, interior designers, and art collectors seeking authentic landscape photography.`
  }

  private generateFeatures(productType?: string): string[] {
    const baseFeatures = [
      'Museum-quality archival paper',
      'Fade-resistant pigment inks',
      'Multiple size options',
      'Ready for framing',
      'Protective packaging',
      'Certificate of authenticity included'
    ]
    
    if (productType === 'canvas') {
      baseFeatures.push('Gallery-wrapped edges', 'Ready to hang', 'No framing needed')
    }
    
    return baseFeatures
  }

  private generateBenefits(subject: string, moods: string[]): string[] {
    return [
      `Transform your space with professional ${subject} photography`,
      'Support independent artists and photographers',
      'Investment in lasting quality artwork',
      `Creates a ${moods[0]} atmosphere in any room`,
      'Unique conversation piece for your home',
      'Makes a thoughtful and memorable gift',
      'Enhances property value with quality art',
      `Perfect for creating a ${moods[1]} ambiance`
    ]
  }

  private generateVoiceSearchTerms(
    subject: string,
    location: string,
    config?: { priceRange?: { min: number; max: number } }
  ): string[] {
    const price = config?.priceRange?.min || 25
    
    return [
      `${subject} wall art near me`,
      `best ${location} landscape prints`,
      `where to buy ${subject} photography`,
      `${subject} prints under $${price * 2}`,
      `professional ${location} photographer prints`,
      `what size ${subject} print for living room`,
      `how to decorate with ${subject} art`,
      `${location} art prints for sale`,
      `affordable ${subject} wall decor`,
      `is ${subject} art good for bedroom`,
      `show me ${location} photography`,
      `find ${subject} prints online`
    ]
  }

  private generateAltTexts(
    title: string,
    subject: string,
    location: string
  ): { main: string; staged: string[] } {
    const locationName = location.charAt(0).toUpperCase() + location.slice(1).replace('-', ' ')
    
    return {
      main: `${title} - Professional ${subject} photograph taken in ${locationName}, showing detailed landscape composition`,
      staged: [
        `${title} shown framed in a modern living room setting`,
        `Close-up detail of ${title} print quality and color reproduction`,
        `${title} available in multiple size options for wall display`,
        `${title} print shown in natural lighting conditions`,
        `Gallery wall featuring ${title} with complementary artwork`,
        `${title} packaged for safe shipping with protective materials`,
        `Size comparison of ${title} print options`,
        `${title} displayed in a ${locationName}-themed room`
      ]
    }
  }

  /**
   * Generate XML sitemap
   */
  generateSitemapXML(products: Array<{ slug: string; updated_at: string }>): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${this.baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${this.baseUrl}/prints</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${products.map(product => `  <url>
    <loc>${this.baseUrl}/prints/${product.slug}</loc>
    <lastmod>${new Date(product.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${this.baseUrl}/images/${product.slug}/main.jpg</image:loc>
    </image:image>
  </url>`).join('\n')}
</urlset>`
  }

  /**
   * Generate robots.txt
   */
  generateRobotsTxt(): string {
    return `# Robots.txt for ${this.brandName}
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl-delay (be nice to servers)
Crawl-delay: 1

# Disallow admin areas
Disallow: /admin
Disallow: /api/admin
Disallow: /.env

# Allow search engines to index images
User-agent: Googlebot-Image
Allow: /images/
Allow: /api/images/`
  }
}

// Export for use in other projects
export default SEOAEOOptimizer

// Example usage:
// const optimizer = new SEOAEOOptimizer({ brandName: 'My Art Store', baseUrl: 'https://mystore.com' })
// const optimized = optimizer.optimizeProduct('sedona-sunset-print-1', 'Sedona Sunset Print 1')
// console.log(optimized)