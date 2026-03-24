import fs from 'fs';
import csv from 'csv-parser';

// This file processes the Maharashtra_Warehouse_Dataset_50000.csv file
// and converts it into a format usable by our application

export interface RawWarehouseData {
  'Warehouse Name': string;
  'Warehouse Licence Number': string;
  'Warehouse Address': string;
  'District': string;
  'City': string;
  'State': string;
  'Capacity (MT)': string;
  'Registration Date': string;
  'Licence Valid Upto': string;
  'Owner Name': string;
  'Contact Number': string;
  'Micro Rental Spaces': string;
  'Owner Email': string;
  'Pricing (INR/sqft/month)': string;
  'Warehouse Type': string;
  'Total Size (sqft)': string;
}

export interface ProcessedWarehouseData {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
  state: string;
  capacity: number;
  registrationDate: string;
  licenseValidUpto: string;
  ownerName: string;
  contactNumber: string;
  microRentalSpaces: number;
  ownerEmail: string;
  pricing: number;
  warehouseType: string;
  totalSize: number;
  // Additional computed fields
  occupancy: number;
  rating: number;
  reviews: number;
  amenities: string[];
  status: string;
  image: string;
  description?: string;
}

// Function to generate random amenities based on warehouse type
function generateAmenities(warehouseType: string): string[] {
  const baseAmenities = ['24/7 Security', 'Loading Dock', 'Parking Area'];
  const typeSpecificAmenities: { [key: string]: string[] } = {
    'Zepto Dark Store': ['Climate Control', 'Rapid Dispatch System', 'E-commerce Integration'],
    'Pharma Cold Chain': ['Temperature Control', 'Humidity Control', 'FDA Certified', 'Pharmaceutical Grade'],
    'Industrial Logistics Park': ['Heavy Machinery Access', 'Rail Connectivity', 'Container Storage'],
    'Automobile Spare Storage': ['Anti-Theft System', 'Parts Cataloging', 'Inventory Management'],
    'Textile Warehouse': ['Dust Control', 'Fabric Protection', 'Quality Inspection Area'],
    'Food Storage': ['FSSAI Certified', 'Pest Control', 'Cold Storage', 'Hygienic Environment'],
    'General Storage': ['Flexible Spacing', 'Multi-Purpose Areas', 'Easy Access']
  };

  const specificAmenities = typeSpecificAmenities[warehouseType] || typeSpecificAmenities['General Storage'];
  return [...baseAmenities, ...specificAmenities];
}

// Function to generate warehouse image based on type
function generateImage(warehouseType: string): string {
  const imageMap: { [key: string]: string } = {
    'Zepto Dark Store': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'Pharma Cold Chain': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80',
    'Industrial Logistics Park': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'Automobile Spare Storage': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80',
    'Textile Warehouse': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80',
    'Food Storage': 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80'
  };
  
  return imageMap[warehouseType] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80';
}

// Function to convert raw CSV data to processed warehouse data
export function processWarehouseData(rawData: RawWarehouseData): ProcessedWarehouseData {
  const capacity = parseInt(rawData['Capacity (MT)']) || 0;
  const totalSize = parseInt(rawData['Total Size (sqft)']) || 0;
  const pricing = parseFloat(rawData['Pricing (INR/sqft/month)']) || 0;
  const microRentalSpaces = parseInt(rawData['Micro Rental Spaces']) || 0;
  
  // Generate synthetic data for fields not in CSV
  const occupancy = Math.random() * 0.4 + 0.5; // 50-90% occupancy
  const rating = Math.random() * 2 + 3; // 3-5 star rating
  const reviews = Math.floor(Math.random() * 50) + 5; // 5-55 reviews
  const status = Math.random() > 0.1 ? 'Active' : 'Pending'; // 90% active
  
  return {
    id: rawData['Warehouse Licence Number'],
    name: rawData['Warehouse Name'],
    address: rawData['Warehouse Address'],
    district: rawData['District'],
    city: rawData['City'],
    state: rawData['State'],
    capacity,
    registrationDate: rawData['Registration Date'],
    licenseValidUpto: rawData['Licence Valid Upto'],
    ownerName: rawData['Owner Name'],
    contactNumber: rawData['Contact Number'],
    microRentalSpaces,
    ownerEmail: rawData['Owner Email'],
    pricing,
    warehouseType: rawData['Warehouse Type'],
    totalSize,
    occupancy: Math.round(occupancy * 100), // Convert to percentage
    rating: Math.round(rating * 10) / 10, // Round to 1 decimal
    reviews,
    amenities: generateAmenities(rawData['Warehouse Type']),
    status,
    image: generateImage(rawData['Warehouse Type']),
    description: `${rawData['Warehouse Type']} facility located in ${rawData['District']}, Maharashtra. Offering ${capacity} MT capacity across ${totalSize.toLocaleString()} sq ft of premium storage space.`
  };
}

// Function to parse CSV file and return processed data
export async function parseWarehouseCSV(filePath: string): Promise<ProcessedWarehouseData[]> {
  return new Promise((resolve, reject) => {
    const results: ProcessedWarehouseData[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: RawWarehouseData) => {
        try {
          const processed = processWarehouseData(data);
          results.push(processed);
        } catch (error) {
          console.error('Error processing warehouse data:', error);
        }
      })
      .on('end', () => {
        console.log(`Successfully processed ${results.length} warehouses from CSV`);
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Export utility functions for use in other modules
export const WarehouseDataProcessor = {
  processWarehouseData,
  parseWarehouseCSV,
  generateAmenities,
  generateImage
};
