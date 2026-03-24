/**
 * Real Gemini API integration for warehouse recommendations
 */

// Get API key from environment variables - works for both server and client
const getGeminiApiKey = (): string => {
  // Server-side (Node.js) - check process.env first
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    if (process.env.VITE_GEMINI_API_KEY) return process.env.VITE_GEMINI_API_KEY;
  }
  
  // Client-side (Vite) - use import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
  }
  
  return '';
};

const GEMINI_API_KEY = getGeminiApiKey();

/**
 * Gemini API client for making requests to Google's Generative AI
 */
export class GeminiClient {
  private apiKey: string;
  private apiEndpoint: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GEMINI_API_KEY || '';
    
    // Force log the API key for debugging (remove in production)
    console.log('Gemini API key status:', this.apiKey ? 'API key is set' : 'No API key provided');
    
    if (!this.apiKey) {
      console.warn('No Gemini API key provided. Will use simulated responses instead.');
      console.info('To use real Gemini AI: Get an API key at https://aistudio.google.com/app/apikey');
      console.info('Then add it to your .env file as VITE_GEMINI_API_KEY=your_api_key_here');
    } else {
      console.info('Gemini API key found. Using real Gemini AI for enhanced recommendations.');
    }
  }

  /**
   * Check if the Gemini API is available (has API key)
   */
  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Make a request to the Gemini API
   */
  async generateContent(prompt: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  /**
   * Generate a recommendation prompt for the Gemini API
   */
  generateRecommendationPrompt(warehouses: any[], preferences: any): string {
    // Create a subset of warehouses with essential data to avoid token limits
    const warehouseData = warehouses.slice(0, 30).map(w => ({
      id: w.id,
      name: w.name || w.description || `Warehouse in ${w.city}`,
      city: w.city,
      state: w.state,
      price_per_sqft: w.price_per_sqft,
      total_area: w.total_area,
      occupancy: w.occupancy || 0,
      rating: w.rating || 4.0,
      reviews_count: w.reviews_count || 0,
      amenities: (w.amenities || []).slice(0, 5),
      features: (w.features || []).slice(0, 5)
    }));

    // Generate a prompt for the Gemini API
    return `
You are an AI warehouse recommendation specialist. I will provide you with warehouse data and user preferences.
Please analyze the data and provide the best warehouse recommendations with explanations.

User Preferences:
${JSON.stringify(preferences, null, 2)}

Available Warehouses (limited sample):
${JSON.stringify(warehouseData, null, 2)}

For each recommended warehouse, please provide:
1. Warehouse ID
2. A score between 0 and 1 indicating how well it matches the preferences
3. Up to 3 short reasons why this warehouse is a good match
4. A brief reasoning explanation (2-3 sentences) for why this warehouse matches the user's needs

Return your response in the following JSON format:
{
  "recommendations": [
    {
      "warehouseId": "id of the warehouse",
      "score": 0.95,
      "insights": ["reason 1", "reason 2", "reason 3"],
      "reasoningExplanation": "This warehouse matches because..."
    },
    ...
  ]
}

Please recommend up to 8 warehouses, sorted by match score in descending order.
`;
  }
}
