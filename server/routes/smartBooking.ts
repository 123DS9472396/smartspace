import { Router, RequestHandler } from 'express';
import { supabase } from '../lib/supabaseClient';

const router = Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

console.log('🔧 SmartBooking Route loaded - Groq AI + pattern fallback | Key:', GROQ_API_KEY ? GROQ_API_KEY.substring(0, 12) + '...' : 'missing');

function extractRequirements(query: string) {
  const text = query.toLowerCase();
  const cities = [
    'thane west','thane east','navi mumbai','thane','mumbai','pune','nashik','nagpur',
    'aurangabad','kolhapur','solapur','amravati','bangalore','bengaluru','hyderabad',
    'chennai','delhi','noida','gurgaon','ahmedabad','surat','vadodara','kolkata',
    'jaipur','indore','bhopal','lucknow','kanpur','agra','coimbatore','kochi',
    'vizag','visakhapatnam','patna','bhubaneswar','guwahati','chandigarh','ludhiana',
    'amritsar','bhiwandi'
  ];
  let location = '';
  for (const city of cities) {
    if (text.includes(city)) {
      location = city.replace(/\b\w/g, (c: string) => c.toUpperCase());
      break;
    }
  }
  let requiredSpace = 1000;
  const spacePatterns = [
    /(\d[\d,]*)\s*sq\.?\s*ft/i,
    /(\d[\d,]*)\s*sqft/i,
    /(\d[\d,]*)\s*square\s*fe?e?t/i,
  ];
  for (const pat of spacePatterns) {
    const m = query.match(pat);
    if (m) { requiredSpace = parseInt(m[1].replace(/,/g, ''), 10); break; }
  }
  if (requiredSpace === 1000) {
    if (text.includes('small')) requiredSpace = 500;
    else if (text.includes('medium')) requiredSpace = 2000;
    else if (text.includes('large') || text.includes('big')) requiredSpace = 5000;
    else if (text.includes('huge') || text.includes('massive')) requiredSpace = 10000;
  }
  let maxBudget: number | null = null;
  const budgetPatterns = [
    /budget\s*(?:is|of|:)?\s*[₹rs.]*\s*(\d[\d,]*)/i,
    /[₹]\s*(\d[\d,]*)/,
    /(\d[\d,]*)\s*\/?\s*(?:per\s*)?(?:sqft|sq\.?\s*ft)/i,
  ];
  for (const pat of budgetPatterns) {
    const m = query.match(pat);
    if (m) {
      const raw = parseInt(m[1].replace(/,/g, ''), 10);
      maxBudget = raw > 5000 ? Math.round(raw / requiredSpace) : raw;
      break;
    }
  }
  if (!maxBudget) {
    if (text.includes('low budget') || text.includes('cheap') || text.includes('affordable')) maxBudget = 30;
    else if (text.includes('high budget') || text.includes('premium')) maxBudget = 120;
  }
  let warehouseType: string | null = null;
  if (text.includes('cold storage') || text.includes('frozen') || text.includes('refrigerat')) warehouseType = 'Cold Storage';
  else if (text.includes('bonded') || text.includes('customs')) warehouseType = 'Bonded';
  else if (text.includes('hazardous') || text.includes('chemical')) warehouseType = 'Hazardous';
  else if (text.includes('dry')) warehouseType = 'Dry Storage';
  else if (text.includes('automated')) warehouseType = 'Automated';
  else if (text.includes('open yard')) warehouseType = 'Open Yard';
  let goodsType: string | null = null;
  const goodsMap: Record<string, string> = {
    'electronics': 'Electronics','electric': 'Electronics',
    'pharma': 'Pharmaceuticals','medicine': 'Pharmaceuticals',
    'food': 'Food & Beverages','beverage': 'Food & Beverages',
    'cold drink': 'Food & Beverages','drinks': 'Food & Beverages',
    'fmcg': 'FMCG','grocery': 'FMCG',
    'textile': 'Textiles','cloth': 'Textiles',
    'automotive': 'Automotive','car': 'Automotive',
    'furniture': 'Furniture','machine': 'Machinery',
    'ecommerce': 'E-commerce',
  };
  for (const [kw, label] of Object.entries(goodsMap)) {
    if (text.includes(kw)) { goodsType = label; break; }
  }
  return { location: location || null, requiredSpace, maxBudget, warehouseType, goodsType };
}

function scoreWarehouse(w: any, req: ReturnType<typeof extractRequirements>) {
  let score = 40;
  const reasons: string[] = [];
  if (req.location) {
    const loc = req.location.toLowerCase();
    const baseCity = loc.split(' ')[0];
    const city = (w.city || '').toLowerCase();
    const addr = (w.address || '').toLowerCase();
    if (city.includes(baseCity) || addr.includes(baseCity)) {
      score += 30; reasons.push(`In ${w.city}`);
    }
  }
  if (w.total_area) {
    const area = Number(w.total_area);
    if (area >= req.requiredSpace) { score += 15; reasons.push(`${area} sq ft available`); }
    else if (area / req.requiredSpace >= 0.7) score += 5;
  }
  if (req.maxBudget && w.price_per_sqft) {
    if (Number(w.price_per_sqft) <= req.maxBudget) { score += 10; reasons.push(`Rs.${w.price_per_sqft}/sqft fits budget`); }
  }
  if (req.warehouseType && w.warehouse_type) {
    if ((w.warehouse_type as string).toLowerCase().includes(req.warehouseType.toLowerCase())) {
      score += 10; reasons.push(w.warehouse_type);
    }
  }
  const desc = ((w.name || '') + ' ' + (w.description || '')).toLowerCase();
  if (req.goodsType && desc.includes(req.goodsType.toLowerCase())) {
    score += 5; reasons.push(`Suitable for ${req.goodsType}`);
  }
  return { score: Math.min(score, 100), reason: reasons.join(', ') || 'General match' };
}

