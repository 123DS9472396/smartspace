// Enhanced mock warehouse data using the structure from Maharashtra_Warehouse_Dataset_50000.csv
// This represents a subset of the full 50,000 warehouse dataset

export interface WarehouseData {
  whId: string;
  name: string;
  address: string;
  district: string;
  city: string;
  state: string;
  capacity: number; // in MT
  registrationDate: string;
  licenseValidUpto: string;
  ownerName: string;
  contactNumber: string;
  microRentalSpaces: number;
  ownerEmail: string;
  pricing: number; // INR per sqft per month
  warehouseType: string;
  size: number; // total size in sqft
  // Enhanced fields
  occupancy: number; // percentage 0-100
  rating: number; // 1-5 stars
  reviews: number;
  amenities: string[];
  status: string;
  image: string;
  description?: string;
  ownershipCertificate: string;
}

// Simulated data representing the first 500 warehouses from the CSV dataset
export const maharashtraWarehouses: WarehouseData[] = [
  {
    whId: 'LIC000001',
    name: 'Goswami Group',
    address: '43/86, Acharya Nagar, Near Highway, Aurangabad, Aurangabad City, Maharashtra, 926962',
    district: 'Aurangabad',
    city: 'Aurangabad City',
    state: 'Maharashtra',
    capacity: 19500,
    registrationDate: '2007-10-14',
    licenseValidUpto: '2029-03-26',
    ownerName: 'Zinal Sachdev',
    contactNumber: '+917607477644',
    microRentalSpaces: 100,
    ownerEmail: 'zinal303@gmail.com',
    pricing: 58,
    warehouseType: 'Zepto Dark Store',
    size: 100602,
    occupancy: 75,
    rating: 4.2,
    reviews: 28,
    amenities: ['24/7 Security', 'Loading Dock', 'Climate Control', 'Rapid Dispatch System', 'E-commerce Integration'],
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    description: 'Zepto Dark Store facility located in Aurangabad, Maharashtra. Offering 19500 MT capacity across 100,602 sq ft of premium storage space.',
    ownershipCertificate: 'Verified'
  },
  {
    whId: 'LIC000002',
    name: 'Lala, Shan and Chanda',
    address: '255, Sha Circle, Near Highway, Aurangabad, Aurangabad City, Maharashtra, 940189',
    district: 'Aurangabad',
    city: 'Aurangabad City',
    state: 'Maharashtra',
    capacity: 24500,
    registrationDate: '2005-07-22',
    licenseValidUpto: '2026-09-28',
    ownerName: 'Ishanvi Chadha',
    contactNumber: '+917423556203',
    microRentalSpaces: 95,
    ownerEmail: 'ishanvi217@gmail.com',
    pricing: 96,
    warehouseType: 'Pharma Cold Chain',
    size: 95517,
    occupancy: 82,
    rating: 4.7,
    reviews: 45,
    amenities: ['24/7 Security', 'Loading Dock', 'Temperature Control', 'Humidity Control', 'FDA Certified', 'Pharmaceutical Grade'],
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80',
    description: 'Pharma Cold Chain facility located in Aurangabad, Maharashtra. Offering 24500 MT capacity across 95,517 sq ft of premium storage space.',
    ownershipCertificate: 'Verified'
  },
  {
    whId: 'LIC000003',
    name: 'Majumdar and Sons',
    address: '63/647, Sankaran Path, Near Railway Station, Mumbai, Navi Mumbai, Maharashtra, 067753',
    district: 'Mumbai',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    capacity: 3000,
    registrationDate: '2016-10-04',
    licenseValidUpto: '2029-06-04',
    ownerName: 'Chaaya Bhandari',
    contactNumber: '+917538903294',
    microRentalSpaces: 109,
    ownerEmail: 'chaaya615@gmail.com',
    pricing: 51,
    warehouseType: 'Industrial Logistics Park',
    size: 109375,
    occupancy: 68,
    rating: 4.1,
    reviews: 32,
    amenities: ['24/7 Security', 'Loading Dock', 'Heavy Machinery Access', 'Rail Connectivity', 'Container Storage'],
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    description: 'Industrial Logistics Park facility located in Mumbai, Maharashtra. Offering 3000 MT capacity across 109,375 sq ft of premium storage space.',
    ownershipCertificate: 'Verified'
  },
  {
    whId: 'LIC000004',
    name: 'Hans PLC',
    address: 'H.No. 06, Nadig Chowk, Close to Industrial Area, Solapur, Solapur City, Maharashtra, 089650',
    district: 'Solapur',
    city: 'Solapur City',
    state: 'Maharashtra',
    capacity: 9500,
    registrationDate: '2008-07-26',
    licenseValidUpto: '2028-01-01',
    ownerName: 'Aarna Kunda',
    contactNumber: '+91829905031',
    microRentalSpaces: 100,
    ownerEmail: 'aarna290@gmail.com',
    pricing: 64,
    warehouseType: 'Automobile Spare Storage',
    size: 100871,
    occupancy: 71,
    rating: 4.3,
    reviews: 19,
    amenities: ['24/7 Security', 'Loading Dock', 'Anti-Theft System', 'Parts Cataloging', 'Inventory Management'],
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80',
    description: 'Automobile Spare Storage facility located in Solapur, Maharashtra. Offering 9500 MT capacity across 100,871 sq ft of premium storage space.',
    ownershipCertificate: 'Verified'
  },
  {
    whId: 'LIC000005',
    name: 'Buch LLC',
    address: '019, Dass Zila, Opp. Bus Stand, Solapur, Solapur City, Maharashtra, 433925',
    district: 'Solapur',
    city: 'Solapur City',
    state: 'Maharashtra',
    capacity: 3000,
    registrationDate: '2021-07-10',
    licenseValidUpto: '2029-09-21',
    ownerName: 'Gaurang Chhabra',
    contactNumber: '+914521495030',
    microRentalSpaces: 83,
    ownerEmail: 'gaurang444@gmail.com',
    pricing: 66,
    warehouseType: 'Automobile Spare Storage',
    size: 83517,
    occupancy: 65,
    rating: 4.0,
    reviews: 23,
    amenities: ['24/7 Security', 'Loading Dock', 'Anti-Theft System', 'Parts Cataloging', 'Inventory Management'],
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80',
    description: 'Automobile Spare Storage facility located in Solapur, Maharashtra. Offering 3000 MT capacity across 83,517 sq ft of premium storage space.',
    ownershipCertificate: 'Verified'
  }
  // ... Continue with more warehouse entries based on the CSV data
];

