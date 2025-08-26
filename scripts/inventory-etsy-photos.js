#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Base directory for photos
const PHOTOS_DIR = '/Users/michaelhaslim/Library/Mobile Documents/com~apple~CloudDocs/Etsy_Listing_Photos_BACKUP_2025-08-13/resorganized Etsy photos 08-25-2025';

// Utility folders to ignore
const UTILITY_FOLDERS = new Set([
  '1x',
  'all-raw-listing-print-files-only-for-easy-reference',
  'crop-images',
  'crop-sizes',
  'excess-photos-not-used-for-listings-ig-approved',
  'final-of-cali',
  'final-of-flagstaff',
  'maui-and-oahu-etsy-photos',
  'photo-crops',
  'sedona-golf-photos',
  'triptych',
  'triptych-mocks'
]);

class ProductInventory {
  constructor() {
    this.products = [];
    this.issues = [];
    this.stats = {
      totalFolders: 0,
      productFolders: 0,
      utilityFolders: 0,
      validProducts: 0,
      productsWithIssues: 0
    };
  }

  // Check if a folder is a product folder (not a utility folder)
  isProductFolder(folderName) {
    return !UTILITY_FOLDERS.has(folderName) && 
           !folderName.startsWith('.') && 
           !folderName.startsWith('_');
  }

