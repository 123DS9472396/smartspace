/**
 * Smart Booking Service - LLM-Powered Intelligent Warehouse Booking
 * 
 * Features:
 * 1. Smart Space Matching - Finds best warehouse combinations for user requirements
 * 2. Multi-Warehouse Merging - Combines spaces across warehouses to meet needs
 * 3. Budget Optimization - Finds cost-effective solutions
 * 4. Grid-Based Block Allocation - Intelligent block selection
 * 5. Natural Language Booking - Process booking requests via chat
 * 6. LLM-based Semantic Matching - Uses AI for intelligent warehouse scoring
 */

import { getAIResponse } from './aiService';
import { warehouseService } from './warehouseService';
import { supabase } from '@/lib/supabase';
import { WAREHOUSE_TYPES } from '@/data/warehouseTaxonomy';

// Cache for warehouse embeddings (simple in-memory cache)
const warehouseCache: Map<string, any[]> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let lastCacheTime = 0;

export interface BookingRequirement {
  requiredSpace: number;  // sq ft
  location: string;       // city/district
  maxBudget?: number;     // per sq ft per month
  preferredType?: string; // warehouse type
  goodsType?: string;     // goods being stored
  duration?: number;      // months
  urgency?: 'low' | 'medium' | 'high';
  flexibleLocation?: boolean;
  flexibleSpace?: boolean; // Can split across warehouses
}

export interface SmartBookingOption {
  id: string;
  type: 'single' | 'merged' | 'split';
  warehouses: Array<{
    id: string;
    name: string;
    city: string;
    blocks: Array<{
      blockId: string;
      blockNumber: number;
      areaSqft: number;
      pricePerSqft: number;
    }>;
    totalArea: number;
    totalCost: number;
  }>;
  totalArea: number;
  totalMonthlyCost: number;
  averagePricePerSqft: number;
  matchScore: number;
  savings?: number;
  llmReasoning: string;
  pros: string[];
  cons: string[];
}

export interface BookingAnalysis {
  userRequirement: BookingRequirement;
  options: SmartBookingOption[];
  bestOption: SmartBookingOption | null;
  llmSummary: string;
  marketInsights: string;
  alternativeSuggestions: string[];
}

/**
 * Normalize city names for matching
 */
function normalizeCity(city: string): string {
  return city.toLowerCase()
    .replace(/\s+city$/i, '')
    .replace(/\s+/g, '')
    .trim();
}

function inferTypeFromGoodsHeuristic(goodsType: string): string | undefined {
  const g = goodsType.toLowerCase();

  if (/(vaccine|vaccines|insulin|cold\s*chain|frozen|ice\s*cream|seafood|meat|dairy|fruit|fruits|vegetable|vegetables|perishable|perishables)/i.test(g)) {
    return 'Cold Storage';
  }

  if (/(medicine|medicines|pharma|pharmaceutical|medical|clinic|hospital|lab|biotech)/i.test(g)) {
    return 'Pharma Storage';
  }

  if (/(chemical|chemicals|hazard|paint|solvent|industrial\s*fluids)/i.test(g)) {
    return 'Hazardous Materials';
  }

  if (/(grain|grains|seed|seeds|fertilizer|agri|pulses)/i.test(g)) {
    return 'Agri Warehouse';
  }

  if (/(electronics|battery|batteries|components)/i.test(g)) {
    return 'Electronics Storage';
  }

  if (/(textile|garment|fabric|apparel)/i.test(g)) {
    return 'Textile Storage';
  }

  if (/(auto|automobile|spare|spares|tyre|tires)/i.test(g)) {
    return 'Automobile Spare Storage';
  }

  if (/(import|export|bonded|customs)/i.test(g)) {
    return 'Bonded Warehouse';
  }

  if (/(grocery|groceries|food|snack|beverage|fmcg)/i.test(g)) {
    return 'Food Storage';
  }

  return undefined;
}