// Generate additional warehouse data programmatically
function generateWarehouseData(): WarehouseData[] {
  const districts = ['Mumbai', 'Pune', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Sangli', 'Satara', 'Thane', 'Raigad'];
  const warehouseTypes = ['Zepto Dark Store', 'Pharma Cold Chain', 'Industrial Logistics Park', 'Automobile Spare Storage', 'Textile Warehouse', 'Food Storage', 'General Storage'];
  const companies = ['Tech Solutions', 'Logistics Hub', 'Storage Pro', 'Warehouse Central', 'Smart Storage', 'Rapid Logistics', 'Premium Storage'];
  
  const generatedWarehouses: WarehouseData[] = [];
  
  for (let i = 6; i <= 150000; i++) {
    const district = districts[Math.floor(Math.random() * districts.length)];
    const warehouseType = warehouseTypes[Math.floor(Math.random() * warehouseTypes.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const capacity = Math.floor(Math.random() * 40000) + 1000; // 1000-40000 MT
    const size = Math.floor(Math.random() * 200000) + 10000; // 10000-200000 sqft
    const pricing = Math.floor(Math.random() * 100) + 25; // 25-125 INR per sqft per month
    
    const amenitiesMap: { [key: string]: string[] } = {
      'Zepto Dark Store': ['24/7 Security', 'Loading Dock', 'Climate Control', 'Rapid Dispatch System', 'E-commerce Integration'],
      'Pharma Cold Chain': ['24/7 Security', 'Loading Dock', 'Temperature Control', 'Humidity Control', 'FDA Certified', 'Pharmaceutical Grade'],
      'Industrial Logistics Park': ['24/7 Security', 'Loading Dock', 'Heavy Machinery Access', 'Rail Connectivity', 'Container Storage'],
      'Automobile Spare Storage': ['24/7 Security', 'Loading Dock', 'Anti-Theft System', 'Parts Cataloging', 'Inventory Management'],
      'Textile Warehouse': ['24/7 Security', 'Loading Dock', 'Dust Control', 'Fabric Protection', 'Quality Inspection Area'],
      'Food Storage': ['24/7 Security', 'Loading Dock', 'FSSAI Certified', 'Pest Control', 'Cold Storage', 'Hygienic Environment'],
      'General Storage': ['24/7 Security', 'Loading Dock', 'Flexible Spacing', 'Multi-Purpose Areas', 'Easy Access']
    };

    const imageMap: { [key: string]: string } = {
      'Zepto Dark Store': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
      'Pharma Cold Chain': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80',
      'Industrial Logistics Park': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
      'Automobile Spare Storage': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80',
      'Textile Warehouse': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80',
      'Food Storage': 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80',
      'General Storage': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'
    };
    
    generatedWarehouses.push({
      whId: `LIC${String(i).padStart(6, '0')}`,
      name: `${company} ${district}`,
      address: `${Math.floor(Math.random() * 999) + 1}, Industrial Area, ${district}, Maharashtra`,
      district,
      city: `${district} City`,
      state: 'Maharashtra',
      capacity,
      registrationDate: new Date(2010 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      licenseValidUpto: new Date(2025 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      ownerName: `Owner ${i}`,
      contactNumber: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      microRentalSpaces: Math.floor(Math.random() * 100) + 20,
      ownerEmail: `owner${i}@example.com`,
      pricing,
      warehouseType,
      size,
      occupancy: Math.floor(Math.random() * 40) + 50, // 50-90%
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
      reviews: Math.floor(Math.random() * 50) + 5,
      amenities: amenitiesMap[warehouseType] || amenitiesMap['General Storage'],
      status: Math.random() > 0.1 ? 'Active' : 'Pending',
      image: imageMap[warehouseType] || imageMap['General Storage'],
      description: `${warehouseType} facility located in ${district}, Maharashtra. Offering ${capacity.toLocaleString()} MT capacity across ${size.toLocaleString()} sq ft of premium storage space.`,
      ownershipCertificate: Math.random() > 0.2 ? 'Verified' : 'Pending'
    });
  }
  
  return generatedWarehouses;
}

// Combine initial data with generated data
export const allMaharashtraWarehouses = [...maharashtraWarehouses, ...generateWarehouseData()];

// Filter options for the warehouse search
export const filterOptions = {
  districts: ['Mumbai', 'Pune', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Sangli', 'Satara', 'Thane', 'Raigad'],
  warehouseTypes: ['Zepto Dark Store', 'Pharma Cold Chain', 'Industrial Logistics Park', 'Automobile Spare Storage', 'Textile Warehouse', 'Food Storage', 'General Storage'],
  capacityRanges: [
    { label: '1K - 5K MT', min: 1000, max: 5000 },
    { label: '5K - 10K MT', min: 5000, max: 10000 },
    { label: '10K - 20K MT', min: 10000, max: 20000 },
    { label: '20K - 40K MT', min: 20000, max: 40000 },
    { label: '40K+ MT', min: 40000, max: 100000 }
  ],
  priceRanges: [
    { label: '₹25 - 50', min: 25, max: 50 },
    { label: '₹50 - 75', min: 50, max: 75 },
    { label: '₹75 - 100', min: 75, max: 100 },
    { label: '₹100 - 125', min: 100, max: 125 },
    { label: '₹125+', min: 125, max: 200 }
  ],
  occupancyRanges: [
    { label: 'High Availability (< 60%)', min: 0, max: 0.6 },
    { label: 'Good Availability (60-80%)', min: 0.6, max: 0.8 },
    { label: 'Limited Availability (> 80%)', min: 0.8, max: 1.0 }
  ],
  certificateTypes: ['Verified', 'Pending', 'FDA Certified', 'FSSAI Certified'],
  statusTypes: ['Active', 'Pending', 'Maintenance']
};

// Platform statistics
export const platformStats = {
  totalWarehouses: allMaharashtraWarehouses.length,
  totalCapacity: allMaharashtraWarehouses.reduce((sum, w) => sum + w.capacity, 0),
  totalArea: allMaharashtraWarehouses.reduce((sum, w) => sum + w.size, 0),
  averageOccupancy: allMaharashtraWarehouses.reduce((sum, w) => sum + w.occupancy, 0) / allMaharashtraWarehouses.length / 100,
  districtsCount: filterOptions.districts.length,
  verifiedWarehouses: allMaharashtraWarehouses.filter(w => w.ownershipCertificate === 'Verified').length
};

export default {
  maharashtraWarehouses: allMaharashtraWarehouses,
  filterOptions,
  platformStats
};
