/**
 * Advanced Multi-LLM Service with Fallback Chain
 * Uses: Groq (fastest) → OpenRouter → Gemini → Local ML
 * 
 * Features:
 * - Multiple LLM provider support
 * - Automatic fallback on failure
 * - Advanced prompt engineering
 * - Structured JSON output parsing
 */

import type { RecommendationPreferences } from "./api";

// Get API keys from environment (works both server-side and client-side)
const getEnvVar = (key: string): string => {
  // Server-side (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key]!;
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`]!;
  }
  
  // Client-side (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env[key]) return import.meta.env[key];
    if (import.meta.env[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
  }
  
  return '';
};

// API Configuration
const GROQ_API_KEY = getEnvVar('GROQ_API_KEY');
const OPENROUTER_API_KEY = getEnvVar('OPENROUTER_API_KEY');
const GEMINI_API_KEY = getEnvVar('GEMINI_API_KEY');

// LLM Provider Interfaces
interface LLMRecommendation {
  warehouseId: string;
  score: number;
  reasoning: string;
  insights: string[];
  matchFactors: {
    location: number;
    price: number;
    size: number;
    quality: number;
  };
}

interface LLMResponse {
  recommendations: LLMRecommendation[];
  analysisInsights: string;
  provider: string;
}

/**
 * Generate warehouse recommendation prompt with advanced context
 */
function generateAdvancedPrompt(warehouses: any[], preferences: RecommendationPreferences): string {
  // Filter and prepare warehouse data for prompt
  const warehouseData = warehouses.slice(0, 50).map(w => ({
    id: w.id,
    name: w.name,
    city: w.city || w.district,
    district: w.district || w.city,
    price: w.price_per_sqft,
    area: w.total_area,
    available: Math.floor(w.total_area * (1 - (w.occupancy || 0) / 100)),
    rating: w.rating || 4.0,
    type: w.warehouse_type || w.type || 'General',
    verified: w.verified || false,
    amenities: (w.amenities || []).slice(0, 5)
  }));

  const prefString = JSON.stringify({
    targetDistrict: preferences.district || 'any',
    targetPrice: preferences.targetPrice || 'flexible',
    minArea: preferences.minAreaSqft || 'any',
    preferredType: preferences.preferredType || 'any',
    preferVerified: preferences.preferVerified || false
  }, null, 2);

  return `You are an expert warehouse recommendation AI. Analyze these warehouses and user preferences to provide the BEST matches.

USER PREFERENCES:
${prefString}

AVAILABLE WAREHOUSES (sample of ${warehouses.length} total):
${JSON.stringify(warehouseData, null, 2)}

SCORING CRITERIA (use advanced mathematical modeling):
1. LOCATION MATCH (30% weight):
   - Exact district match = 1.0
   - Same region = 0.7
   - Different region = 0.3
   
2. PRICE MATCH (25% weight):
   - Within budget = 1.0
   - Within 10% over = 0.8
   - Within 20% over = 0.6
   - More than 20% over = 0.3
   
3. SIZE MATCH (25% weight):
   - Meets minimum requirement = 1.0
   - Within 10% = 0.8
   - Below requirement = 0.5
   
4. QUALITY FACTORS (20% weight):
   - Rating >= 4.5 = 1.0
   - Rating >= 4.0 = 0.8
   - Rating >= 3.5 = 0.6
   - Verified bonus = +0.1

IMPORTANT RULES:
- If user specified a district, STRONGLY prefer warehouses in that EXACT district
- Calculate composite scores using weighted average: location*0.30 + price*0.25 + size*0.25 + quality*0.20
- Return warehouses sorted by composite score (highest first)
- Provide specific, actionable insights

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "warehouseId": "exact-warehouse-id",
      "score": 0.95,
      "reasoning": "Specific reasoning for this match",
      "insights": ["insight1", "insight2"],
      "matchFactors": {
        "location": 1.0,
        "price": 0.9,
        "size": 0.85,
        "quality": 0.95
      }
    }
  ],
  "analysisInsights": "Overall analysis of the recommendations"
}

