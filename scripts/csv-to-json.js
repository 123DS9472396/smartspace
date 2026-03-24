import fs from 'fs';
import { parse } from 'csv-parse/sync';

// Path to your CSV file
const csvFilePath = './Maharashtra_Warehouse_Dataset_50000.csv';
// Output JSON file path
const jsonOutputPath = './client/data/warehouse-data.json';

// Warehouse images from the original warehouses.ts file
const warehouseImages = [
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80", // Industrial logistics parks
  "https://images.unsplash.com/photo-1601980169411-4c0d37967c2e?w=800&q=80", // Multi-modal logistics hubs
  "https://images.unsplash.com/photo-1553864250-05b20249ee6c?w=800&q=80", // FMCG distribution centers
  "https://images.unsplash.com/photo-1565610222536-ef2bdc4a7fd2?w=800&q=80", // Cold chain storage facilities
  "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80", // Agri-commodity specialized warehouses
  "https://images.unsplash.com/photo-1590856029826-c7d73bb48fa2?w=800&q=80", // General storage
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80", // Cold storage
  "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=800&q=80", // Agricultural warehouse
  "https://images.unsplash.com/photo-1573164713712-03790a178651?w=800&q=80", // APMC storage
  "https://images.unsplash.com/photo-1597149758012-c8d5b55d1343?w=800&q=80", // Government warehouse
];

// Get image based on warehouse type
const getImageForType = (type) => {
  const typeIndex = {
    'Industrial logistics parks': 0,
    'Multi-modal logistics hubs': 1,
    'FMCG distribution centers': 2,
    'Cold chain storage facilities': 3,
    'Agri-commodity specialized warehouses': 4,
    'Zepto Dark Store': 5,
    'Pharma Cold Chain': 6,
    'Automobile Spare Storage': 7
  };
  
  return warehouseImages[typeIndex[type] || 5];
};

// Generate amenities based on warehouse type and capacity
const getAmenities = (capacity, warehouseType, certificate) => {
  const baseAmenities = ["24/7 Security", "Loading Dock"];
  
  if (certificate === 'Verified') {
    baseAmenities.push("Certified Facility", "Insurance Coverage");
  }
  
  if (capacity > 10000) {
    baseAmenities.push("Large Scale Storage", "Heavy Machinery Support");
  }
  
  if (warehouseType.includes('Cold chain')) {
    baseAmenities.push("Temperature Control", "Refrigeration", "Climate Monitoring");
  }
  
  if (warehouseType.includes('Agri-commodity')) {
    baseAmenities.push("Grain Storage", "Pest Control", "Quality Testing", "Fumigation");
  }
  
  if (warehouseType.includes('FMCG')) {
    baseAmenities.push("Fast Moving Goods", "Inventory Management", "Quick Dispatch");
  }
  
  if (warehouseType.includes('Industrial')) {
    baseAmenities.push("Industrial Equipment", "Power Backup", "Fire Safety");
  }
  
  if (warehouseType.includes('Multi-modal')) {
    baseAmenities.push("Rail Access", "Road Connectivity", "Intermodal Transfer");
  }

  if (warehouseType.includes('Pharma')) {
    baseAmenities.push("Temperature-Controlled", "Secure Storage", "Regulatory Compliance");
  }

  if (warehouseType.includes('Automobile')) {
    baseAmenities.push("Parts Organization", "Inventory Tracking", "Security Systems");
  }

  if (warehouseType.includes('Zepto')) {
    baseAmenities.push("Quick Access", "Urban Location", "24/7 Operations");
  }
  
  if (capacity > 20000) {
    baseAmenities.push("Bulk Storage", "Advanced Security", "Professional Management");
  }
  
  return baseAmenities.slice(0, Math.min(8, baseAmenities.length));
};

// Generate description based on warehouse details
const generateDescription = (warehouse) => {
  const type = warehouse.warehouseType?.toLowerCase() || "storage";
  const district = warehouse.district;
  const capacity = warehouse.capacity || 0;
  const occupancy = warehouse.occupancy || 0;
  
  const availabilityText = occupancy < 0.3 ? "excellent availability" : 
                          occupancy < 0.7 ? "good availability" : "limited availability";
  
  return `Professional ${type} facility in ${district} with ${capacity.toLocaleString()} MT capacity. Currently showing ${availabilityText} with modern infrastructure and reliable operations. Strategic location with excellent connectivity for efficient logistics operations.`;
};

