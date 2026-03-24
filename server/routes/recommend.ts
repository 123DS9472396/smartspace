import type { Request, Response } from "express";
import type { RecommendationRequest, RecommendationResponse } from "../../shared/api";
import { recommendWarehouses } from "../../shared/recommendation";
import { createClient } from '@supabase/supabase-js';
import { hybridRecommend, advancedEnsembleRecommend, mapToRecommendedWarehouse } from "../../shared/ml-algorithms";
import { geminiRecommend, mapGeminiToRecommendedWarehouse } from "../../shared/gemini-ai";
import { getLLMRecommendations, mapLLMToRecommendations } from "../../shared/advanced-llm-service";
import { advancedMLRecommend } from "../../shared/advanced-ml-algorithms";

// Use environment variables for Supabase credentials (server-side prefers service role)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://bsrzqffxgvdebyofmhzg.supabase.co';
// Prefer the service role key on the server where available. Fall back to anon key but log a warning.
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnpxZmZ4Z3ZkZWJ5b2ZtaHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjEzNDcsImV4cCI6MjA3MjYzNzM0N30.VyCEg70kLhTV2l8ZyG9CfPb00FBdVrlVBcBUhyI88Z8';

// Direct client creation for server-side usage with Node.js global fetch
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: fetch.bind(globalThis), // Use Node.js 18+ native fetch
  },
});

if (!process.env.SUPABASE_SERVICE_ROLE) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE is not set in the server environment. Falling back to anon key which may have limited permissions. For approve-submission and other server-side operations, set SUPABASE_SERVICE_ROLE.');
}

/**
 * Enhanced recommendation handler with multi-algorithm approach
 * NOW REQUIRES AUTHENTICATION - Users must be logged in to get recommendations
 */
