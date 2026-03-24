// client/services/mockWarehouseData.ts
import warehouseDataJson from '../data/warehouse-data-small.json';
import { WarehouseData } from '../data/warehouses';

// Interface matching the structure of our JSON file
interface WarehouseDataFile {
  warehouses: WarehouseData[];
  filterOptions: any;
  platformStats: any;
}

// Function to load the JSON data
export const loadWarehouseData = (): WarehouseDataFile => {
  try {
    // Using direct import which is now possible with resolveJsonModule: true
    return warehouseDataJson as WarehouseDataFile;
  } catch (error) {
    console.error('Error loading warehouse data:', error);
    return {
      warehouses: [],
      filterOptions: {},
      platformStats: {}
    };
  }
};
