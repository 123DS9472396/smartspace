/**
 * Unified AI Service - Supports multiple LLM providers
 * Prioritizes: OpenRouter > Groq > Gemini > Cloudflare Workers AI
 */

// API Keys from environment
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const CLOUDFLARE_ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_AI_TOKEN = import.meta.env.VITE_CLOUDFLARE_AI_TOKEN;

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  text: string;
  provider: 'openrouter' | 'groq' | 'gemini' | 'cloudflare' | 'fallback';
  model: string;
  error?: string;
}

/**
 * Call OpenRouter API (Best option - access to Claude, GPT-4, etc.)
 */
async function callOpenRouter(request: AIRequest): Promise<AIResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'SmartSpace Warehouse'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet', // Best model available
      messages: [
        ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
        { role: 'user', content: request.prompt }
      ],
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    provider: 'openrouter',
    model: 'claude-3.5-sonnet'
  };
}

/**
 * Call Groq API (Fastest option - Llama 3.3, Mixtral, etc.)
 */
async function callGroq(request: AIRequest): Promise<AIResponse> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  console.log('🔐 Groq API Key Status:', GROQ_API_KEY ? `✅ Configured (${GROQ_API_KEY.substring(0, 10)}...)` : '❌ Missing');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // Latest Llama model
      messages: [
        ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
        { role: 'user', content: request.prompt }
      ],
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Groq API Error Response:', errorData);
    throw new Error(`Groq API error: ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log('✅ Groq API Success - Response received');
  return {
    text: data.choices[0].message.content,
    provider: 'groq',
    model: 'llama-3.3-70b'
  };
}

/**
 * Call Google Gemini API (Fallback option)
 */
async function callGemini(request: AIRequest): Promise<AIResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: request.systemPrompt 
              ? `${request.systemPrompt}\n\n${request.prompt}` 
              : request.prompt
          }]
        }],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2000
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.candidates[0].content.parts[0].text,
    provider: 'gemini',
    model: 'gemini-pro'
  };
}

/**
 * Call Cloudflare Workers AI (Free tier option)
 */
async function callCloudflare(request: AIRequest): Promise<AIResponse> {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_AI_TOKEN) {
    throw new Error('Cloudflare AI not configured');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_AI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt }
        ],
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Cloudflare AI error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.result.response,
    provider: 'cloudflare',
    model: 'llama-3.1-8b'
  };
}

/**
 * Main AI service - tries providers in order of preference
 * Priority: Groq (free & fast) → OpenRouter (best quality) → Cloudflare → Gemini (last resort)
 */
export async function getAIResponse(request: AIRequest): Promise<AIResponse> {
  console.log('🤖 AI Request:', request.prompt.substring(0, 100) + '...');

  // Try providers in order: Groq first (free), then OpenRouter (quality), then others
  const providers = [
    { name: 'Groq (Llama 3.3)', fn: callGroq, enabled: !!GROQ_API_KEY },
    { name: 'OpenRouter (Claude 3.5)', fn: callOpenRouter, enabled: !!OPENROUTER_API_KEY },
    { name: 'Cloudflare AI', fn: callCloudflare, enabled: !!(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_AI_TOKEN) },
    { name: 'Gemini Pro', fn: callGemini, enabled: !!GEMINI_API_KEY }
  ];

  for (const provider of providers) {
    if (!provider.enabled) {
      console.log(`⏭️ Skipping ${provider.name} - not configured`);
      continue;
    }

    try {
      console.log(`🔄 Trying ${provider.name}...`);
      const response = await provider.fn(request);
      console.log(`✅ Success with ${provider.name}`);
      return response;
    } catch (error) {
      console.warn(`⚠️ ${provider.name} failed:`, error);
      continue;
    }
  }

  // All providers failed - return fallback
  console.error('❌ All AI providers failed, using fallback response');
  return {
    text: 'AI service is currently unavailable. Please configure at least one API key in your .env file.',
    provider: 'fallback',
    model: 'none',
    error: 'No working AI provider configured'
  };
}

/**
 * Get warehouse recommendations using AI
 */
export async function getAIWarehouseRecommendations(
  userPreferences: {
    district?: string;
    targetPrice?: number;
    minAreaSqft?: number;
    preferredType?: string;
  },
  warehouses: any[]
): Promise<{ recommendations: any[]; reasoning: string }> {
  const prompt = `As a warehouse recommendation expert, analyze these ${warehouses.length} warehouses and recommend the top 10 based on these user preferences:
  
User Preferences:
- District: ${userPreferences.district || 'Any'}
- Target Price: ₹${userPreferences.targetPrice || 'Any'} per sq ft
- Minimum Area: ${userPreferences.minAreaSqft || 'Any'} sq ft
- Type: ${userPreferences.preferredType || 'Any'}

Warehouse Data (sample):
${JSON.stringify(warehouses.slice(0, 20).map(w => ({
  id: w.id,
  name: w.name,
  district: w.district,
  city: w.city,
  price: w.pricePerSqFt,
  area: w.totalAreaSqft,
  type: w.warehouseType,
  rating: w.rating
})), null, 2)}

Provide recommendations in JSON format:
{
  "recommendations": [
    { "warehouseId": "id", "matchScore": 0-100, "reason": "why this matches" }
  ],
  "reasoning": "Overall recommendation strategy"
}`;

  const response = await getAIResponse({
    prompt,
    systemPrompt: 'You are a warehouse recommendation expert. Always respond with valid JSON.',
    temperature: 0.3,
    maxTokens: 2000
  });

  try {
    // Extract JSON from response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }

  return {
    recommendations: [],
    reasoning: 'AI analysis completed but response parsing failed'
  };
}

/**
 * Get AI-powered chatbot response for warehouse queries
 * Uses real LLM with warehouse context for intelligent responses
 */
export async function getChatbotResponse(
  userMessage: string,
  context?: { warehouses?: any[]; userProfile?: any }
): Promise<string> {
  console.log('🤖 LLM Chatbot Request:', userMessage.substring(0, 50) + '...');
  
  const systemPrompt = `You are SmartSpace AI Assistant, an expert in warehouse rental and logistics in Maharashtra, India.

**YOUR KNOWLEDGE:**
- 10,002+ warehouses in our database across Maharashtra
- Cities covered: Mumbai, Pune, Nashik, Aurangabad, Thane, Solapur, Kolhapur, Sangli, Satara, Raigad
- Price range: ₹25-150 per sq ft per month
- Warehouse types: General Storage, Godown, Gala, Cold Storage, Pharma Storage, Food Storage, Industrial Logistics, E-commerce Fulfillment, Zepto Dark Store, Swiggy Instamart Dark Store, Blinkit Dark Store, Automobile Spare Storage, Textile Storage, Electronics Storage, FMCG Distribution, Agri Warehouse, Hazardous Materials, Temperature Controlled, Bonded Warehouse
- Features: 24/7 Security, Loading Docks, Climate Control, CCTV, Power Backup, FSSAI Certified, Pest Control

**YOUR CAPABILITIES:**
1. Help users find suitable warehouses based on their needs
2. Provide pricing estimates and market insights
3. Explain warehouse features and amenities
4. Guide users through the SmartSpace platform
5. Recommend warehouses based on business type

**RESPONSE STYLE:**
- Be helpful, concise, and professional
- Use bullet points and formatting for clarity
- Provide specific recommendations when possible
- Include relevant statistics from our database
- Suggest next steps for the user

Current context: ${context?.warehouses?.length || '10,000+'} warehouses available in database.`;

  const response = await getAIResponse({
    prompt: userMessage,
    systemPrompt,
    temperature: 0.7,
    maxTokens: 800
  });

  console.log('✅ LLM Response received from:', response.provider, response.model);
  
  return response.text;
}

export default {
  getAIResponse,
  getAIWarehouseRecommendations,
  getChatbotResponse
};
