import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Indian phone number prefixes (major cities/operators)
const phonePrefixes = ['98', '99', '97', '96', '95', '94', '93', '91', '90', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '74', '73', '72', '70'];

// Company name suffixes for email domains
const companySuffixes = ['warehousing', 'logistics', 'storage', 'warehouse', 'coldchain', 'supply', 'depot', 'hub', 'fulfillment'];

// First names for contact persons
const firstNames = ['Rajesh', 'Amit', 'Suresh', 'Vikram', 'Anil', 'Pradeep', 'Rakesh', 'Sanjay', 'Mahesh', 'Dinesh', 'Ramesh', 'Prakash', 'Vijay', 'Ajay', 'Deepak', 'Manoj', 'Sunil', 'Ashok', 'Naresh', 'Mukesh'];
const lastNames = ['Sharma', 'Patel', 'Deshmukh', 'Kulkarni', 'Joshi', 'Patil', 'Shah', 'Mehta', 'Gupta', 'Agarwal', 'Singh', 'Verma', 'Rao', 'Reddy', 'Kumar', 'Mishra', 'Dubey', 'Pandey', 'Shukla', 'Tiwari'];

function generatePhone(city) {
  const prefix = phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)];
  const number = Math.floor(10000000 + Math.random() * 90000000);
  return `+91 ${prefix}${number}`;
}

function generateEmail(city, warehouseType) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase();
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)].toLowerCase();
  const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
  const cityPart = (city || 'warehouse').toLowerCase().replace(/[^a-z]/g, '');
  
  const domains = [
    `${cityPart}${suffix}.com`,
    `${cityPart}warehouses.in`,
    `${suffix}india.com`,
    `mh${suffix}.com`,
    `${cityPart}storage.in`
  ];
  
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName}.${lastName}@${domain}`;
}

function generateContactPerson() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

async function updateContacts() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('📞 UPDATING CONTACT INFORMATION');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  
  // Get all warehouses
  const { data: warehouses, error } = await supabase
    .from('warehouses')
    .select('id, city, warehouse_type, contact_phone, contact_email, contact_person')
    .is('contact_phone', null);
  
  if (error) {
    console.log('Error fetching warehouses:', error.message);
    return;
  }
  
  console.log(`📊 Found ${warehouses.length} warehouses with missing contact info\n`);
  
  let updated = 0;
  let errors = 0;
  const batchSize = 50;
  
  for (let i = 0; i < warehouses.length; i += batchSize) {
    const batch = warehouses.slice(i, i + batchSize);
    
    const updates = await Promise.all(batch.map(async (warehouse) => {
      const updateData = {
        contact_phone: generatePhone(warehouse.city),
        contact_email: generateEmail(warehouse.city, warehouse.warehouse_type),
        contact_person: warehouse.contact_person || generateContactPerson()
      };
      
      const { error: updateError } = await supabase
        .from('warehouses')
        .update(updateData)
        .eq('id', warehouse.id);
      
      if (updateError) {
        errors++;
        return false;
      }
      updated++;
      return true;
    }));
    
    const progress = Math.min(i + batchSize, warehouses.length);
    process.stdout.write(`\r📦 Progress: ${progress}/${warehouses.length} (${(progress / warehouses.length * 100).toFixed(1)}%) | Updated: ${updated} | Errors: ${errors}`);
  }
  
  console.log('\n\n════════════════════════════════════════════════════════════════════════════════');
  console.log('✅ CONTACT UPDATE COMPLETE');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Errors: ${errors}`);
  
  // Verify
  console.log('\n📋 Verifying update...\n');
  const { data: sample } = await supabase
    .from('warehouses')
    .select('id, city, contact_phone, contact_email, contact_person')
    .limit(5);
  
  if (sample) {
    sample.forEach((w, i) => {
      console.log(`--- Warehouse ${i + 1} (${w.city}) ---`);
      console.log(`  Contact: ${w.contact_person}`);
      console.log(`  Phone: ${w.contact_phone}`);
      console.log(`  Email: ${w.contact_email}`);
      console.log('');
    });
  }
}

updateContacts();