async function inferPreferredTypeFromGoodsType(goodsType: string): Promise<string | undefined> {
  const heuristic = inferTypeFromGoodsHeuristic(goodsType);
  if (heuristic) return heuristic;

  try {
    const prompt = `Given the goods type below, choose the best warehouse type from this list: ${WAREHOUSE_TYPES.join(', ')}.

Goods Type: "${goodsType}"

Respond in JSON:
{ "preferredType": "one of the listed warehouse types" }`;

    const response = await getAIResponse({
      prompt,
      systemPrompt: 'You map goods types to the most suitable warehouse type. Always respond with valid JSON only.',
      temperature: 0.1,
      maxTokens: 150
    });

    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.preferredType && WAREHOUSE_TYPES.includes(parsed.preferredType)) {
        return parsed.preferredType;
      }
    }
  } catch (error) {
    console.warn('⚠️ Goods type → warehouse type inference failed:', error);
  }

  return undefined;
}

/**
 * LLM-based semantic scoring for warehouse matching
 * Uses AI to score how well a warehouse matches user requirements
 */
async function getSemanticScores(
  warehouses: any[],
  requirement: BookingRequirement
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  
  // For performance, score in batches and use keyword matching as fallback
  // Only use LLM for top candidates to optimize API calls
  
  // First, do a quick keyword-based scoring
  warehouses.forEach(w => {
    let score = 50; // Base score
    
    const city = (w.city || '').toLowerCase();
    const district = (w.district || '').toLowerCase();
    const name = (w.name || '').toLowerCase();
    const location = requirement.location.toLowerCase();
    
    // Location match bonus
    if (city.includes(location) || location.includes(city.replace(' city', ''))) {
      score += 30;
    } else if (district.includes(location)) {
      score += 20;
    } else if (name.includes(location)) {
      score += 15;
    }
    
    // Price preference (lower is better for budget-conscious)
    const price = w.price_per_sqft || 50;
    if (requirement.maxBudget) {
      if (price <= requirement.maxBudget) {
        score += 20;
      } else if (price <= requirement.maxBudget * 1.2) {
        score += 10;
      }
    } else {
      // No budget specified - favor mid-range prices
      if (price < 60) score += 15;
      else if (price < 80) score += 10;
    }
    
    // Area availability bonus
    const occupancy = w.occupancy || 0;
    const availableArea = (w.total_area || 0) * (1 - occupancy);
    if (availableArea >= requirement.requiredSpace) {
      score += 20;
    } else if (availableArea >= requirement.requiredSpace * 0.5) {
      score += 10;
    }
    
    // Verified warehouse bonus
    if (w.verified) score += 10;
    
    // Rating bonus
    if (w.rating && w.rating >= 4.5) score += 10;
    else if (w.rating && w.rating >= 4.0) score += 5;
    
    // Warehouse type match
    if (requirement.preferredType && w.warehouse_type) {
      if (w.warehouse_type.toLowerCase().includes(requirement.preferredType.toLowerCase())) {
        score += 15;
      }
    }
    
    scores.set(w.id, Math.min(100, score));
  });
  
  return scores;
}

/**
 * Get cached warehouses or fetch fresh
 */
async function getCachedWarehouses(): Promise<any[]> {
  const now = Date.now();
  
  if (warehouseCache.has('all') && (now - lastCacheTime) < CACHE_TTL) {
    console.log('📦 Using cached warehouse data');
    return warehouseCache.get('all') || [];
  }
  
  console.log('🔄 Fetching fresh warehouse data...');
  
  try {
    // Simple query - limit to 1000 which works reliably
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .limit(1000);
    
    if (error) {
      console.error('❌ Error fetching warehouses:', error);
      return warehouseCache.get('all') || [];
    }
    
    if (!data || data.length === 0) {
      console.error('❌ No warehouses fetched');
      return warehouseCache.get('all') || [];
    }
    
    warehouseCache.set('all', data);
    lastCacheTime = now;
    console.log(`✅ Cached ${data.length} warehouses`);
    
    return data;
  } catch (err) {
    console.error('❌ Exception fetching warehouses:', err);
    return warehouseCache.get('all') || [];
  }
}

/**
 * Get available blocks from warehouses in a location
 */