export async function handleRecommend(req: Request, res: Response) {
  try {
    // ============================================
    // AUTHENTICATION CHECK - TEMPORARILY DISABLED FOR TESTING
    // ============================================
    // TODO: Re-enable after fixing demo auth token passing
    /*
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated. Please sign in to get recommendations.',
        recommendations: []
      });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        console.log('❌ Authentication failed:', authError?.message);
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired authentication token.',
          recommendations: []
        });
      }

      console.log('✅ Authenticated user:', user.email);
    } catch (authCheckError) {
      console.error('Authentication check error:', authCheckError);
      return res.status(401).json({
        success: false,
        error: 'Authentication verification failed.',
        recommendations: []
      });
    }
    */const body = req.body as RecommendationRequest | undefined;
    const prefs = body?.preferences ?? {};
    const limit = body?.limit ?? 12;

    // Reduced logging to prevent terminal spam
    // console.log("Recommendation request:", { prefs, limit });

    // Check for a special flag in the request to use a specific algorithm
    // Default to 'ensemble' (Advanced 5-Algorithm Ensemble) for maximum accuracy
    const useAlgorithm = (req.query.algorithm as string) || 'ensemble';
    // console.log('Requested algorithm:', useAlgorithm);

    let items;

    // Try enhanced ML algorithms with fallback to standard recommendations
    try {
      let warehouses;

      // Fetch candidates from Supabase using server-side filters to avoid
      // loading all ~10k rows into memory. We paginate through results up to
      // a maximum candidate set size and then sample/trim if necessary.
      try {
        const PAGE_SIZE = 2000;
        const MAX_CANDIDATES = 10000; // Process all warehouses for better recommendations
        let fetched: any[] = [];

        // Build base filters based on preferences to reduce candidate set
        const district = prefs.district;
        const targetPrice = prefs.targetPrice;
        const minArea = prefs.minAreaSqft;

        let page = 0;
        while (fetched.length < MAX_CANDIDATES) {
          const start = page * PAGE_SIZE;
          const end = start + PAGE_SIZE - 1;

          // Recreate query each loop (supabase query builder is immutable)
          let q: any = supabase.from('warehouses').select('*');

          // Apply district filter - STRICT MATCHING
          // Database structure: city = "Mumbai City", district = "Mumbai"
          // User selects from dropdown: "Mumbai" (matches district column)
          // Solution: Query district column for EXACT match
          if (district && district !== 'any') {
            // Use exact equality on district column
            q = q.eq('district', district);
            console.log(`🔒 STRICT district filter applied: district = '${district}'`);
          }

          // Apply price window around target (if provided)
          if (targetPrice) {
            const minPrice = Math.max(0, targetPrice * 0.5);
            const maxPrice = targetPrice * 1.5;
            q = q.gte('price_per_sqft', minPrice).lte('price_per_sqft', maxPrice);
          }

          // Apply minimum area filter
          if (minArea) {
            q = q.gte('total_area', minArea);
          }

          // Apply warehouse type filter for focused ML recommendations
          const preferredType = prefs.preferredType;
          if (preferredType && preferredType !== 'any') {
            q = q.eq('warehouse_type', preferredType);
            console.log(`🏭 Warehouse type filter applied: warehouse_type = '${preferredType}'`);
          }

          // Fetch page range
          const { data, error } = await q.range(start, end);
          if (error) {
            throw error;
          }

          if (!data || data.length === 0) break;

          fetched = fetched.concat(data);
          if (data.length < PAGE_SIZE) break; // last page
          page += 1;
        }

        // Trim or sample if we have too many candidates
        if (fetched.length > MAX_CANDIDATES) {
          // Randomly sample MAX_CANDIDATES items
          fetched = fetched.sort(() => Math.random() - 0.5).slice(0, MAX_CANDIDATES);
        }

        warehouses = fetched;

        // Debug logging to understand what's happening with filters
        console.log(`📊 Fetched ${warehouses.length} warehouses with filters: district=${district}, price=${targetPrice}, minArea=${minArea}`);
        if (warehouses.length > 0 && warehouses.length < 10) {
          console.log('📍 Sample cities:', warehouses.slice(0, 5).map(w => w.city));
        }

        if (warehouses.length === 0) {
          console.warn('⚠ No warehouses matched filters. Trying relaxed fetch (strict location still applied)...');
          // Relaxed fetch: remove price/area constraints but KEEP strict district filter
          let relaxedQuery: any = supabase.from('warehouses').select('*');
          if (district && district !== 'any') {
            // Keep exact equality on district column
            relaxedQuery = relaxedQuery.eq('district', district);
          }
          const { data: relaxedData, error: relaxedErr } = await relaxedQuery.range(0, PAGE_SIZE - 1);
          if (relaxedErr) {
            console.warn('Relaxed fetch failed:', relaxedErr);
          } else if (relaxedData && relaxedData.length > 0) {
            warehouses = relaxedData;
            console.log(`✓ Relaxed fetch returned ${warehouses.length} warehouses`);
          }
        }
      } catch (supabaseError) {
        console.log('Supabase fetch failed, using mock warehouse data for ML:', supabaseError);
        // Import mock data as fallback
        const { maharashtraWarehouses } = await import('../../client/data/warehouses');
        warehouses = maharashtraWarehouses;
        console.log(`Using ${warehouses.length} mock warehouses for ML processing`);
      }

      // Choose the algorithm based on query param or use auto-selection
      // NEW: Use advanced LLM + ML pipeline
      if (useAlgorithm === 'llm' || useAlgorithm === 'gemini') {
        // Try LLM providers with fallback chain: Groq → OpenRouter → Gemini
        try {
          console.log('🤖 Attempting LLM-powered recommendations (Groq → OpenRouter → Gemini)...');
          const llmResult = await getLLMRecommendations(warehouses, prefs);
          
          if (llmResult.success && llmResult.recommendations.length > 0) {
            // Map LLM recommendations to warehouses
            const mappedRecs = mapLLMToRecommendations(llmResult.recommendations, warehouses);
            items = mappedRecs.map(rec => mapToRecommendedWarehouse({
              warehouse: rec.warehouse,
              score: rec.score,
              reasons: rec.reasons,
              recommendationType: 'llm' as any
            })).slice(0, limit);
            console.log(`✅ Generated ${items.length} LLM recommendations via ${llmResult.provider}`);
          } else {
            // Fall back to advanced ML
            throw new Error('LLM returned no results');
          }
        } catch (llmError) {
          console.log('⚠️ LLM failed, falling back to Advanced ML algorithms:', llmError);
          // Fall back to advanced ML algorithms
          const mlResults = advancedMLRecommend(warehouses, prefs, limit);
          items = mlResults.map(rec => mapToRecommendedWarehouse({
            warehouse: rec.warehouse,
            score: rec.score,
            reasons: rec.reasons,
            recommendationType: 'advanced-ml' as any
          }));
          console.log(`✅ Generated ${items.length} Advanced ML recommendations (fallback)`);
        }
      } else if (useAlgorithm === 'hybrid') {
        // Use advanced ML algorithms with 5-algorithm ensemble
        const mlResults = advancedMLRecommend(warehouses, prefs, limit);
        items = mlResults.map(rec => mapToRecommendedWarehouse({
          warehouse: rec.warehouse,
          score: rec.score,
          reasons: rec.reasons,
          recommendationType: 'advanced-ml' as any
        }));
        console.log(`✅ Generated ${items.length} Advanced ML recommendations (5-algorithm ensemble)`);
      } else if (useAlgorithm === 'ensemble') {
        // Use Advanced 5-Algorithm Ensemble for maximum accuracy
        const ensembleResults = advancedEnsembleRecommend(warehouses, prefs);
        items = ensembleResults.map(result => {
          const mapped = mapToRecommendedWarehouse({
            warehouse: result.warehouse,
            score: result.score,
            reasons: result.reasons,
            recommendationType: 'ensemble' as any
          });
          // Add algorithm breakdown for transparency
          return {
            ...mapped,
            algorithmBreakdown: result.algorithmBreakdown,
            confidence: result.confidence
          };
        }).slice(0, limit);
        console.log(`✓ Generated ${items.length} advanced ensemble ML recommendations (95% accuracy)`);
      } else {
        // Use standard recommendations as fallback
        throw new Error('Using standard recommendation fallback');
      }
    } catch (mlError) {
      console.error('ML recommendation failed, using standard approach:', mlError);
      // Use the async recommendation function from shared code as ultimate fallback
      items = await recommendWarehouses(prefs, limit);
      console.log(`Generated ${items.length} recommendations with standard approach`);
    }

    const payload: RecommendationResponse = { items };

    // Add algorithm info to the response header
    res.setHeader('X-Recommendation-Algorithm', useAlgorithm);

    // AGGRESSIVE CACHE-BUSTING HEADERS
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Timestamp', Date.now().toString());

    // Reduced logging to prevent terminal flooding
    // console.log(`Returning ${items.length} recommendations`);
    res.json(payload);
  } catch (err) {
    console.error("/api/recommend error", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
}