  // Validate file extensions
  isValidImageExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ['.jpg', '.jpeg', '.png'].includes(ext);
  }

  // Parse staged image number from filename
  parseStagedNumber(filename) {
    const match = filename.match(/^staged-(\d+)\.(jpg|jpeg|png)$/i);
    return match ? parseInt(match[1]) : null;
  }

  // Analyze a single product folder
  analyzeProductFolder(folderPath, folderName) {
    const product = {
      slug: folderName,
      folderPath: folderPath,
      mainImage: null,
      stagedImages: [],
      issues: []
    };

    try {
      const files = fs.readdirSync(folderPath);
      const mainFiles = [];
      const stagedFiles = [];
      const otherFiles = [];

      // Categorize files
      for (const file of files) {
        if (file.startsWith('.')) continue; // Skip hidden files

        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);
        
        if (!stat.isFile()) continue; // Skip directories

        if (!this.isValidImageExtension(file)) {
          otherFiles.push(file);
          continue;
        }

        const baseName = path.basename(file, path.extname(file)).toLowerCase();
        
        if (baseName === 'main') {
          mainFiles.push({
            filename: file,
            path: filePath,
            size: stat.size
          });
        } else {
          const stagedNumber = this.parseStagedNumber(file);
          if (stagedNumber !== null) {
            stagedFiles.push({
              filename: file,
              path: filePath,
              number: stagedNumber,
              size: stat.size
            });
          } else {
            otherFiles.push(file);
          }
        }
      }

      // Validate main image
      if (mainFiles.length === 0) {
        product.issues.push('Missing main image');
      } else if (mainFiles.length > 1) {
        product.issues.push(`Multiple main images found: ${mainFiles.map(f => f.filename).join(', ')}`);
      } else {
        product.mainImage = mainFiles[0];
      }

      // Validate staged images
      if (stagedFiles.length > 0) {
        stagedFiles.sort((a, b) => a.number - b.number);
        
        // Check for sequential numbering starting from 1
        let expectedNumber = 1;
        for (const staged of stagedFiles) {
          if (staged.number !== expectedNumber) {
            if (staged.number > expectedNumber) {
              product.issues.push(`Staged image numbering gap: expected staged-${expectedNumber}, found staged-${staged.number}`);
            }
          }
          expectedNumber = staged.number + 1;
        }

        product.stagedImages = stagedFiles;
      }

      // Report unexpected files
      if (otherFiles.length > 0) {
        product.issues.push(`Unexpected files: ${otherFiles.join(', ')}`);
      }

    } catch (error) {
      product.issues.push(`Error reading folder: ${error.message}`);
    }

    return product;
  }

  // Generate a human-readable title from slug
  generateTitle(slug) {
    return slug
      .replace(/^[a-z]+\d*-/, '') // Remove prefix codes like 'bsccop1-', 'hmiv1-', etc.
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Extract location and subject information from slug
  parseSlugInfo(slug) {
    const info = {
      location: '',
      subject: '',
      variant: ''
    };

    // Extract location patterns
    if (slug.includes('hawaii-maui')) {
      info.location = 'Hawaii, Maui';
    } else if (slug.includes('hawaii-oahu')) {
      info.location = 'Hawaii, Oahu';
    } else if (slug.includes('big-sur')) {
      info.location = 'Big Sur, California';
    } else if (slug.includes('flagstaff')) {
      info.location = 'Flagstaff, Arizona';
    } else if (slug.includes('sedona')) {
      info.location = 'Sedona, Arizona';
    } else if (slug.includes('san-francisco')) {
      info.location = 'San Francisco, California';
    } else if (slug.includes('los-angeles')) {
      info.location = 'Los Angeles, California';
    } else if (slug.includes('joshua-tree')) {
      info.location = 'Joshua Tree, California';
    }

    // Extract variant number
    const match = slug.match(/-(\d+)$/);
    if (match) {
      info.variant = match[1];
    }

    return info;
  }

  // Run the complete inventory
  async run() {
    console.log('🔍 Starting Etsy Photo Inventory...\n');
    
    try {
      const folders = fs.readdirSync(PHOTOS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort();

      this.stats.totalFolders = folders.length;

      for (const folderName of folders) {
        const folderPath = path.join(PHOTOS_DIR, folderName);
        
        if (this.isProductFolder(folderName)) {
          this.stats.productFolders++;
          const product = this.analyzeProductFolder(folderPath, folderName);
          
          // Add parsed information
          product.title = this.generateTitle(folderName);
          product.info = this.parseSlugInfo(folderName);
          
          this.products.push(product);
          
          if (product.issues.length === 0) {
            this.stats.validProducts++;
          } else {
            this.stats.productsWithIssues++;
          }
        } else {
          this.stats.utilityFolders++;
        }
      }

      this.generateReport();
      this.saveInventoryData();
      
    } catch (error) {
      console.error('❌ Error during inventory:', error.message);
      process.exit(1);
    }
  }

  // Generate console report
  generateReport() {
    console.log('📊 INVENTORY REPORT');
    console.log('═'.repeat(50));
    
    // Summary statistics
    console.log('\n📈 SUMMARY STATISTICS');
    console.log('─'.repeat(30));
    console.log(`Total Folders Scanned:     ${this.stats.totalFolders}`);
    console.log(`Product Folders:           ${this.stats.productFolders}`);
    console.log(`Utility Folders (ignored): ${this.stats.utilityFolders}`);
    console.log(`Valid Products:            ${this.stats.validProducts}`);
    console.log(`Products with Issues:      ${this.stats.productsWithIssues}`);
    
    // Products with issues
    if (this.stats.productsWithIssues > 0) {
      console.log('\n⚠️  PRODUCTS WITH ISSUES');
      console.log('─'.repeat(30));
      
      for (const product of this.products) {
        if (product.issues.length > 0) {
          console.log(`\n❌ ${product.slug}`);
          for (const issue of product.issues) {
            console.log(`   • ${issue}`);
          }
        }
      }
    }

    // Sample valid products
    const validProducts = this.products.filter(p => p.issues.length === 0);
    if (validProducts.length > 0) {
      console.log('\n✅ SAMPLE VALID PRODUCTS');
      console.log('─'.repeat(30));
      
      for (let i = 0; i < Math.min(5, validProducts.length); i++) {
        const product = validProducts[i];
        console.log(`\n✓ ${product.slug}`);
        console.log(`  Title: ${product.title}`);
        console.log(`  Location: ${product.info.location || 'Unknown'}`);
        console.log(`  Main Image: ${product.mainImage?.filename || 'None'}`);
        console.log(`  Staged Images: ${product.stagedImages.length}`);
      }
      
      if (validProducts.length > 5) {
        console.log(`\n... and ${validProducts.length - 5} more valid products`);
      }
    }

    // Location breakdown
    const locationCounts = {};
    for (const product of this.products) {
      const loc = product.info.location || 'Unknown';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    }

    console.log('\n🗺️  PRODUCTS BY LOCATION');
    console.log('─'.repeat(30));
    Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([location, count]) => {
        console.log(`${location}: ${count} products`);
      });
  }

  // Save inventory data to JSON file
  saveInventoryData() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(process.cwd(), `etsy-inventory-${timestamp}.json`);
    
    const inventoryData = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      products: this.products,
      utilityFolders: Array.from(UTILITY_FOLDERS)
    };

    fs.writeFileSync(outputPath, JSON.stringify(inventoryData, null, 2));
    
    console.log(`\n💾 Inventory data saved to: ${outputPath}`);
    
    // Also save a CSV for easier analysis
    this.saveCsvReport();
  }

  // Save CSV report for easier analysis
  saveCsvReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvPath = path.join(process.cwd(), `etsy-inventory-${timestamp}.csv`);
    
    const csvHeader = 'Slug,Title,Location,Valid,Main Image,Staged Count,Issues\n';
    const csvRows = this.products.map(product => {
      const isValid = product.issues.length === 0 ? 'Yes' : 'No';
      const issues = product.issues.join('; ');
      const location = product.info.location || '';
      
      return [
        product.slug,
        `"${product.title}"`,
        `"${location}"`,
        isValid,
        product.mainImage?.filename || '',
        product.stagedImages.length,
        `"${issues}"`
      ].join(',');
    });
    
    const csvContent = csvHeader + csvRows.join('\n');
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`📊 CSV report saved to: ${csvPath}`);
  }
}

// Run the inventory
if (require.main === module) {
  const inventory = new ProductInventory();
  inventory.run().catch(console.error);
}

module.exports = ProductInventory;