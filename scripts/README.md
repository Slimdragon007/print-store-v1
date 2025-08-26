# Print Store Scripts

A comprehensive collection of scripts for managing the print store, including photo uploads, Stripe integration, and database management.

## Overview

This collection includes scripts for comprehensive print store management:

- **Stripe Integration**: Product setup, webhook verification, and payment processing
- **Photo Management**: Etsy photo uploads and Supabase integration
- **Database Operations**: Migration scripts and data management
- **SEO Optimization**: Content and metadata enhancement

## Script Categories

### 🏪 Stripe Integration Scripts

- `setup-stripe-products.ts` - Creates Stripe products and prices for prints
- `verify-stripe-webhooks.ts` - Tests and monitors webhook integration

### 📸 Photo Management Scripts

- `inventory-etsy-photos.js` - Photo inventory and validation
- `bulk-upload-etsy-photos.js` - Bulk upload to Supabase
- `migrate-images-to-supabase.ts` - Image migration utilities
- `sync-prints-from-r2.mjs` - R2 synchronization

### 🗄️ Database Scripts

- `migrate-to-supabase.ts` - Database migration utilities
- `test-supabase.ts` - Supabase connection testing
- `verify-supabase-data.ts` - Data validation and verification

### 🚀 SEO & Optimization

- `apply-seo-optimizations.ts` - SEO metadata enhancement
- `generate-sitemap.ts` - Sitemap generation

## Photo Organization Requirements

Your photos must be organized in this structure:

```
photos-directory/
├── product-slug-1/
│   ├── main.jpg              # Required: Main product image
│   ├── staged-1.jpg          # Optional: Staged images
│   ├── staged-2.jpg          # Sequential numbering starting from 1
│   └── staged-N.jpg
├── product-slug-2/
│   ├── main.png              # Supports .jpg, .jpeg, .png
│   └── staged-1.jpeg
└── utility-folder/           # Ignored folders (crop-images, etc.)
```

### Validation Rules

1. **Product folders**: Must contain exactly one `main` image
2. **Staged images**: Must follow `staged-N` pattern with sequential numbering
3. **File extensions**: Only `.jpg`, `.jpeg`, `.png` are supported
4. **Utility folders**: Predefined folders are ignored during processing

## 🏪 Stripe Integration

### Setup Stripe Products

Create Stripe products and prices for all prints in your Supabase database:

```bash
# Dry run (recommended first)
npm run stripe:setup-dry

# Test environment setup
npm run stripe:setup

# Production environment setup
npm run stripe:setup-prod
```

**Features:**
- Connects to both Stripe and Supabase
- Creates products for each print in the database
- Creates price objects for all size variants (8x10, 11x14, 16x20, 24x36)
- Updates Supabase with Stripe price IDs
- Dry-run mode for safety
- Comprehensive error handling and logging

**Size Variants Created:**
- 8x10 in: $30.00
- 11x14 in: $55.00
- 16x20 in: $90.00
- 24x36 in: $150.00

### Verify Stripe Webhooks

Test your Stripe webhook integration:

```bash
# Basic webhook verification
npm run stripe:verify-webhooks

# Test webhook events
npm run stripe:test-webhooks

# Monitor webhooks in real-time
npm run stripe:monitor-webhooks
```

**Features:**
- Tests webhook endpoint connectivity
- Validates webhook signature verification
- Simulates common webhook events
- Monitors webhook events in real-time
- Provides debugging information

