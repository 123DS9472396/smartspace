export const WAREHOUSE_TYPES = [
  'General Storage',
  'Godown',
  'Gala',
  'Cold Storage',
  'Pharma Storage',
  'Food Storage',
  'Industrial Logistics',
  'E-commerce Fulfillment',
  'Zepto Dark Store',
  'Swiggy Instamart Dark Store',
  'Blinkit Dark Store',
  'Automobile Spare Storage',
  'Textile Storage',
  'Electronics Storage',
  'FMCG Distribution',
  'Agri Warehouse',
  'Hazardous Materials',
  'Temperature Controlled',
  'Bonded Warehouse'
];

export const GOODS_TYPES_BY_WAREHOUSE: Record<string, string[]> = {
  'General Storage': ['General Goods', 'FMCG', 'Household Items', 'Apparel', 'Footwear', 'Electronics', 'Packaging', 'Furniture', 'Books'],
  'Godown': ['Grains', 'Cereals', 'Raw Materials', 'Construction Materials'],
  'Gala': ['Small Inventory', 'Apparel', 'Footwear', 'Accessories', 'Packaging'],
  'Cold Storage': ['Fruits', 'Vegetables', 'Dairy', 'Frozen Foods', 'Ice Cream', 'Vaccines/Medicines', 'Seafood', 'Meat'],
  'Pharma Storage': ['Medicines', 'Vaccines', 'Medical Devices', 'Healthcare Supplies', 'Lab Samples'],
  'Food Storage': ['Packaged Foods', 'Groceries', 'Beverages', 'Spices', 'Snacks', 'Confectionery'],
  'Industrial Logistics': ['Machinery Parts', 'Tools', 'Raw Materials', 'Heavy Goods', 'Pipes & Metals'],
  'E-commerce Fulfillment': ['FMCG', 'Apparel', 'Footwear', 'Electronics', 'Home Goods', 'Beauty Products'],
  'Zepto Dark Store': ['Groceries', 'Daily Essentials', 'Fruits & Vegetables', 'Dairy', 'Snacks'],
  'Swiggy Instamart Dark Store': ['Groceries', 'Daily Essentials', 'Snacks', 'Beverages', 'Personal Care'],
  'Blinkit Dark Store': ['Groceries', 'Daily Essentials', 'Fruits & Vegetables', 'Dairy', 'Beverages'],
  'Automobile Spare Storage': ['Auto Parts', 'Spare Components', 'Lubricants', 'Accessories', 'Tyres'],
  'Textile Storage': ['Fabric Rolls', 'Garments', 'Home Textiles', 'Yarn'],
  'Electronics Storage': ['Electronics', 'Components', 'Accessories', 'Batteries'],
  'FMCG Distribution': ['FMCG Products', 'Personal Care', 'Household Items', 'Cleaning Supplies'],
  'Agri Warehouse': ['Grains', 'Seeds', 'Fertilizers', 'Agri Produce', 'Pulses'],
  'Hazardous Materials': ['Chemicals', 'Paints', 'Industrial Fluids', 'Solvents'],
  'Temperature Controlled': ['Pharma', 'Dairy', 'Seafood', 'Frozen Foods', 'Biotech'],
  'Bonded Warehouse': ['Import/Export Goods', 'High Value Goods', 'Electronics', 'Luxury Items']
};

export const DEFAULT_GOODS_TYPES = ['General Goods', 'Apparel', 'Footwear', 'Electronics', 'FMCG', 'Packaging'];

export const ALL_GOODS_TYPES = Array.from(
  new Set(Object.values(GOODS_TYPES_BY_WAREHOUSE).flat())
).sort();
