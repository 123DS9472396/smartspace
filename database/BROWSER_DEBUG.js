/* ═══════════════════════════════════════════════════════════════
 * BROWSER CONSOLE DEBUG SCRIPT
 * Copy and paste this into browser console (F12)
 * ═══════════════════════════════════════════════════════════════ */

console.log('🔍 CHECKING WAREHOUSE DATA...\n');

// Check if fetch is being called
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('warehouses') || args[0].includes('warehouse_submissions')) {
    console.log('📡 API CALL:', args[0]);
  }
  return originalFetch.apply(this, args);
};

console.log('✅ Fetch interceptor installed');
console.log('Now search for "korum" and watch the console!');
console.log('You should see:');
console.log('  📡 API CALL: ...warehouses?state=eq.Maharashtra...');
console.log('  📡 API CALL: ...warehouse_submissions?status=eq.approved...');
console.log('  📊 FETCHED DATA: {...}');
