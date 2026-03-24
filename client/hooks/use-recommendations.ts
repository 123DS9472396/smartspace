import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  RecommendationPreferences,
  RecommendationResponse
} from '../../shared/api';
import { warehouseService } from '../services/warehouseService';

interface UseRecommendationsOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
}

/**
 * Hook to fetch warehouse recommendations based on user preferences
 * Uses LLM-first ranking with heuristic fallback
 */
export function useRecommendations(
  preferences: RecommendationPreferences,
  limit: number = 12,
  options: UseRecommendationsOptions = {}
) {
  const { enabled = true, refetchOnWindowFocus = false } = options;

  // Create a stable query key that changes when ANY preference changes
  // DO NOT use Date.now() - it causes infinite re-renders!
  const queryKey = [
    'recommendations',
    preferences.district || 'all',
    preferences.targetPrice || 0,
    preferences.minAreaSqft || 0,
    preferences.preferredType || 'any',
    preferences.preferVerified ? 'verified' : 'any',
    preferences.preferAvailability ? 'available' : 'any',
    limit
  ];

  return useQuery<RecommendationResponse, Error>({
    queryKey,
    queryFn: async (): Promise<RecommendationResponse> => {
      console.log('🔄 Fetching LLM recommendations with preferences:', JSON.stringify(preferences));

      try {
        const data = await warehouseService.getLLMRecommendations(preferences, limit);

        if (!data?.items?.length) {
          return { items: [] };
        }

        console.log(`✅ LLM returned ${data.items.length} recommendations`);
        return data;
      } catch (error) {
        console.error('LLM recommendations failed:', error);
        return { items: [] };
      }
    },
    enabled,
    refetchOnWindowFocus,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to prevent spam
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

/**
 * Smart recommendations hook with state management for preferences
 */
export function useSmartRecommendations() {
  const [preferences, setPreferences] = useState<RecommendationPreferences>({
    // Default preferences for general recommendations
    preferVerified: true,
    preferAvailability: true,
  });

  const [limit, setLimit] = useState(50); // Increased to show more results after ML analysis
  const [customizeMode, setCustomizeMode] = useState(false);
  const [forceRefreshKey, setForceRefreshKey] = useState(0); // Add force refresh mechanism
  const [hasAppliedPreferences, setHasAppliedPreferences] = useState(true); // TRUE by default to show recommendations

  // Enable query by default - will fetch fresh data with Date.now() in query key
  const query = useRecommendations(preferences, limit, { enabled: true });

  return {
    ...query,
    preferences,
    setPreferences: (newPrefs: RecommendationPreferences) => {
      console.log('🔄 Setting new preferences:', newPrefs);
      setPreferences(newPrefs);
      setHasAppliedPreferences(true); // Enable fetching after preferences are set
      setForceRefreshKey(prev => prev + 1); // Force new query
    },
    limit,
    setLimit,
    customizeMode,
    setCustomizeMode,
    forceRefreshKey, // Expose for external use
    updatePreference: <K extends keyof RecommendationPreferences>(
      key: K,
      value: RecommendationPreferences[K]
    ) => {
      setPreferences(prev => ({ ...prev, [key]: value }));
    },
    clearPreferences: () => {
      setPreferences({
        preferVerified: true,
        preferAvailability: true,
      });
    },
    // Additional helper methods for setting common preferences
    setLocation: (district: string) => {
      setPreferences(prev => ({ ...prev, district }));
    },
    setBudget: (targetPrice: number) => {
      setPreferences(prev => ({ ...prev, targetPrice }));
    },
    setAreaRequirement: (minAreaSqft: number) => {
      setPreferences(prev => ({ ...prev, minAreaSqft }));
    },
    setWarehouseType: (preferredType: string) => {
      setPreferences(prev => ({ ...prev, preferredType }));
    },
    toggleVerified: () => {
      setPreferences(prev => ({ ...prev, preferVerified: !prev.preferVerified }));
    },
    toggleAvailability: () => {
      setPreferences(prev => ({ ...prev, preferAvailability: !prev.preferAvailability }));
    }
  };
}
