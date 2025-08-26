#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const ProductInventory = require('./inventory-etsy-photos.js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 5; // Number of products to upload simultaneously
const STORAGE_BUCKET = 'prints';

// Price configurations for different print sizes
const PRINT_VARIANTS = [
  { code: '8x10', label: '8 x 10 in', price_cents: 2500, stripe_price_id: '' },
  { code: '11x14', label: '11 x 14 in', price_cents: 3500, stripe_price_id: '' },
  { code: '16x20', label: '16 x 20 in', price_cents: 4500, stripe_price_id: '' },
  { code: '24x36', label: '24 x 36 in', price_cents: 6500, stripe_price_id: '' }
];

class EtsyPhotoUploader {
  constructor() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase configuration. Check your .env.local file.');
    }

    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    this.inventory = new ProductInventory();
    this.uploadStats = {
      totalProducts: 0,
      successfulUploads: 0,
      failedUploads: 0,
      totalImages: 0,
      uploadedImages: 0,
      errors: []
    };
    this.dryRun = false;
  }

  // Generate a unique ID for database records
  generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Upload a single image file to Supabase storage
  async uploadImage(filePath, storagePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const fileExt = path.extname(filePath);
      const mimeType = fileExt === '.png' ? 'image/png' : 'image/jpeg';

      if (this.dryRun) {
        console.log(`  [DRY RUN] Would upload: ${storagePath}`);
        return { success: true, url: `https://placeholder.com/${storagePath}` };
      }

      const { data, error } = await this.supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        });

      if (error) {
        // If file already exists, try to get its URL
        if (error.message?.includes('already exists')) {
          const { data: urlData } = this.supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(storagePath);
          
          return { 
            success: true, 
            url: urlData.publicUrl,
            skipped: true 
          };
        }
        throw error;
      }

      // Get the public URL
      const { data: urlData } = this.supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

      return { 
        success: true, 
        url: urlData.publicUrl,
        path: data.path 
      };

    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        filePath 
      };
    }
  }

  // Upload all images for a product
  async uploadProductImages(product) {
    const results = {
      mainImage: null,
      stagedImages: [],
      errors: []
    };

    // Upload main image
    if (product.mainImage) {
      const storagePath = `${product.slug}/main${path.extname(product.mainImage.filename)}`;
      const uploadResult = await this.uploadImage(product.mainImage.path, storagePath);
      
      if (uploadResult.success) {
        results.mainImage = {
          url: uploadResult.url,
          path: storagePath,
          skipped: uploadResult.skipped
        };
        this.uploadStats.uploadedImages++;
      } else {
        results.errors.push(`Main image upload failed: ${uploadResult.error}`);
      }
    }

    // Upload staged images
    for (const stagedImage of product.stagedImages) {
      const storagePath = `${product.slug}/staged-${stagedImage.number}${path.extname(stagedImage.filename)}`;
      const uploadResult = await this.uploadImage(stagedImage.path, storagePath);
      
      if (uploadResult.success) {
        results.stagedImages.push({
          number: stagedImage.number,
          url: uploadResult.url,
          path: storagePath,
          skipped: uploadResult.skipped
        });
        this.uploadStats.uploadedImages++;
      } else {
        results.errors.push(`Staged image ${stagedImage.number} upload failed: ${uploadResult.error}`);
      }
    }

    return results;
  }

  // Create database records for a product
  async createProductRecord(product, imageResults) {
    if (!imageResults.mainImage) {
      throw new Error('Cannot create product record without main image');
    }

    const printId = this.generateId();
    
    // Create print record
    const printData = {
      slug: product.slug,  // Use slug instead of id
      title: product.title,
      r2_key: imageResults.mainImage.path  // Use r2_key instead of image_url
    };

    let actualPrintId = printId;
    
    if (this.dryRun) {
      console.log(`  [DRY RUN] Would create print:`, printData);
    } else {
      const { data: insertedPrint, error: printError } = await this.supabase
        .from('prints')
        .insert([printData])
        .select()
        .single();

      if (printError) {
        throw new Error(`Failed to create print record: ${printError.message}`);
      }
      
      actualPrintId = insertedPrint.id;  // Use the actual UUID from database
    }

    // Create print variant records
    const variantInserts = PRINT_VARIANTS.map((variant, index) => ({
      print_id: actualPrintId,
      code: variant.code,
      label: variant.label,
      stripe_price_id: variant.stripe_price_id || null,
      price_cents: variant.price_cents,
      position: index + 1
    }));

    if (this.dryRun) {
      console.log(`  [DRY RUN] Would create ${variantInserts.length} variants`);
    } else {
      const { error: variantError } = await this.supabase
        .from('print_variants')
        .insert(variantInserts);

      if (variantError) {
        throw new Error(`Failed to create variant records: ${variantError.message}`);
      }
    }

    return { printId, variantCount: variantInserts.length };
  }

  // Process a single product
  async processProduct(product) {
    console.log(`\n📸 Processing: ${product.slug}`);
    console.log(`   Title: ${product.title}`);
    console.log(`   Location: ${product.info.location || 'Unknown'}`);
    console.log(`   Images: 1 main + ${product.stagedImages.length} staged`);

    try {
      // Upload images
      const imageResults = await this.uploadProductImages(product);
      
      if (imageResults.errors.length > 0) {
        throw new Error(`Image upload errors: ${imageResults.errors.join(', ')}`);
      }

      // Create database records
      const dbResults = await this.createProductRecord(product, imageResults);
      
      console.log(`   ✅ Success - Print ID: ${dbResults.printId}`);
      console.log(`   📦 Created ${dbResults.variantCount} size variants`);
      
      const skippedImages = [imageResults.mainImage, ...imageResults.stagedImages]
        .filter(img => img?.skipped).length;
      
      if (skippedImages > 0) {
        console.log(`   ℹ️  Skipped ${skippedImages} existing images`);
      }

      this.uploadStats.successfulUploads++;
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      this.uploadStats.failedUploads++;
      this.uploadStats.errors.push({
        product: product.slug,
        error: error.message
      });
    }

    this.uploadStats.totalImages += (product.stagedImages.length + 1);
  }

  // Process products in batches
  async processBatch(products, startIndex, batchSize) {
    const batch = products.slice(startIndex, startIndex + batchSize);
    const promises = batch.map(product => this.processProduct(product));
    await Promise.all(promises);
  }

  // Generate upload preview report
  async generatePreviewReport(products) {
    console.log('\n📋 UPLOAD PREVIEW REPORT');
    console.log('═'.repeat(50));

    const totalImages = products.reduce((sum, p) => sum + p.stagedImages.length + 1, 0);
    const totalVariants = products.length * PRINT_VARIANTS.length;

    console.log('\n📊 SUMMARY');
    console.log('─'.repeat(30));
    console.log(`Products to upload: ${products.length}`);
    console.log(`Total images: ${totalImages}`);
    console.log(`Print variants to create: ${totalVariants}`);
    
    // Storage usage estimate
    console.log('\n💾 ESTIMATED STORAGE USAGE');
    console.log('─'.repeat(30));
    let totalSizeBytes = 0;
    for (const product of products) {
      if (product.mainImage) totalSizeBytes += product.mainImage.size;
      for (const staged of product.stagedImages) {
        totalSizeBytes += staged.size;
      }
    }
    const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
    console.log(`Estimated total size: ${totalSizeMB} MB`);

    // Sample products
    console.log('\n📝 SAMPLE PRODUCTS TO UPLOAD');
    console.log('─'.repeat(30));
    for (let i = 0; i < Math.min(5, products.length); i++) {
      const product = products[i];
      console.log(`\n${i + 1}. ${product.slug}`);
      console.log(`   Title: ${product.title}`);
      console.log(`   Location: ${product.info.location || 'Unknown'}`);
      console.log(`   Images: ${product.stagedImages.length + 1} total`);
    }

    if (products.length > 5) {
      console.log(`\n... and ${products.length - 5} more products`);
    }

    // Location breakdown
    const locationCounts = {};
    for (const product of products) {
      const loc = product.info.location || 'Unknown';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    }

    console.log('\n🗺️  UPLOAD BY LOCATION');
    console.log('─'.repeat(30));
    Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([location, count]) => {
        console.log(`${location}: ${count} products`);
      });

    console.log('\n💰 VARIANT PRICING');
    console.log('─'.repeat(30));
    for (const variant of PRINT_VARIANTS) {
      const price = (variant.price_cents / 100).toFixed(2);
      console.log(`${variant.label}: $${price}`);
    }
  }

  // Main upload process
  async upload(options = {}) {
    this.dryRun = options.dryRun || false;
    const limit = options.limit || null;

    console.log('🚀 Starting Etsy Photo Bulk Upload');
    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE - No actual uploads will be performed');
    }
    console.log('');

    try {
      // Load product inventory
      console.log('📦 Loading product inventory...');
      await this.inventory.run();
      
      let products = this.inventory.products.filter(p => p.issues.length === 0);
      
      if (limit && limit > 0) {
        products = products.slice(0, limit);
        console.log(`⚠️  Limited to first ${limit} products`);
      }

      this.uploadStats.totalProducts = products.length;

      if (products.length === 0) {
        console.log('❌ No valid products found to upload');
        return;
      }

      // Generate preview report
      await this.generatePreviewReport(products);

      if (this.dryRun) {
        console.log('\n🔍 DRY RUN - Simulating upload process...\n');
      } else {
        // Confirm upload
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const confirmed = await new Promise(resolve => {
          rl.question('\n❓ Proceed with upload? (y/N): ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes');
          });
        });

        if (!confirmed) {
          console.log('❌ Upload cancelled');
          return;
        }

        console.log('\n🚀 Starting upload process...\n');
      }

      // Process products in batches
      const startTime = Date.now();
      
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const remaining = products.length - i;
        const currentBatch = Math.min(BATCH_SIZE, remaining);
        
        console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${currentBatch} products, ${remaining} remaining)`);
        
        await this.processBatch(products, i, BATCH_SIZE);
        
        // Small delay between batches to avoid rate limits
        if (i + BATCH_SIZE < products.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const endTime = Date.now();
      const durationSeconds = ((endTime - startTime) / 1000).toFixed(1);

      // Final report
      console.log('\n📊 UPLOAD COMPLETE');
      console.log('═'.repeat(50));
      console.log(`Duration: ${durationSeconds} seconds`);
      console.log(`Successful uploads: ${this.uploadStats.successfulUploads}`);
      console.log(`Failed uploads: ${this.uploadStats.failedUploads}`);
      console.log(`Images processed: ${this.uploadStats.uploadedImages}/${this.uploadStats.totalImages}`);

      if (this.uploadStats.errors.length > 0) {
        console.log('\n❌ ERRORS');
        console.log('─'.repeat(20));
        for (const error of this.uploadStats.errors) {
          console.log(`${error.product}: ${error.error}`);
        }
      }

      // Save report
      this.saveUploadReport();

    } catch (error) {
      console.error('\n💥 Fatal error:', error.message);
      process.exit(1);
    }
  }

  // Save upload report to file
  saveUploadReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(process.cwd(), `upload-report-${timestamp}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      dryRun: this.dryRun,
      stats: this.uploadStats,
      config: {
        batchSize: BATCH_SIZE,
        variants: PRINT_VARIANTS,
        storageBucket: STORAGE_BUCKET
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Upload report saved to: ${reportPath}`);
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    limit: null
  };

  // Parse limit option
  const limitIndex = args.findIndex(arg => arg.startsWith('--limit='));
  if (limitIndex !== -1) {
    options.limit = parseInt(args[limitIndex].split('=')[1]);
  }

  console.log('Etsy Photo Bulk Uploader');
  console.log('═'.repeat(30));
  console.log('Usage: node bulk-upload-etsy-photos.js [options]');
  console.log('Options:');
  console.log('  --dry-run, -d     Preview upload without actually uploading');
  console.log('  --limit=N         Limit upload to first N products');
  console.log('');

  const uploader = new EtsyPhotoUploader();
  uploader.upload(options).catch(console.error);
}

module.exports = EtsyPhotoUploader;