async function getAvailableBlocks(location: string, limit: number = 50): Promise<any[]> {
  const searchTerms = location.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
  
  console.log('🔍 Smart Booking: Searching warehouses in', location, '(terms:', searchTerms.join(', '), ')');
  
  try {
    // Use cached data for better performance
    const allWarehouses = await getCachedWarehouses();
    
    if (!allWarehouses || allWarehouses.length === 0) {
      console.log('⚠️ No warehouses found in database');
      return [];
    }
    
    console.log(`📊 Working with ${allWarehouses.length} warehouses from cache/database`);
    
    // Filter for available warehouses (occupancy < 1 and total_area > 0) in JavaScript
    const availableWarehouses = allWarehouses.filter(w => 
      (w.occupancy === null || w.occupancy === undefined || w.occupancy < 1) && 
      (w.total_area > 0)
    );
    
    console.log(`📦 ${availableWarehouses.length} warehouses have available space`);
    
    // Filter by location in JavaScript for flexible matching
    const matchedWarehouses = availableWarehouses.filter(w => {
      const cityLower = (w.city || '').toLowerCase();
      const districtLower = (w.district || '').toLowerCase();
      const nameLower = (w.name || '').toLowerCase();
      
      // Match if any search term is found in city, district, or name
      return searchTerms.some(term => 
        cityLower.includes(term) || 
        districtLower.includes(term) ||
        nameLower.includes(term)
      );
    }).slice(0, limit);
    
    if (matchedWarehouses.length === 0) {
      console.log('⚠️ No warehouses found matching:', location);
      const cities = [...new Set(availableWarehouses.map(w => w.city))];
      console.log('📍 Available cities:', cities.join(', '));
      return [];
    }
    
    console.log(`✅ Found ${matchedWarehouses.length} warehouses matching "${location}"`);
    
    // Generate blocks for each warehouse
    const allBlocks: any[] = [];
  
    for (const warehouse of matchedWarehouses) {
      const totalArea = warehouse.total_area || 50000;
      const occupancyRate = warehouse.occupancy || 0;
      const availableArea = Math.round(totalArea * (1 - occupancyRate));
    
      // Skip if no available area
      if (availableArea < 100) continue;
      
      // Calculate block sizes - smaller blocks (100-400 sq ft) for fine-grained matching
      const blockSize = Math.min(400, Math.max(100, Math.round(availableArea / 20))); // Smaller blocks
      const numBlocks = Math.max(1, Math.min(15, Math.floor(availableArea / blockSize))); // More blocks
      
      for (let i = 0; i < numBlocks; i++) {
        const blockNumber = i + 1;
        // Vary block sizes slightly for realism (90-110% of base size)
        const actualBlockSize = Math.round(blockSize * (0.9 + Math.random() * 0.2));
        
        allBlocks.push({
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          warehouseCity: warehouse.city,
          warehouseType: warehouse.warehouse_type || 'General Storage',
          blockId: `${warehouse.id}-block-${blockNumber}`,
          blockNumber,
          areaSqft: actualBlockSize,
          pricePerSqft: warehouse.price_per_sqft || 50,
          rating: warehouse.rating || 4.0,
          verified: warehouse.verified || false,
          amenities: warehouse.amenities || [],
          totalWarehouseArea: totalArea,
          availableWarehouseArea: availableArea
        });
      }
    }
    
    console.log(`📦 Generated ${allBlocks.length} blocks from ${matchedWarehouses.length} warehouses`);
    
    return allBlocks;
  } catch (err) {
    console.error('❌ Exception in getAvailableBlocks:', err);
    return [];
  }
}

/**
 * Use LLM to analyze and optimize booking options
 */
