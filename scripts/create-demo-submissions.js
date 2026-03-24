#!/usr/bin/env node

/**
 * Create Demo Warehouse Submissions
 * 
 * This script creates demo warehouse submissions for testing the admin approval flow.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const demoSubmissions = [
  {
    name: "Prime Storage Hub",
    description: "Modern warehouse facility with state-of-the-art security and climate control systems. Perfect for e-commerce and logistics companies.",
    address: "Industrial Area, Sector 15",
    city: "Gurgaon",
    state: "Haryana",
    pincode: "122001",
    total_area: 75000,
    price_per_sqft: 65,
    amenities: ["24/7 Security", "CCTV Surveillance", "Fire Safety", "Loading Dock", "Climate Control"],
    features: ["High Ceiling", "Wide Gates", "Easy Road Access", "Near Highway", "Modern Infrastructure"],
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1601980169411-4c0d37967c2e?w=800&h=600&fit=crop&crop=center"
    ],
    documents: {
      gst_certificate: "https://via.placeholder.com/400x300?text=GST+Certificate",
      property_papers: "https://via.placeholder.com/400x300?text=Property+Papers",
      fire_certificate: "https://via.placeholder.com/400x300?text=Fire+Certificate",
      validation: {
        gst_certificate: { text: "GST Certificate", confidence: 0.95, is_valid: true, anomalies: [] },
        property_papers: { text: "Property Papers", confidence: 0.92, is_valid: true, anomalies: [] },
        fire_certificate: { text: "Fire Certificate", confidence: 0.88, is_valid: true, anomalies: [] }
      }
    }
  },
  {
    name: "Mega Logistics Center",
    description: "Large-scale warehouse with excellent connectivity to major highways and ports. Ideal for import-export businesses.",
    address: "Port Road, Industrial Zone",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    total_area: 120000,
    price_per_sqft: 85,
    amenities: ["24/7 Security", "CCTV Surveillance", "Fire Safety", "Loading Dock", "Parking Space", "Office Space"],
    features: ["High Ceiling", "Wide Gates", "Easy Road Access", "Near Port", "Dedicated Power Supply"],
    images: [
      "https://images.unsplash.com/photo-1553864250-05b20249ee6c?w=800&h=600&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1565610222536-ef2bdc4a7fd2?w=800&h=600&fit=crop&crop=center"
    ],
    documents: {
      gst_certificate: "https://via.placeholder.com/400x300?text=GST+Certificate",
      property_papers: "https://via.placeholder.com/400x300?text=Property+Papers",
      fire_certificate: "https://via.placeholder.com/400x300?text=Fire+Certificate",
      validation: {
        gst_certificate: { text: "GST Certificate", confidence: 0.90, is_valid: true, anomalies: [] },
        property_papers: { text: "Property Papers", confidence: 0.87, is_valid: false, anomalies: ["Document appears to be expired"] },
        fire_certificate: { text: "Fire Certificate", confidence: 0.93, is_valid: true, anomalies: [] }
      }
    }
  },
  {
    name: "SmartSpace Storage",
    description: "Technology-enabled warehouse with IoT monitoring and automated systems. Perfect for modern businesses.",
    address: "Tech Park, Electronic City",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560100",
    total_area: 50000,
    price_per_sqft: 75,
    amenities: ["24/7 Security", "CCTV Surveillance", "Fire Safety", "Climate Control", "IoT Monitoring"],
    features: ["High Ceiling", "Wide Gates", "Easy Road Access", "Modern Infrastructure", "Automated Systems"],
    images: [
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&h=600&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1590856029826-c7d73bb48fa2?w=800&h=600&fit=crop&crop=center"
    ],
    documents: {
      gst_certificate: "https://via.placeholder.com/400x300?text=GST+Certificate",
      property_papers: "https://via.placeholder.com/400x300?text=Property+Papers",
      fire_certificate: "https://via.placeholder.com/400x300?text=Fire+Certificate",
      validation: {
        gst_certificate: { text: "GST Certificate", confidence: 0.94, is_valid: true, anomalies: [] },
        property_papers: { text: "Property Papers", confidence: 0.91, is_valid: true, anomalies: [] },
        fire_certificate: { text: "Fire Certificate", confidence: 0.89, is_valid: true, anomalies: [] }
      }
    }
  }
];

async function createDemoSubmissions() {
  console.log('🚀 Creating demo warehouse submissions...\n');

  try {
    // Use existing owner ID from the existing submission
    const ownerId = '550e8400-e29b-41d4-a716-446655440002';
    console.log(`📝 Using existing owner ID: ${ownerId}`);

    // Create demo submissions
    for (const submission of demoSubmissions) {
      const { data, error } = await supabase
        .from('warehouse_submissions')
        .insert({
          owner_id: ownerId,
          ...submission,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating submission "${submission.name}":`, error);
      } else {
        console.log(`✅ Created submission: "${submission.name}" (ID: ${data.id})`);
      }
    }

    console.log('\n🎉 Demo submissions created successfully!');
    console.log('\nNext steps:');
    console.log('1. Go to the admin dashboard');
    console.log('2. Check the "Warehouse Approvals" tab');
    console.log('3. Review and approve/reject the submissions');

  } catch (error) {
    console.error('❌ Error creating demo submissions:', error);
  }
}

// Run the script
createDemoSubmissions();