/** Call Groq API and return parsed JSON or null on failure */
async function callGroq(systemPrompt: string, userPrompt: string): Promise<any | null> {
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 600,
        temperature: 0.1
      })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error('❌ Groq error:', err?.error?.message || resp.status);
      return null;
    }
    const data = await resp.json();
    const text = data.choices[0].message.content;
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch (e) {
    console.error('❌ Groq call failed:', e);
    return null;
  }
}

const searchWarehouses: RequestHandler = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    console.log('🔍 [SmartBooking] Query:', query);

    // Step 1: Try Groq extraction, fall back to local patterns
    let requirements = extractRequirements(query);
    const groqExtracted = await callGroq(
      'You are a warehouse booking assistant. Extract requirements from the user query and return ONLY valid JSON, no other text.',
      `Extract warehouse requirements from: "${query}"

Return JSON:
{
  "location": "city name or null",
  "requiredSpace": number (sq ft),
  "maxBudget": number (per sqft/month) or null,
  "warehouseType": "Cold Storage|Dry Storage|Bonded|Hazardous|Automated|Open Yard or null",
  "goodsType": "type of goods or null"
}`
    );
    if (groqExtracted) {
      console.log('✅ Groq extracted:', groqExtracted);
      requirements = {
        location: groqExtracted.location || requirements.location,
        requiredSpace: groqExtracted.requiredSpace || requirements.requiredSpace,
        maxBudget: groqExtracted.maxBudget || requirements.maxBudget,
        warehouseType: groqExtracted.warehouseType || requirements.warehouseType,
        goodsType: groqExtracted.goodsType || requirements.goodsType,
      };
    } else {
      console.log('⚠️ Groq unavailable, using pattern extraction:', requirements);
    }

    // Step 2: Query database
    let dbQuery = supabase.from('warehouses').select('*').eq('status', 'active');
    if (requirements.location) {
      const baseCity = requirements.location.split(' ')[0];
      dbQuery = dbQuery.or(
        `city.ilike.%${requirements.location}%,city.ilike.%${baseCity}%,address.ilike.%${requirements.location}%,address.ilike.%${baseCity}%`
      );
    }
    if (requirements.warehouseType) dbQuery = dbQuery.ilike('warehouse_type', `%${requirements.warehouseType}%`);
    if (requirements.maxBudget) dbQuery = dbQuery.lte('price_per_sqft', requirements.maxBudget * 2);
    let { data: warehouses, error: dbError } = await dbQuery.limit(50);
    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ success: false, error: 'Database query failed', details: dbError });
    }
    if ((!warehouses || warehouses.length === 0) && requirements.location) {
      console.log('No location match, fetching all active warehouses');
      const { data: all } = await supabase.from('warehouses').select('*').eq('status', 'active').limit(50);
      warehouses = all || [];
    }

    // Step 3: Local scoring
    const scored = (warehouses || [])
      .map((w: any) => {
        const { score, reason } = scoreWarehouse(w, requirements);
        return { ...w, _score: score, _reason: reason };
      })
      .sort((a: any, b: any) => b._score - a._score);

    // Step 4: Try Groq ranking on top results
    let bestMatches = scored.slice(0, 5).map((w: any, i: number) => ({
      id: w.id, rank: i + 1, score: w._score, reason: w._reason
    }));
    let summary = scored.length > 0
      ? `Best match: ${scored[0].name} in ${scored[0].city} — ${scored[0].total_area} sq ft @ ₹${scored[0].price_per_sqft}/sqft`
      : `No warehouses found for "${requirements.location || query}".`;

    if (scored.length > 0) {
      const top10 = scored.slice(0, 10).map((w: any, i: number) =>
        `${i + 1}. ID:${w.id} | ${w.name} | ${w.city} | ${w.total_area} sqft | Rs.${w.price_per_sqft}/sqft | Type:${w.warehouse_type || 'General'}`
      ).join('\n');

      const groqRanking = await callGroq(
        'You are a warehouse ranking expert. Rank warehouses for the user query. Return ONLY valid JSON.',
        `User query: "${query}"
Requirements: location=${requirements.location}, space=${requirements.requiredSpace}sqft, budget=Rs.${requirements.maxBudget || 'any'}/sqft, type=${requirements.warehouseType || 'any'}, goods=${requirements.goodsType || 'any'}

Warehouses:
${top10}

Rank these warehouses from best to worst match. For each, give a specific 1-sentence reason explaining why it is ranked at that position (mention price, location fit, size, or type).

Return JSON:
{
  "bestMatches": [{"id": "...", "rank": 1, "score": 95, "reason": "Ranked #1 because it is in Thane exactly as requested, offers 3000 sqft fitting your need, and price Rs.12/sqft is within budget."}],
  "summary": "2-3 sentence overall recommendation mentioning the top choice and why"
}`
      );

      if (groqRanking?.bestMatches) {
        bestMatches = groqRanking.bestMatches;
        summary = groqRanking.summary || summary;
        console.log('✅ Groq ranking applied');
      }
    }

    console.log(`✅ Returning ${scored.length} results`);
    return res.json({
      success: true, query, requirements,
      warehouses: scored,
      ranking: { bestMatches, summary },
      message: `Found ${scored.length} warehouse${scored.length !== 1 ? 's' : ''} matching your query`
    });
  } catch (error) {
    console.error('SmartBooking error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

router.post('/api/smart-booking/search', searchWarehouses);
export default router;