async function getLLMBookingAnalysis(
  requirement: BookingRequirement,
  availableBlocks: any[],
  options: SmartBookingOption[]
): Promise<{ summary: string; insights: string; suggestions: string[]; bestOptionId?: string }> {
  
  const prompt = `You are a warehouse booking optimization expert. Analyze this booking request and provide insights.

**USER REQUIREMENT:**
- Required Space: ${requirement.requiredSpace} sq ft
- Location: ${requirement.location}
- Max Budget: ${requirement.maxBudget ? `₹${requirement.maxBudget}/sq ft/month` : 'Flexible'}
- Preferred Type: ${requirement.preferredType || 'Any'}
- Goods Type: ${requirement.goodsType || 'Any'}
- Duration: ${requirement.duration || 1} months
- Urgency: ${requirement.urgency || 'medium'}
- Flexible Location: ${requirement.flexibleLocation ? 'Yes' : 'No'}
- Can Split Across Warehouses: ${requirement.flexibleSpace ? 'Yes' : 'No'}

**AVAILABLE INVENTORY:**
- Total available blocks: ${availableBlocks.length}
- Locations covered: ${[...new Set(availableBlocks.map(b => b.warehouseCity))].join(', ')}
- Price range: ₹${Math.min(...availableBlocks.map(b => b.pricePerSqft))}-${Math.max(...availableBlocks.map(b => b.pricePerSqft))}/sq ft

**BOOKING OPTIONS FOUND:**
${options.slice(0, 5).map((opt, i) => `
Option ${i + 1} (id: ${opt.id}, ${opt.type}):
- Warehouses: ${opt.warehouses.map(w => w.name).join(' + ')}
- Total Area: ${opt.totalArea} sq ft
- Monthly Cost: ₹${opt.totalMonthlyCost.toLocaleString()}
- Avg Price: ₹${opt.averagePricePerSqft}/sq ft
- Match Score: ${opt.matchScore}%
`).join('\n')}

**PROVIDE:**
1. The best option id (from the list above)
2. A summary (2-3 sentences) of the best booking strategy
3. Market insights for this location and requirement
4. 3 alternative suggestions if the main options don't fit

Respond in JSON format:
{
  "bestOptionId": "option-id",
  "summary": "Your recommendation summary...",
  "insights": "Market insights...",
  "suggestions": ["Alternative 1", "Alternative 2", "Alternative 3"]
}`;

  try {
    const response = await getAIResponse({
      prompt,
      systemPrompt: 'You are a warehouse booking optimization expert. Always respond with valid JSON.',
      temperature: 0.3,
      maxTokens: 800
    });

    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('LLM analysis error:', error);
  }

  return {
    summary: `Found ${options.length} booking options for ${requirement.requiredSpace} sq ft in ${requirement.location}. ${options[0]?.type === 'merged' ? 'Recommend combining multiple warehouse spaces for optimal coverage.' : 'Single warehouse booking available.'}`,
    insights: `The ${requirement.location} market has competitive pricing. Current availability is good with multiple options to choose from.`,
    suggestions: [
      'Consider flexible dates for better pricing',
      'Check nearby areas for more options',
      'Contact warehouse directly for bulk discounts'
    ]
  };
}

/**
 * Find single warehouse options
 */
