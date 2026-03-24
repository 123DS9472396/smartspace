/**
 * Free LLM Integration Service
 * Supports: OpenRouter (100+ models) → Cloudflare → Groq → HuggingFace → Local fallback
 * Enhanced with warehouse recommendation explanations
 */

import type { RecommendedWarehouse, RecommendationPreferences } from '../../shared/api';

/**
 * Call OpenRouter API (Access to 100+ models including FREE ones!)
 * Free models: meta-llama/llama-3.2-3b-instruct:free, google/gemma-2-9b-it:free
 * Get free API key at: https://openrouter.ai/keys
 */
async function callOpenRouterAI(prompt: string, systemPrompt?: string): Promise<string | null> {
    try {
        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

        if (!apiKey || apiKey === 'your_openrouter_key_here') {
            console.log('⚠️ OpenRouter API not configured');
            return null;
        }

        console.log('🌐 Calling OpenRouter AI (qwen-2.5-72b - FREE)...');

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'SmartWarehouse'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-2.5-72b-instruct:free', // FREE model!
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt || 'You are a professional warehouse logistics advisor. Provide concise, helpful recommendations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            console.error('OpenRouter error:', response.status);
            return null;
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (text) {
            console.log('✅ OpenRouter AI success');
            return text;
        }

        return null;
    } catch (error) {
        console.error('OpenRouter error:', error);
        return null;
    }
}

/**
 * Call Cloudflare Workers AI API (Free, global edge network)
 * Models available: llama-3.1-8b-instruct, llama-3.3-70b-instruct, mistral-7b-instruct, etc.
 * Get free API token at: https://dash.cloudflare.com/?to=/:account/ai/workers-ai
 */
async function callCloudflareAI(prompt: string, systemPrompt?: string): Promise<string | null> {
    try {
        const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
        const apiToken = import.meta.env.VITE_CLOUDFLARE_AI_TOKEN;

        if (!accountId || !apiToken || accountId === 'your_account_id_here' || apiToken === 'your_api_token_here') {
            console.log('⚠️ Cloudflare Workers AI not configured');
            return null;
        }

        console.log('☁️ Calling Cloudflare Workers AI (llama-3.3-70b)...');

        // Use the powerful llama-3.3-70b-instruct-fp8-fast model (free, best quality)
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt || 'You are a professional warehouse logistics advisor. Provide concise, helpful recommendations.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 500
                })
            }
        );

        if (!response.ok) {
            console.error('Cloudflare AI error:', response.status);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return null;
        }

        const data = await response.json();
        
        // Cloudflare returns { result: { response: "..." }, success: true }
        const text = data.result?.response;

        if (text) {
            console.log('✅ Cloudflare Workers AI success');
            return text;
        }

        return null;
    } catch (error) {
        console.error('Cloudflare AI error:', error);
        return null;
    }
}

/**
 * Call Groq API (Free, super fast LLM)
 */
async function callGroqAPI(prompt: string, systemPrompt?: string): Promise<string | null> {
    try {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;

        if (!apiKey || apiKey === 'your_groq_api_key_here') {
            console.log('⚠️ Groq API key not configured');
            return null;
        }

        console.log('🚀 Calling Groq API (llama-3.3-70b)...');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Free, fast model
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt || 'You are a professional document verification expert. Provide concise, professional assessments.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            console.error('Groq API error:', response.status);
            return null;
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (text) {
            console.log('✅ Groq API success');
            return text;
        }

        return null;
    } catch (error) {
        console.error('Groq API error:', error);
        return null;
    }
}

/**
 * Call HuggingFace Inference API (Free)
 */
async function callHuggingFaceAPI(prompt: string): Promise<string | null> {
    try {
        const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;

        if (!apiKey || apiKey === 'your_hf_api_key_here') {
            console.log('⚠️ HuggingFace API key not configured');
            return null;
        }

        console.log('🤗 Calling HuggingFace API...');

        const response = await fetch(
            'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 500 } })
            }
        );

        if (!response.ok) {
            console.error('HuggingFace API error:', response.status);
            return null;
        }

        const data = await response.json();
        const text = data[0]?.generated_text;

        if (text) {
            console.log('✅ HuggingFace API success');
            return text;
        }

        return null;
    } catch (error) {
        console.error('HuggingFace API error:', error);
        return null;
    }
}