Recommend the TOP 15 warehouses. Return ONLY the JSON, no other text.`;
}

/**
 * Call Groq API (fastest, uses Llama 3)
 */
async function callGroq(prompt: string): Promise<LLMResponse | null> {
  if (!GROQ_API_KEY) {
    console.log('Groq API key not configured');
    return null;
  }

  try {
    console.log('🚀 Calling Groq API (Llama 3)...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert warehouse recommendation AI. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in Groq response');
      return null;
    }

    const parsed = JSON.parse(content);
    console.log(`✅ Groq returned ${parsed.recommendations?.length || 0} recommendations`);
    
    return {
      ...parsed,
      provider: 'Groq (Llama 3.3 70B)'
    };
  } catch (error) {
    console.error('Groq API failed:', error);
    return null;
  }
}

/**
 * Call OpenRouter API (100+ models)
 */
async function callOpenRouter(prompt: string): Promise<LLMResponse | null> {
  if (!OPENROUTER_API_KEY) {
    console.log('OpenRouter API key not configured');
    return null;
  }

  try {
    console.log('🌐 Calling OpenRouter API (Claude/GPT)...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://smartspace.app',
        'X-Title': 'SmartSpace Warehouse Recommendations'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: 'You are an expert warehouse recommendation AI. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in OpenRouter response');
      return null;
    }

    // Extract JSON from response (may have markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in OpenRouter response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`✅ OpenRouter returned ${parsed.recommendations?.length || 0} recommendations`);
    
    return {
      ...parsed,
      provider: 'OpenRouter (Claude 3 Haiku)'
    };
  } catch (error) {
    console.error('OpenRouter API failed:', error);
    return null;
  }
}

/**
 * Call Gemini API
 */
async function callGemini(prompt: string): Promise<LLMResponse | null> {
  if (!GEMINI_API_KEY) {
    console.log('Gemini API key not configured');
    return null;
  }

  try {
    console.log('🔮 Calling Gemini API...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return null;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      console.error('No content in Gemini response');
      return null;
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`✅ Gemini returned ${parsed.recommendations?.length || 0} recommendations`);
    
    return {
      ...parsed,
      provider: 'Google Gemini 1.5 Flash'
    };
  } catch (error) {
    console.error('Gemini API failed:', error);
    return null;
  }
}

/**
 * Main LLM recommendation function with fallback chain
 */
export async function getLLMRecommendations(
  warehouses: any[],
  preferences: RecommendationPreferences
): Promise<{
  recommendations: LLMRecommendation[];
  provider: string;
  success: boolean;
}> {
  const prompt = generateAdvancedPrompt(warehouses, preferences);
  
  // Try providers in order: Groq (fastest) → OpenRouter → Gemini
  const providers = [
    { name: 'Groq', fn: () => callGroq(prompt) },
    { name: 'OpenRouter', fn: () => callOpenRouter(prompt) },
    { name: 'Gemini', fn: () => callGemini(prompt) }
  ];
  
  for (const provider of providers) {
    try {
      const result = await provider.fn();
      if (result && result.recommendations && result.recommendations.length > 0) {
        console.log(`✅ Using ${provider.name} for recommendations`);
        return {
          recommendations: result.recommendations,
          provider: result.provider || provider.name,
          success: true
        };
      }
    } catch (error) {
      console.log(`${provider.name} failed, trying next...`);
    }
  }
  
  // All LLMs failed
  console.log('⚠️ All LLM providers failed, falling back to local ML');
  return {
    recommendations: [],
    provider: 'Local ML (Fallback)',
    success: false
  };
}

/**
 * Map LLM recommendations to warehouse recommendations
 */
export function mapLLMToRecommendations(
  llmRecs: LLMRecommendation[],
  warehouses: any[]
): any[] {
  const warehouseMap = new Map(warehouses.map(w => [w.id, w]));
  
  return llmRecs
    .filter(rec => warehouseMap.has(rec.warehouseId))
    .map(rec => {
      const warehouse = warehouseMap.get(rec.warehouseId);
      return {
        warehouse,
        score: rec.score,
        reasons: rec.insights || [rec.reasoning],
        matchFactors: rec.matchFactors,
        llmReasoning: rec.reasoning
      };
    });
}