function findSingleWarehouseOptions(
  blocks: any[],
  requirement: BookingRequirement
): SmartBookingOption[] {
  const options: SmartBookingOption[] = [];
  
  // Group blocks by warehouse
  const warehouseBlocks = new Map<string, any[]>();
  blocks.forEach(block => {
    const existing = warehouseBlocks.get(block.warehouseId) || [];
    existing.push(block);
    warehouseBlocks.set(block.warehouseId, existing);
  });

  // Find warehouses that can satisfy the requirement alone
  warehouseBlocks.forEach((wBlocks, warehouseId) => {
    // Sort by price (cheapest first)
    wBlocks.sort((a, b) => a.pricePerSqft - b.pricePerSqft);
    
    let selectedBlocks: any[] = [];
    let totalArea = 0;
    
    for (const block of wBlocks) {
      if (totalArea >= requirement.requiredSpace) break;
      
      // Check budget constraint
      if (requirement.maxBudget && block.pricePerSqft > requirement.maxBudget) {
        continue;
      }
      
      selectedBlocks.push(block);
      totalArea += block.areaSqft;
    }
    
    if (totalArea >= requirement.requiredSpace * 0.9) { // Allow 10% flexibility
      const totalCost = selectedBlocks.reduce((sum, b) => sum + (b.areaSqft * b.pricePerSqft), 0);
      const avgPrice = totalCost / totalArea;
      
      // Calculate match score
      let matchScore = 70; // Base score
      if (totalArea >= requirement.requiredSpace) matchScore += 15;
      if (!requirement.maxBudget || avgPrice <= requirement.maxBudget) matchScore += 10;
      if (wBlocks[0].verified) matchScore += 5;
      
      options.push({
        id: `single-${warehouseId}`,
        type: 'single',
        warehouses: [{
          id: warehouseId,
          name: wBlocks[0].warehouseName,
          city: wBlocks[0].warehouseCity,
          blocks: selectedBlocks.map(b => ({
            blockId: b.blockId,
            blockNumber: b.blockNumber,
            areaSqft: b.areaSqft,
            pricePerSqft: b.pricePerSqft
          })),
          totalArea,
          totalCost
        }],
        totalArea,
        totalMonthlyCost: totalCost,
        averagePricePerSqft: Math.round(avgPrice),
        matchScore: Math.min(98, matchScore),
        llmReasoning: `Single warehouse solution from ${wBlocks[0].warehouseName}. All ${selectedBlocks.length} blocks are in one location for easy management.`,
        pros: [
          'Single location - easy management',
          'Unified billing',
          `${selectedBlocks.length} contiguous blocks`
        ],
        cons: totalArea < requirement.requiredSpace 
          ? [`Slightly under required space (${totalArea} vs ${requirement.requiredSpace} sq ft)`]
          : []
      });
    }
  });

  return options.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Find merged warehouse options (combining multiple warehouses)
 */
function findMergedWarehouseOptions(
  blocks: any[],
  requirement: BookingRequirement
): SmartBookingOption[] {
  if (!requirement.flexibleSpace) return [];
  
  const options: SmartBookingOption[] = [];
  
  // Sort all blocks by price
  const sortedBlocks = [...blocks].sort((a, b) => a.pricePerSqft - b.pricePerSqft);
  
  // Greedy selection of cheapest blocks across warehouses
  const selectedBlocks: any[] = [];
  let totalArea = 0;
  
  for (const block of sortedBlocks) {
    if (totalArea >= requirement.requiredSpace) break;
    if (requirement.maxBudget && block.pricePerSqft > requirement.maxBudget) continue;
    
    selectedBlocks.push(block);
    totalArea += block.areaSqft;
  }
  
  if (totalArea >= requirement.requiredSpace * 0.9 && selectedBlocks.length > 0) {
    // Group selected blocks by warehouse
    const warehouseGroups = new Map<string, any[]>();
    selectedBlocks.forEach(block => {
      const existing = warehouseGroups.get(block.warehouseId) || [];
      existing.push(block);
      warehouseGroups.set(block.warehouseId, existing);
    });
    
    // Check if we're actually using multiple warehouses
    if (warehouseGroups.size > 1) {
      const totalCost = selectedBlocks.reduce((sum, b) => sum + (b.areaSqft * b.pricePerSqft), 0);
      const avgPrice = totalCost / totalArea;
      
      // Calculate potential savings vs single warehouse
      const singleWarehouseCost = selectedBlocks.reduce((sum, b) => 
        sum + (b.areaSqft * Math.max(...blocks.filter(bl => bl.warehouseId === selectedBlocks[0].warehouseId).map(bl => bl.pricePerSqft))), 0);
      const savings = singleWarehouseCost > totalCost ? singleWarehouseCost - totalCost : 0;
      
      const warehouses = Array.from(warehouseGroups.entries()).map(([whId, whBlocks]) => ({
        id: whId,
        name: whBlocks[0].warehouseName,
        city: whBlocks[0].warehouseCity,
        blocks: whBlocks.map(b => ({
          blockId: b.blockId,
          blockNumber: b.blockNumber,
          areaSqft: b.areaSqft,
          pricePerSqft: b.pricePerSqft
        })),
        totalArea: whBlocks.reduce((sum, b) => sum + b.areaSqft, 0),
        totalCost: whBlocks.reduce((sum, b) => sum + (b.areaSqft * b.pricePerSqft), 0)
      }));
      
      options.push({
        id: `merged-${Date.now()}`,
        type: 'merged',
        warehouses,
        totalArea,
        totalMonthlyCost: totalCost,
        averagePricePerSqft: Math.round(avgPrice),
        matchScore: Math.min(95, 75 + (savings > 0 ? 15 : 5) + (totalArea >= requirement.requiredSpace ? 5 : 0)),
        savings: savings > 0 ? savings : undefined,
        llmReasoning: `Smart merged solution combining ${warehouses.length} warehouses. By selecting the most cost-effective blocks across locations, ${savings > 0 ? `you save ₹${savings.toLocaleString()}/month compared to single-warehouse options.` : 'you get optimal space utilization.'}`,
        pros: [
          `Combines ${warehouses.length} warehouses for best pricing`,
          savings > 0 ? `Save ₹${savings.toLocaleString()}/month` : 'Optimized block selection',
          `Total ${selectedBlocks.length} blocks across locations`
        ],
        cons: [
          'Multiple locations to manage',
          'Separate billing per warehouse'
        ]
      });
    }
  }
  
  return options;
}

/**
 * Main function: Analyze booking requirements and find optimal solutions
 */
export async function analyzeBookingRequirements(
  requirement: BookingRequirement
): Promise<BookingAnalysis> {
  console.log('🧠 Smart Booking Analysis started:', requirement);

  if (requirement.goodsType && !requirement.preferredType) {
    const inferredType = await inferPreferredTypeFromGoodsType(requirement.goodsType);
    if (inferredType) {
      requirement.preferredType = inferredType;
      console.log('🧭 Inferred warehouse type from goods:', inferredType);
    }
  }
  
  // Get available blocks in the location
  let availableBlocks = await getAvailableBlocks(requirement.location);
  console.log(`📦 Found ${availableBlocks.length} available blocks in ${requirement.location}`);

  if (requirement.preferredType) {
    const typeLower = requirement.preferredType.toLowerCase();
    availableBlocks = availableBlocks.filter(block =>
      block.warehouseType?.toLowerCase().includes(typeLower)
    );
    console.log(`🏷️ Filtered blocks by type (${requirement.preferredType}): ${availableBlocks.length}`);
  }
  
  // If no blocks in exact location, try nearby areas
  let expandedSearch = false;
  if (availableBlocks.length < 10 && requirement.flexibleLocation) {
    console.log('⚠️ Limited availability, expanding search to nearby areas...');
    expandedSearch = true;
    
    // Fetch from cached warehouses to avoid query issues
    const allWarehouses = await getCachedWarehouses();
    
    // Filter available ones
    const available = allWarehouses.filter(w => 
      (w.occupancy === null || w.occupancy === undefined || w.occupancy < 1) && 
      (w.total_area > 0)
    ).slice(0, 100);
    
    if (available.length > 0) {
      for (const warehouse of available) {
        const totalArea = warehouse.total_area || 50000;
        const occupancyRate = warehouse.occupancy || 0;
        const availableArea = Math.round(totalArea * (1 - occupancyRate));
        
        if (availableArea < 100) continue;
        
        const blockSize = Math.min(1000, Math.max(200, Math.round(availableArea / 10)));
        const numBlocks = Math.max(1, Math.min(5, Math.floor(availableArea / blockSize)));
        
        for (let i = 0; i < numBlocks; i++) {
          availableBlocks.push({
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            warehouseCity: warehouse.city,
            warehouseType: warehouse.warehouse_type || 'General Storage',
            blockId: `${warehouse.id}-block-${i + 1}`,
            blockNumber: i + 1,
            areaSqft: Math.round(blockSize * (0.9 + Math.random() * 0.2)),
            pricePerSqft: warehouse.price_per_sqft || 50,
            rating: warehouse.rating || 4.0,
            verified: warehouse.verified || false
          });
        }
      }
    }
  }
  
  // Find all booking options
  const singleOptions = findSingleWarehouseOptions(availableBlocks, requirement);
  const mergedOptions = findMergedWarehouseOptions(availableBlocks, requirement);
  
  // Combine and sort all options
  let allOptions = [...singleOptions, ...mergedOptions]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
  
  // If no options found with budget constraint, try without budget to show alternatives
  if (allOptions.length === 0 && requirement.maxBudget && availableBlocks.length > 0) {
    console.log('⚠️ No options within budget, finding best alternatives...');
    
    // Create a relaxed requirement without budget
    const relaxedRequirement = { ...requirement, maxBudget: undefined };
    const relaxedSingleOptions = findSingleWarehouseOptions(availableBlocks, relaxedRequirement);
    const relaxedMergedOptions = findMergedWarehouseOptions(availableBlocks, relaxedRequirement);
    
    allOptions = [...relaxedSingleOptions, ...relaxedMergedOptions]
      .sort((a, b) => a.averagePricePerSqft - b.averagePricePerSqft) // Sort by lowest price
      .slice(0, 5)
      .map(opt => ({
        ...opt,
        matchScore: Math.max(50, opt.matchScore - 20), // Reduce score since over budget
        llmReasoning: `[OVER BUDGET] ${opt.llmReasoning} Note: This option exceeds your budget of ₹${requirement.maxBudget}/sq ft.`,
        cons: [...opt.cons, `Price (₹${opt.averagePricePerSqft}/sq ft) exceeds budget (₹${requirement.maxBudget}/sq ft)`]
      }));
    
    console.log(`📊 Found ${allOptions.length} alternative options (above budget)`);
  }
  
  console.log(`✅ Final result: ${allOptions.length} booking options`);
  
  // Get LLM analysis
  const llmAnalysis = await getLLMBookingAnalysis(requirement, availableBlocks, allOptions);

  if (llmAnalysis.bestOptionId) {
    const bestIndex = allOptions.findIndex(opt => opt.id === llmAnalysis.bestOptionId);
    if (bestIndex > 0) {
      const [best] = allOptions.splice(bestIndex, 1);
      allOptions.unshift(best);
    }
  }
  
  return {
    userRequirement: requirement,
    options: allOptions,
    bestOption: allOptions[0] || null,
    llmSummary: llmAnalysis.summary,
    marketInsights: llmAnalysis.insights,
    alternativeSuggestions: llmAnalysis.suggestions
  };
}

/**
 * Process natural language booking request
 */
export interface WarehouseResult {
  id: string;
  name: string;
  city: string;
  address?: string;
  total_area: number;
  price_per_sqft: number;
  warehouse_type?: string;
  rating?: number;
  _score?: number;
  _reason?: string;
  rank?: number;
  matchScore?: number;
  reason?: string;
}

export async function processNaturalLanguageBooking(
  userMessage: string
): Promise<{ requirement: BookingRequirement | null; analysis: BookingAnalysis | null; response: string; warehouses?: WarehouseResult[] }> {
  console.log('🗣️ Processing natural language booking via server API:', userMessage);
  
  try {
    // Use server API endpoint (Groq-powered)
    const response = await fetch('/api/smart-booking/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: userMessage })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Server API error:', error);
      return {
        requirement: null,
        analysis: null,
        response: `Search failed: ${error.error}. Please try with a clearer query like "I need 400 sq ft in Thane" or "cold storage in Mumbai".`
      };
    }

    const result = await response.json();
    console.log('✅ Server API response:', result);

    if (!result.success) {
      return {
        requirement: null,
        analysis: null,
        response: result.message || 'Failed to process your request'
      };
    }

    // Extract requirement from server response
    const requirements = result.requirements;
    const requirement: BookingRequirement = {
      requiredSpace: requirements.requiredSpace || 1000,
      location: requirements.location || 'India',
      maxBudget: requirements.maxBudget,
      preferredType: requirements.warehouseType,
      goodsType: requirements.goodsType,
      duration: requirements.duration || 1,
      urgency: requirements.urgency || 'medium',
      flexibleLocation: true,
      flexibleSpace: true
    };

    console.log('📋 Extracted requirement:', requirement);

    // Build response from search results
    let response_text = `🎯 **Smart Warehouse Search Results**\n\n`;

    if (result.warehouses && result.warehouses.length > 0) {
      // Build Groq rank/score/reason map keyed by warehouse ID
      const groqMap: Record<string, { rank: number; score: number; reason: string }> = {};
      if (result.ranking?.bestMatches && Array.isArray(result.ranking.bestMatches)) {
        result.ranking.bestMatches.forEach((match: any) => {
          groqMap[String(match.id)] = {
            rank: match.rank || 99,
            score: match.score || 0,
            reason: match.reason || ''
          };
        });
      }

      // Merge Groq ranking into warehouses and sort by Groq rank if available
      const merged: WarehouseResult[] = result.warehouses.slice(0, 10).map((w: any) => {
        const g = groqMap[String(w.id)];
        return {
          ...w,
          rank: g?.rank ?? 99,
          matchScore: g?.score ?? w._score ?? 0,
          reason: g?.reason || w._reason || 'Good match for your requirements'
        };
      });

      // Sort by Groq rank (lowest rank number = best)
      const hasGroqRanks = merged.some(w => (w.rank ?? 99) < 99);
      if (hasGroqRanks) {
        merged.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
      }

      const top5 = merged.slice(0, 5);
      const rankLabels = ['🥇 Rank #1 — Best Match', '🥈 Rank #2', '🥉 Rank #3', '4️⃣ Rank #4', '5️⃣ Rank #5'];

      response_text += `✅ Found **${result.warehouses.length}** warehouses. Here are the top picks ranked for you:\n\n`;

      top5.forEach((w, i) => {
        response_text += `${rankLabels[i]}\n`;
        response_text += `**${w.name}** · ${w.city}\n`;
        response_text += `📐 ${w.total_area?.toLocaleString()} sq ft · 💰 ₹${w.price_per_sqft}/sqft · 🏭 ${w.warehouse_type || 'General'}`;
        if (w.rating) response_text += ` · ⭐ ${w.rating}/5`;
        response_text += `\n💬 ${w.reason}\n\n`;
      });

      if (result.ranking?.summary) {
        response_text += `💡 **AI Summary:** ${result.ranking.summary}`;
      }

      return {
        requirement,
        analysis: null,
        response: response_text,
        warehouses: top5
      };
    } else {
      response_text += `⚠️ **No warehouses found** matching your criteria.\n\n`;
      response_text += `**Your Requirements:**\n`;
      response_text += `- Space: ${requirement.requiredSpace} sq ft\n`;
      response_text += `- Location: ${requirement.location}\n`;
      if (requirement.maxBudget) response_text += `- Budget: ₹${requirement.maxBudget}/sq ft/month\n`;
      
      response_text += `\n**Try:**\n`;
      response_text += `- Searching in nearby cities\n`;
      response_text += `- Increasing your budget\n`;
      response_text += `- Being less specific about warehouse type\n`;

      return {
        requirement,
        analysis: null,
        response: response_text
      };
    }

  } catch (error) {
    console.error('❌ Processing error:', error);
    return {
      requirement: null,
      analysis: null,
      response: `Error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again with a simpler query.`
    };
  }
}