**Tested Events:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.payment_succeeded`
- `customer.subscription.created`

### Environment Variables Required

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## 📸 Photo Management

### 1. Inventory Products

First, run the inventory script to analyze your photo collection:

```bash
node scripts/inventory-etsy-photos.js
```

This will:
- Scan all product folders
- Validate photo organization
- Generate detailed reports (JSON and CSV)
- Show statistics and any issues found

**Output files:**
- `etsy-inventory-[timestamp].json` - Complete inventory data
- `etsy-inventory-[timestamp].csv` - Spreadsheet-friendly report

### 2. Preview Upload (Dry Run)

Before uploading, preview what will be processed:

```bash
node scripts/bulk-upload-etsy-photos.js --dry-run
```

Or limit to test with a few products:

```bash
node scripts/bulk-upload-etsy-photos.js --dry-run --limit=5
```

This shows:
- Upload summary statistics
- Storage usage estimates
- Product breakdown by location
- Pricing information
- Sample products to be processed

### 3. Bulk Upload

When ready, run the actual upload:

```bash
node scripts/bulk-upload-etsy-photos.js
```

The system will:
- Show upload preview
- Ask for confirmation
- Upload photos in batches
- Create database records
- Generate upload report

**Output file:**
- `upload-report-[timestamp].json` - Complete upload results

## Configuration

### Environment Variables

Set these in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Product Variants

Each product gets these size variants created automatically:

| Size  | Price |
|-------|-------|
| 8x10  | $25.00 |
| 11x14 | $35.00 |
| 16x20 | $45.00 |
| 24x36 | $65.00 |

### Upload Settings

- **Batch Size**: 5 products processed simultaneously
- **Storage Bucket**: `prints`
- **Rate Limiting**: 1-second delay between batches

## Database Schema

### prints table
```sql
id: TEXT (Primary Key)
title: TEXT (Generated from folder slug)
image_url: TEXT (Main image URL)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### print_variants table
```sql
id: TEXT (Primary Key)
print_id: TEXT (Foreign Key to prints)
label: TEXT (Size: 8x10, 11x14, etc.)
stripe_price_id: TEXT (Placeholder for Stripe integration)
price_cents: INTEGER (Price in cents)
created_at: TIMESTAMP
```

## Reports and Analytics

### Inventory Report
- Total folders scanned
- Product vs utility folder breakdown
- Validation results
- Location-based grouping
- Sample product listings

### Upload Report
- Processing statistics
- Success/failure counts
- Error details
- Storage usage
- Performance metrics

## Error Handling

The system includes comprehensive error handling:

- **Validation Errors**: Missing main images, incorrect naming
- **Upload Errors**: Network issues, duplicate files
- **Database Errors**: Record creation failures
- **File System Errors**: Permission issues, missing files

All errors are logged with context for easy troubleshooting.

## Advanced Usage

### Command Line Options

```bash
# Dry run with limited products
node scripts/bulk-upload-etsy-photos.js --dry-run --limit=10

# Full upload
node scripts/bulk-upload-etsy-photos.js

# Inventory only
node scripts/inventory-etsy-photos.js
```

### Customization

You can modify these settings in the scripts:

- **UTILITY_FOLDERS**: Add folders to ignore
- **PRINT_VARIANTS**: Change sizes and pricing
- **BATCH_SIZE**: Adjust upload concurrency
- **Title Generation**: Customize product title formatting

## Location Mapping

The system automatically extracts location information from product slugs:

- `hawaii-maui` → "Hawaii, Maui"
- `big-sur` → "Big Sur, California"
- `sedona` → "Sedona, Arizona"
- `flagstaff` → "Flagstaff, Arizona"
- `san-francisco` → "San Francisco, California"
- `joshua-tree` → "Joshua Tree, California"
- `los-angeles` → "Los Angeles, California"

## Current Status

Based on the latest inventory scan:

- **Total Products**: 67 valid products
- **Total Images**: ~400+ images
- **Storage Estimate**: ~1.5 GB
- **Locations**: 9 distinct locations
- **Top Locations**: Sedona (14), Big Sur (13), Hawaii Maui (12)

All products pass validation with no issues found.

## Next Steps

1. **Stripe Integration**: Replace placeholder price IDs with real Stripe prices
2. **Image Optimization**: Add image resizing/optimization before upload
3. **Metadata Enhancement**: Extract EXIF data, add tags, descriptions
4. **Batch Management**: Add ability to upload specific product ranges
5. **Progress Tracking**: Add progress bars for long uploads

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure `.env.local` has Supabase credentials
   - Check service role key has storage permissions

2. **File Permission Errors**
   - Verify read access to photo directories
   - Check Supabase bucket permissions

3. **Upload Failures**
   - Run with `--dry-run` first to test
   - Use `--limit=1` to test single product
   - Check network connectivity

4. **Database Errors**
   - Verify Supabase schema is up to date
   - Check RLS policies allow inserts

### Getting Help

Review the generated reports for detailed error information:
- Inventory reports show validation issues
- Upload reports show processing failures
- Console output shows real-time progress

All reports include timestamps and detailed context for troubleshooting.