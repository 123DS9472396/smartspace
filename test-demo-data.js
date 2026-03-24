// Test script to verify localStorage data structure
console.log('=== DEMO DATA TEST ===');

// Check current localStorage data
const submissions = JSON.parse(localStorage.getItem('demo-submissions') || '[]');
const approvedWarehouses = JSON.parse(localStorage.getItem('approved-warehouses') || '[]');

console.log('Current submissions:', submissions.length);
console.log('Approved warehouses:', approvedWarehouses.length);

// If no submissions exist, create test data
if (submissions.length === 0) {
  const testSubmissions = [
    {
      id: 'demo-submission-' + Date.now(),
      name: 'SmartSpace Demo Warehouse',
      description: 'Modern warehouse facility with AI-powered security and climate control',
      address: '123 Industrial Area, Thane West',
      city: 'Thane',
      state: 'Maharashtra',
      pincode: '400601',
      total_area: '5000',
      price_per_sqft: '50',
      amenities: ['24/7 Security', 'CCTV Surveillance', 'Fire Safety', 'Climate Control'],
      features: ['High Ceiling', 'Wide Gates', 'Easy Road Access', 'Loading Dock'],
      image_urls: [],
      owner_id: 'demo.owner@smartspace.com',
      owner_name: 'Demo Owner',
      owner_email: 'demo.owner@smartspace.com',
      owner_phone: '+91 9876543210',
      status: 'pending',
      submitted_at: new Date().toISOString(),
      document_urls: {
        gst_certificate: 'demo-gst.pdf',
        property_papers: 'demo-property.pdf',
        fire_certificate: 'demo-fire.pdf'
      },
      ocr_results: {
        gst_certificate: {
          text: 'GST Certificate - Valid Document',
          confidence: 0.95,
          is_valid: true,
          anomalies: []
        },
        property_papers: {
          text: 'Property Ownership Document - Valid',
          confidence: 0.92,
          is_valid: true,
          anomalies: []
        },
        fire_certificate: {
          text: 'Fire Safety Certificate - Valid',
          confidence: 0.89,
          is_valid: true,
          anomalies: []
        }
      }
    }
  ];
  
  localStorage.setItem('demo-submissions', JSON.stringify(testSubmissions));
  console.log('Created test submission data');
}

console.log('=== TEST COMPLETE ===');