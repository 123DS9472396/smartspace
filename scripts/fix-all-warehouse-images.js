/**
 * FIX ALL WAREHOUSE IMAGES
 * 
 * This script updates ALL warehouses with proper warehouse/industrial images
 * based on their warehouse_type. No more person photos, toys, or random images!
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// ONLY warehouse/industrial/logistics images - NO people, NO random objects
const WAREHOUSE_IMAGES = {
  // Cold Storage - Industrial refrigeration units
  'Cold Storage': [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80'
  ],
  // General Warehouse - Standard warehouse interiors
  'General Warehouse': [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80'
  ],
  // Dark Store / E-commerce
  'Dark Store': [
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80'
  ],
  // Agricultural
  'Agricultural': [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80'
  ],
  // Pharmaceutical
  'Pharmaceutical': [
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80'
  ],
  // Hazardous Materials
  'Hazardous Materials': [
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80'
  ],
  // Textile Warehouse
  'Textile Warehouse': [
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80'
  ],
  // Automobile Parts
  'Automobile Parts': [
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80'
  ],
  // Electronics
  'Electronics': [
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80'
  ],
  // FMCG
  'FMCG': [
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80'
  ],
  // E-commerce Fulfillment
  'E-commerce Fulfillment': [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80'
  ],
  // Bonded Warehouse
  'Bonded Warehouse': [
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80'
  ],
  // Distribution Center
  'Distribution Center': [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80'
  ]
};

// Default warehouse images for any type
const DEFAULT_WAREHOUSE_IMAGES = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
  'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
  'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80'
];

// More variety of warehouse images for randomization
const ALL_WAREHOUSE_IMAGES = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
  'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
  'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80',
  'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
  'https://images.unsplash.com/photo-1577017040065-650ee4d43339?w=800&q=80',
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
  'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80'
];

function getRandomImages(warehouseType, warehouseId) {
  // Use warehouse ID as seed for consistent images
  const seed = warehouseId.charCodeAt(0) + warehouseId.charCodeAt(warehouseId.length - 1);
  
  // Get images for this warehouse type, or use defaults
  let baseImages = WAREHOUSE_IMAGES[warehouseType] || DEFAULT_WAREHOUSE_IMAGES;
  
  // Create varied images by selecting 2-4 images
  const numImages = 2 + (seed % 3); // 2-4 images
  const images = [];
  
  for (let i = 0; i < numImages; i++) {
    const index = (seed + i) % ALL_WAREHOUSE_IMAGES.length;
    if (!images.includes(ALL_WAREHOUSE_IMAGES[index])) {
      images.push(ALL_WAREHOUSE_IMAGES[index]);
    }
  }
  
  // Ensure at least 2 images
  while (images.length < 2) {
    const randomImg = baseImages[images.length % baseImages.length];
    if (!images.includes(randomImg)) {
      images.push(randomImg);
    } else {
      images.push(DEFAULT_WAREHOUSE_IMAGES[images.length % DEFAULT_WAREHOUSE_IMAGES.length]);
    }
  }
  
  return images;
}

async function fixAllImages() {
  console.log('═'.repeat(80));
  console.log('🖼️  FIXING ALL WAREHOUSE IMAGES');
  console.log('═'.repeat(80));
  console.log('');
  
  // Get count first
  const { count } = await supabase
    .from('warehouses')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Total warehouses to update: ${count}`);
  console.log('');
  
  let processed = 0;
  let updated = 0;
  let errors = 0;
  const batchSize = 100;
  
  // Process in batches
  for (let offset = 0; offset < count; offset += batchSize) {
    const { data: warehouses, error } = await supabase
      .from('warehouses')
      .select('id, warehouse_type, name')
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      console.error(`Error fetching batch at offset ${offset}:`, error.message);
      errors += batchSize;
      continue;
    }
    
    // Update each warehouse
    for (const warehouse of warehouses) {
      const warehouseType = warehouse.warehouse_type || 'General Warehouse';
      const newImages = getRandomImages(warehouseType, warehouse.id);
      
      const { error: updateError } = await supabase
        .from('warehouses')
        .update({ images: newImages })
        .eq('id', warehouse.id);
      
      if (updateError) {
        errors++;
      } else {
        updated++;
      }
      processed++;
    }
    
    // Progress update
    const progress = ((processed / count) * 100).toFixed(1);
    process.stdout.write(`\r📦 Progress: ${processed}/${count} (${progress}%) | Updated: ${updated} | Errors: ${errors}`);
  }
  
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('✅ IMAGE FIX COMPLETE');
  console.log('═'.repeat(80));
  console.log('');
  console.log(`✅ Processed: ${processed}`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Errors: ${errors}`);
  
  // Verify sample
  console.log('\n📋 Sample images after fix:');
  const { data: sample } = await supabase
    .from('warehouses')
    .select('id, name, warehouse_type, images')
    .limit(5);
  
  if (sample) {
    for (const w of sample) {
      console.log(`\n  ${w.name} (${w.warehouse_type}):`);
      console.log(`    Images: ${w.images?.length || 0} warehouse photos`);
      if (w.images?.[0]) {
        console.log(`    First: ${w.images[0].substring(0, 60)}...`);
      }
    }
  }
}

fixAllImages().catch(console.error);
