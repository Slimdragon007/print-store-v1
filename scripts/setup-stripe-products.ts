import { stripe } from '../lib/stripe';
import fs from 'fs';
import path from 'path';

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  // Sample products - modify these to match your actual prints
  const products = [
    {
      id: 'sedona-sunset-001',
      name: 'Sedona Sunset',
      description: 'Beautiful sunset photograph from Sedona, Arizona',
      variants: [
        { size: '8x10', label: '8 x 10 in', priceCents: 3000 },
        { size: '16x20', label: '16 x 20 in', priceCents: 9000 },
        { size: '24x36', label: '24 x 36 in', priceCents: 15000 }
      ]
    },
    // Add more products here
  ];

  const catalogData: any[] = [];

  for (const productData of products) {
    try {
      // Create product in Stripe
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: {
          print_id: productData.id
        }
      });

      console.log(`✅ Created product: ${product.name} (${product.id})`);

      const variants: any[] = [];

      // Create prices for each variant
      for (const variant of productData.variants) {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: variant.priceCents,
          currency: 'usd',
          metadata: {
            size: variant.size,
            label: variant.label
          }
        });

        console.log(`  📏 Created price: ${variant.label} - $${variant.priceCents / 100} (${price.id})`);

        variants.push({
          id: variant.size,
          label: variant.label,
          stripePriceId: price.id,
          priceCents: variant.priceCents
        });
      }

      // Add to catalog data
      catalogData.push({
        id: productData.id,
        title: productData.name,
        r2Key: `galleries/sedona-2025/${productData.id}.jpg`, // Update with your actual R2 keys
        variants
      });

    } catch (error) {
      console.error(`❌ Error creating product ${productData.name}:`, error);
    }
  }

  // Save updated catalog
  const catalogPath = path.join(process.cwd(), 'data', 'prints.json');
  fs.writeFileSync(catalogPath, JSON.stringify(catalogData, null, 2));

  console.log('\n✨ Setup complete! Updated data/prints.json with Stripe price IDs');
}

// Run the setup
setupStripeProducts().catch(console.error);