/**
 * Generate local fallback analysis (no API needed)
 */
function generateLocalAnalysis(analysis: any): string {
    const score = analysis.overallScore;
    const concerns = analysis.concerns.length;
    const strengths = analysis.strengths.length;

    let assessment = `AUTOMATED ANALYSIS (Score: ${score}/100):\n\n`;

    if (score >= 70) {
        assessment += '✅ RECOMMENDATION: APPROVE\n';
        assessment += 'All critical credentials verified in submitted documents. ';
    } else if (score >= 40) {
        assessment += '⚠️ RECOMMENDATION: MANUAL REVIEW REQUIRED\n';
        assessment += 'Partial verification successful. Manual review recommended. ';
    } else {
        assessment += '❌ RECOMMENDATION: REJECT\n';
        assessment += 'Insufficient verification. Documents do not meet business requirements. ';
    }

    if (concerns > 0) {
        assessment += `\n\nCONCERNS (${concerns}):\n`;
        assessment += analysis.concerns.slice(0, 5).map((c: string) => `• ${c}`).join('\n');
    }

    if (strengths > 0) {
        assessment += `\n\nVERIFIED (${strengths}):\n`;
        assessment += analysis.strengths.map((s: string) => `• ${s}`).join('\n');
    }

    return assessment;
}

/**
 * Get LLM analysis with fallback chain
 */
export async function getLLMAnalysis(
    analysis: any,
    profileData: any
): Promise<string> {
    const prompt = `Analyze this business verification:

PROFILE DATA:
- Name: ${profileData.fullName}
- Company: ${profileData.companyName}
- GST: ${profileData.gstNumber}
- PAN: ${profileData.panNumber}

DOCUMENT ANALYSIS:
- Overall Score: ${analysis.overallScore}/100
- Documents Analyzed: ${analysis.documents.length}
- Business Documents: ${analysis.documents.filter((d: any) => d.isBusinessDocument).length}

VERIFICATION RESULTS:
${analysis.scoreBreakdown ? Object.entries(analysis.scoreBreakdown).map(([k, v]) => `- ${k}: ${v}`).join('\n') : ''}

CONCERNS:
${analysis.concerns.slice(0, 5).join('\n')}

STRENGTHS:
${analysis.strengths.join('\n')}

Provide a professional 3-4 sentence assessment with your recommendation (APPROVE/REVIEW/REJECT).`;

    // Try Groq first (fastest, free)
    const groqResult = await callGroqAPI(prompt);
    if (groqResult) return groqResult;

    // Try OpenRouter (100+ models, free tier)
    const openRouterResult = await callOpenRouterAI(prompt);
    if (openRouterResult) return openRouterResult;

    // Try Cloudflare Workers AI (free, global edge)
    const cloudflareResult = await callCloudflareAI(prompt);
    if (cloudflareResult) return cloudflareResult;

    // Try HuggingFace
    const hfResult = await callHuggingFaceAPI(prompt);
    if (hfResult) return hfResult;

    // Fallback to local analysis
    console.log('ℹ️ Using local analysis (no LLM API available)');
    return generateLocalAnalysis(analysis);
}

/**
 * Generate AI-powered recommendation explanation for a warehouse
 * Uses Groq LLM (llama-3.1-70b) for natural language explanations
 */