// Read and parse the CSV file
try {
  const data = fs.readFileSync(csvFilePath, 'utf8');
  
  const records = parse(data, {
    columns: true,
    skip_empty_lines: true
  });

    const warehouses = records.map((record, index) => {
      // Extract values from the CSV record
      const whName = record['Warehouse Name'];
      const licenceNumber = record['Warehouse Licence Number'];
      const address = record['Warehouse Address']?.replace(/"/g, '') || '';
      const district = record['District'];
      const city = record['City'];
      const state = record['State'];
      const capacity = parseInt(record['Capacity (MT)']) || 0;
      const registrationDate = record['Registration Date'];
      const registrationValidUpto = record['Licence Valid Upto'];
      const ownerName = record['Owner Name'];
      const contactNo = record['Contact Number'];
      const microRentalSpaces = parseInt(record['Micro Rental Spaces']) || 0;
      const emailId = record['Owner Email'];
      const pricing = parseFloat(record['Pricing (INR/sqft/month)']) || 0;
      const warehouseType = record['Warehouse Type'];
      const size = parseInt(record['Total Size (sqft)']) || 0;

      // Generate derived values
      const whId = `WH${(index + 1000000).toString()}`;
      const status = 'Active';
      const remarks = '';
      const occupancy = Math.round((Math.random() * 70 + 30)) / 100; // Random occupancy between 0.3 and 1.0
      const ownershipCertificate = Math.random() > 0.5 ? 'Verified' : 'Unverified';
      
      // Extract pincode from address or generate a random one
      const pincodeMatch = address.match(/(\d{6})/);
      const pincode = pincodeMatch ? pincodeMatch[1] : Math.floor(100000 + Math.random() * 900000).toString();
      
      // Generate rating based on various factors
      const baseRating = 3.5;
      const certificateBonus = ownershipCertificate === 'Verified' ? 0.8 : 0;
      const statusBonus = status === 'Active' ? 0.5 : 0;
      const occupancyBonus = occupancy > 0.5 ? 0.4 : 0.2;
      const typeBonus = warehouseType.includes('Cold chain') ? 0.3 : 0;
      
      const rating = Math.min(5.0, baseRating + certificateBonus + statusBonus + occupancyBonus + typeBonus);
      
      // Generate reviews count based on capacity and rating
      const reviews = Math.floor((capacity / 1000) * rating * (Math.random() * 3 + 1));
      
      // Build warehouse data object
      const warehouseData = {
        whId,
        name: whName,
        address,
        district,
        city,
        state,
        capacity,
        registrationDate,
        registrationValidUpto,
        ownerName,
        contactNo,
        status,
        remarks,
        occupancy,
        microRentalSpaces,
        emailId,
        pricing,
        warehouseType,
        ownershipCertificate,
        pincode,
        licenceNumber,
        size,
        image: getImageForType(warehouseType),
        amenities: getAmenities(capacity, warehouseType, ownershipCertificate),
        rating: Math.round(rating * 10) / 10,
        reviews: Math.max(1, reviews),
        pricePerMT: Math.round((pricing * size / capacity) * 100) / 100 || pricing
      };

      // Generate description after warehouse object is created
      warehouseData.description = generateDescription(warehouseData);
      
      return warehouseData;
    });

    // Generate filter options and platform stats
    const filterOptions = {
      districts: [...new Set(warehouses.map(w => w.district))].sort(),
      cities: [...new Set(warehouses.map(w => w.city))].sort(),
      warehouseTypes: [...new Set(warehouses.map(w => w.warehouseType))].sort(),
      capacityRanges: [
        { label: "Small (< 2,000 MT)", min: 0, max: 2000 },
        { label: "Medium (2,000 - 10,000 MT)", min: 2000, max: 10000 },
        { label: "Large (10,000 - 30,000 MT)", min: 10000, max: 30000 },
        { label: "Extra Large (> 30,000 MT)", min: 30000, max: Infinity }
      ],
      priceRanges: [
        { label: "Budget (₹2-5/sqft)", min: 2, max: 5 },
        { label: "Standard (₹5-8/sqft)", min: 5, max: 8 },
        { label: "Premium (₹8+/sqft)", min: 8, max: Infinity }
      ],
      occupancyRanges: [
        { label: "Low Occupancy (< 40%)", min: 0, max: 0.4 },
        { label: "Medium Occupancy (40-70%)", min: 0.4, max: 0.7 },
        { label: "High Occupancy (> 70%)", min: 0.7, max: 1 }
      ],
      certificateTypes: ['Verified', 'Unverified'],
      statusTypes: ['Active', 'Inactive', 'Cancelled']
    };

    const platformStats = {
      totalWarehouses: warehouses.length,
      totalCapacity: warehouses.reduce((sum, w) => sum + w.capacity, 0),
      totalArea: warehouses.reduce((sum, w) => sum + w.size, 0),
      averageOccupancy: warehouses.reduce((sum, w) => sum + w.occupancy, 0) / warehouses.length,
      districtsCount: filterOptions.districts.length,
      citiesCount: filterOptions.cities.length,
      verifiedWarehouses: warehouses.filter(w => w.ownershipCertificate === 'Verified').length
    };

    // Final data structure to be saved
    const outputData = {
      warehouses,
      filterOptions,
      platformStats
    };

    // Write to JSON file
    fs.writeFileSync(jsonOutputPath, JSON.stringify(outputData, null, 2), 'utf8');
    console.log(`Successfully converted CSV to JSON. Saved to ${jsonOutputPath}`);
    console.log(`Processed ${warehouses.length} warehouse records`);
  
} catch (error) {
  console.error(`Error processing CSV: ${error.message}`);
}