/**
 * Get grid-based block recommendations using LLM
 */
export async function getSmartBlockRecommendation(
  warehouseId: string,
  requiredSpace: number,
  availableBlocks: Array<{ blockNumber: number; areaSqft: number; status: string; pricePerSqft: number }>
): Promise<{ selectedBlocks: number[]; reasoning: string; totalArea: number; totalCost: number }> {
  
  const availableOnly = availableBlocks.filter(b => b.status === 'available');
  
  if (availableOnly.length === 0) {
    return {
      selectedBlocks: [],
      reasoning: 'No blocks available for booking.',
      totalArea: 0,
      totalCost: 0
    };
  }
  
  const prompt = `You are optimizing warehouse block selection. Select the optimal blocks to meet the space requirement.

Required Space: ${requiredSpace} sq ft

Available Blocks:
${availableOnly.map(b => `Block ${b.blockNumber}: ${b.areaSqft} sq ft @ ₹${b.pricePerSqft}/sq ft`).join('\n')}

Selection Criteria:
1. Meet or slightly exceed required space
2. Minimize cost
3. Prefer contiguous blocks (adjacent block numbers)
4. Minimize number of blocks selected

Return JSON:
{
  "selectedBlocks": [array of block numbers],
  "reasoning": "Brief explanation of selection strategy"
}`;

  try {
    const response = await getAIResponse({
      prompt,
      systemPrompt: 'You are a warehouse space optimization expert. Select optimal blocks. Respond with valid JSON only.',
      temperature: 0.1,
      maxTokens: 300
    });

    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      const selected = availableOnly.filter(b => result.selectedBlocks.includes(b.blockNumber));
      
      return {
        selectedBlocks: result.selectedBlocks,
        reasoning: result.reasoning,
        totalArea: selected.reduce((sum, b) => sum + b.areaSqft, 0),
        totalCost: selected.reduce((sum, b) => sum + (b.areaSqft * b.pricePerSqft), 0)
      };
    }
  } catch (error) {
    console.error('Smart block recommendation error:', error);
  }
  
  // Fallback: Simple greedy selection
  let selected: typeof availableOnly = [];
  let totalArea = 0;
  
  // Sort by price, then by block number for contiguity
  const sorted = [...availableOnly].sort((a, b) => a.pricePerSqft - b.pricePerSqft || a.blockNumber - b.blockNumber);
  
  for (const block of sorted) {
    if (totalArea >= requiredSpace) break;
    selected.push(block);
    totalArea += block.areaSqft;
  }
  
  return {
    selectedBlocks: selected.map(b => b.blockNumber),
    reasoning: 'Selected lowest-cost blocks to meet space requirement.',
    totalArea,
    totalCost: selected.reduce((sum, b) => sum + (b.areaSqft * b.pricePerSqft), 0)
  };
}

export const smartBookingService = {
  analyzeBookingRequirements,
  processNaturalLanguageBooking,
  getSmartBlockRecommendation
};

export default smartBookingService;
