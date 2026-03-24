#!/usr/bin/env node
/**
 * Comprehensive Booking Debug Script
 * Tests the entire booking pipeline:
 *  1. Creates test bookings via debug endpoint
 *  2. Checks all bookings via new debug endpoint
 *  3. Checks admin view of those bookings
 */

import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function run() {
  try {
    console.log('🧪 COMPREHENSIVE BOOKING DEBUG TEST\n');
    console.log(`📍 API URL: ${API_URL}\n`);

    // Step 1: Create test bookings
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 1: Create Test Bookings');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const createRes = await fetch(`${API_URL}/api/debug/create-test-bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const createData = await createRes.json();

    if (!createData.success) {
      console.error('❌ Failed to create test bookings:', createData);
      return;
    }

    console.log(`✅ Created ${createData.bookingsCreated} test bookings`);
    console.log(`📊 Message: ${createData.message}\n`);

    // Step 2: Check ALL bookings directly
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 2: Check ALL Bookings in Database');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const allRes = await fetch(`${API_URL}/api/debug/all-bookings`);
    const allData = await allRes.json();

    if (!allData.success) {
      console.error('❌ Failed to fetch all bookings:', allData);
      return;
    }

    console.log(`✅ Total Bookings Found: ${allData.totalBookings}`);
    console.log(`💰 Total Amount: ₹${allData.totalAmount?.toLocaleString()}`);
    console.log(`📦 Warehouses with Bookings: ${Object.keys(allData.bookingsByWarehouse).length}\n`);

    if (allData.summary && allData.summary.length > 0) {
      console.log('📊 Summary by Warehouse:');
      allData.summary.forEach((s, i) => {
        console.log(`   ${i + 1}. Warehouse ${s.warehouse_id}: ${s.count} bookings, ₹${s.total_amount?.toLocaleString()}`);
      });
      console.log();
    }

    // Step 3: Check admin view
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 3: Check Admin Warehouse View');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const adminRes = await fetch(`${API_URL}/api/admin/warehouses`);
    const adminData = await adminRes.json();

    if (!adminData.success) {
      console.error('❌ Failed to fetch admin warehouses:', adminData);
      return;
    }

    console.log(`✅ Total Warehouses: ${adminData.warehouses?.length || 0}`);
    console.log(`📦 Summary Stats:`, adminData.summary);
    console.log();

    // Show warehouses with bookings
    const warehouses_with_bookings = (adminData.warehouses || []).filter(w => w.total_bookings > 0);
    console.log(`🏭 Warehouses with Bookings: ${warehouses_with_bookings.length}`);
    
    if (warehouses_with_bookings.length > 0) {
      warehouses_with_bookings.forEach(w => {
        console.log(`\n   📍 ${w.name} (${w.city}, ${w.state})`);
        console.log(`      Total: ${w.total_bookings} | Pending: ${w.pending_bookings} | Approved: ${w.approved_bookings} | Rejected: ${w.rejected_bookings}`);
        console.log(`      Revenue: ₹${w.total_revenue?.toLocaleString()}`);
        
        if (w.bookings && w.bookings.length > 0) {
          console.log(`      Bookings:`);
          w.bookings.slice(0, 3).forEach((b, i) => {
            console.log(`        [${i + 1}] ${b.seeker_name} | ${b.area_sqft} sqft | ₹${b.total_amount} | ${b.status}`);
          });
          if (w.bookings.length > 3) {
            console.log(`        ... and ${w.bookings.length - 3} more`);
          }
        }
      });
    } else {
      console.log('   ⚠️  No warehouses with bookings found');
    }

    // Step 4: Comparison
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 4: Verification');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const adminTotalBookings = adminData.summary?.total_bookings || 0;
    const allTotalBookings = allData.totalBookings || 0;

    console.log(`Admin view sees: ${adminTotalBookings} bookings`);
    console.log(`Raw DB has: ${allTotalBookings} bookings`);
    
    if (adminTotalBookings === allTotalBookings) {
      console.log('✅ MATCH: Admin view correctly shows all bookings!');
    } else {
      console.log(`⚠️  MISMATCH: Admin view is missing ${allTotalBookings - adminTotalBookings} bookings`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();
