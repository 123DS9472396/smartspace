#!/usr/bin/env node
/**
 * Debug: Check ALL bookings in database
 * Run: node debug-check-all-bookings.mjs
 */

import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function checkAllBookings() {
  try {
    console.log('🔍 Fetching all bookings from database...\n');

    const response = await fetch(`${API_URL}/api/debug/all-bookings`);
    const result = await response.json();

    if (!result.success) {
      console.error('❌ Error:', result.error);
      return;
    }

    console.log(`📊 Total Bookings: ${result.totalBookings}`);
    console.log(`💰 Total Amount: ₹${result.totalAmount?.toLocaleString()}\n`);

    console.log('📋 Summary by Warehouse:');
    if (result.summary && result.summary.length > 0) {
      result.summary.forEach((wh) => {
        console.log(`  - ${wh.warehouse_id}: ${wh.count} bookings, ₹${wh.total_amount?.toLocaleString()}`);
      });
    } else {
      console.log('  (No bookings found)');
    }

    console.log('\n📦 Detailed Bookings by Warehouse:');
    const bookingsByWh = result.bookingsByWarehouse || {};
    Object.entries(bookingsByWh).forEach(([whId, bookings]) => {
      console.log(`\n  Warehouse ${whId}:`);
      bookings.forEach((booking, idx) => {
        console.log(`    [${idx + 1}] ID: ${booking.id}`);
        console.log(`        Created: ${booking.created_at}`);
        console.log(`        Status: ${booking.metadata?.booking_status}`);
        console.log(`        Amount: ₹${booking.metadata?.total_amount}`);
        console.log(`        Area: ${booking.metadata?.area_sqft} sqft`);
        console.log(`        Dates: ${booking.metadata?.start_date} to ${booking.metadata?.end_date}`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllBookings();
