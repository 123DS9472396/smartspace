import { MLRecommender } from '../client/hooks/ml-algorithms';

// Create sample warehouses, including one in Thane
const warehouses = [
  {
    id: 'w1',
    name: 'Thane Storage Hub',
    city: 'Thane',
    district: 'Thane',
    total_area: 100000,
    price_per_sqft: 5.5,
    type: 'Industrial logistics parks',
    verified: true,
    amenities: ['loading_dock', 'fencing'],
    image_urls: [],
    document_urls: {},
  },
  {
    id: 'w2',
    name: 'Mumbai Central Warehouse',
    city: 'Mumbai',
    district: 'Mumbai',
    total_area: 120000,
    price_per_sqft: 7.2,
    type: 'General storage',
    verified: false,
    amenities: ['security', 'racks'],
    image_urls: [],
    document_urls: {},
  },
  {
    id: 'w3',
    name: 'Pune Logistics Park',
    city: 'Pune',
    district: 'Pune',
    total_area: 90000,
    price_per_sqft: 4.8,
    type: 'Industrial logistics parks',
    verified: true,
    amenities: ['racks', 'loading_dock'],
    image_urls: [],
    document_urls: {},
  },
  {
    id: 'w4',
    name: 'Navi Mumbai Depot',
    city: 'Navi Mumbai',
    district: 'Thane',
    total_area: 70000,
    price_per_sqft: 5.0,
    type: 'General storage',
    verified: false,
    amenities: ['fencing'],
    image_urls: [],
    document_urls: {},
  }
];

const preferences = {
  district: 'Thane',
  targetPrice: 6.0,
  minAreaSqft: 50000,
  preferredType: 'Industrial logistics parks',
  preferVerified: true,
  preferAvailability: true,
};

(async () => {
  console.log('Running MLRecommender test...');
  const recs = MLRecommender.getRecommendations(warehouses as any, preferences as any, 5);
  console.log('Recommendations:');
  recs.forEach((r: any, i: number) => {
    const w = r.warehouse || r;
    const id = w?.id || 'unknown';
    const name = w?.name || w?.title || 'unnamed';
    const score = (r.similarity_score || r.score || 0).toFixed(3);
    const reasons = r.recommendation_reasons || r.reasons || r.explanations || [];
    console.log(`#${i+1}`, id, name, 'score=', score, 'reasons=', reasons);
  });
})();