export async function getWarehouseRecommendationExplanation(
    warehouse: RecommendedWarehouse,
    preferences: RecommendationPreferences
): Promise<string> {
    const systemPrompt = `You are an expert warehouse logistics advisor. Provide concise, helpful explanations for warehouse recommendations. Be specific about why this warehouse matches the user's needs. Use friendly, professional language.`;

    const prompt = `Explain why this warehouse is recommended for the user:

WAREHOUSE DETAILS:
- Name: ${warehouse.name}
- Location: ${warehouse.location} (${warehouse.district})
- Price: ₹${warehouse.pricePerSqFt}/sq.ft
- Size: ${warehouse.totalAreaSqft?.toLocaleString()} sq.ft
- Rating: ${warehouse.rating}/5
- Match Score: ${warehouse.matchScore}%
${warehouse.reasons?.length ? `- Key Features: ${warehouse.reasons.map(r => r.label).join(', ')}` : ''}

USER PREFERENCES:
${preferences.district ? `- Preferred District: ${preferences.district}` : ''}
${preferences.targetPrice ? `- Target Price: ₹${preferences.targetPrice}/sq.ft` : ''}
${preferences.minAreaSqft ? `- Minimum Area: ${preferences.minAreaSqft.toLocaleString()} sq.ft` : ''}
${preferences.preferredType ? `- Preferred Type: ${preferences.preferredType}` : ''}
${preferences.preferVerified ? '- Prefers verified warehouses' : ''}
${preferences.preferAvailability ? '- Prefers immediate availability' : ''}

EXISTING REASONS:
${warehouse.reasons?.join('\n') || 'No specific reasons provided'}

Provide a 2-3 sentence natural language explanation of why this warehouse is a great match. Focus on the key value propositions.`;

    try {
        // Try Groq first (fastest, free)
        const groqExplanation = await callGroqAPI(prompt, systemPrompt);
        if (groqExplanation) {
            console.log('✅ Groq LLM generated recommendation explanation');
            return groqExplanation;
        }

        // Try OpenRouter (free models)
        const openRouterExplanation = await callOpenRouterAI(prompt, systemPrompt);
        if (openRouterExplanation) {
            console.log('✅ OpenRouter AI generated recommendation explanation');
            return openRouterExplanation;
        }

        // Try Cloudflare Workers AI (free, global edge)
        const cloudflareExplanation = await callCloudflareAI(prompt, systemPrompt);
        if (cloudflareExplanation) {
            console.log('✅ Cloudflare AI generated recommendation explanation');
            return cloudflareExplanation;
        }
    } catch (error) {
        console.error('LLM recommendation explanation error:', error);
    }

    // Fallback to generating explanation from existing data
    return generateLocalRecommendationExplanation(warehouse, preferences);
}

/**
 * Generate local fallback explanation without LLM
 */
function generateLocalRecommendationExplanation(
    warehouse: RecommendedWarehouse,
    preferences: RecommendationPreferences
): string {
    const parts: string[] = [];

    if (preferences.district && warehouse.district?.toLowerCase().includes(preferences.district.toLowerCase())) {
        parts.push(`Located in your preferred district of ${warehouse.district}`);
    }

    if (preferences.targetPrice && warehouse.pricePerSqFt <= preferences.targetPrice) {
        const savings = Math.round((1 - warehouse.pricePerSqFt / preferences.targetPrice) * 100);
        if (savings > 0) {
            parts.push(`${savings}% below your budget at ₹${warehouse.pricePerSqFt}/sq.ft`);
        } else {
            parts.push(`Within your budget at ₹${warehouse.pricePerSqFt}/sq.ft`);
        }
    }

    if (warehouse.rating >= 4.5) {
        parts.push(`Highly rated at ${warehouse.rating}/5 stars`);
    }

    if (warehouse.matchScore >= 90) {
        parts.push(`Excellent ${warehouse.matchScore}% match for your requirements`);
    } else if (warehouse.matchScore >= 80) {
        parts.push(`Strong ${warehouse.matchScore}% match for your needs`);
    }

    if (parts.length === 0) {
        parts.push(`This warehouse offers ${warehouse.totalAreaSqft?.toLocaleString()} sq.ft of storage space in ${warehouse.location}`);
    }

    return parts.slice(0, 3).join('. ') + '.';
}

/**
 * Batch generate explanations for multiple warehouses (rate-limited)
 */
export async function batchGenerateExplanations(
    warehouses: RecommendedWarehouse[],
    preferences: RecommendationPreferences,
    maxConcurrent: number = 3
): Promise<Map<string, string>> {
    const explanations = new Map<string, string>();
    
    // Process in batches to avoid rate limiting
    for (let i = 0; i < warehouses.length; i += maxConcurrent) {
        const batch = warehouses.slice(i, i + maxConcurrent);
        const batchResults = await Promise.all(
            batch.map(async (warehouse) => {
                const explanation = await getWarehouseRecommendationExplanation(warehouse, preferences);
                return { whId: warehouse.whId, explanation };
            })
        );
        
        for (const result of batchResults) {
            explanations.set(result.whId, result.explanation);
        }
        
        // Small delay between batches to respect rate limits
        if (i + maxConcurrent < warehouses.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    return explanations;
}
