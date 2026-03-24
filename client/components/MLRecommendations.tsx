import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Star, MapPin, TrendingUp, Target, Zap,
  Building2, ArrowRight, Sparkles, Brain, ChevronRight, RefreshCw, Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import RecommendationCustomizer from "./RecommendationCustomizer";
import RecommendationAlgorithmExplainer from "./RecommendationAlgorithmExplainer";
import EnvChecker from "./EnvChecker";
import type { RecommendedWarehouse, RecommendationPreferences } from "../../shared/api";

// Props interface - data comes from parent component to avoid duplicate state
interface MLRecommendationsProps {
  recommendations: RecommendedWarehouse[];
  preferences: RecommendationPreferences;
  setPreferences: (prefs: RecommendationPreferences) => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  customizeMode: boolean;
  setCustomizeMode: (mode: boolean) => void;
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
}

export default function MLRecommendations({
  recommendations,
  preferences,
  setPreferences,
  isLoading,
  error,
  refetch,
  customizeMode,
  setCustomizeMode,
  limit,
  setLimit
}: MLRecommendationsProps) {
  const queryClient = useQueryClient();

  // Simple debug log with safety check
  if (recommendations && recommendations.length > 0) {
    console.log(`🎨 Rendering ${recommendations.length} warehouses. First: ${recommendations[0]?.name} (${recommendations[0]?.district})`);
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100/80 backdrop-blur-sm";
    if (score >= 80) return "text-blue-600 bg-blue-100/80 backdrop-blur-sm";
    if (score >= 70) return "text-orange-600 bg-orange-100/80 backdrop-blur-sm";
    return "text-gray-600 bg-gray-100/80 backdrop-blur-sm";
  };

  if (error) {
    return (
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-glow shadow-red-200/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Recommendations Unavailable</h3>
                <p className="text-sm text-gray-600">Unable to load personalized recommendations</p>
              </div>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="border-red-200 hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-glow shadow-blue-200/50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <Bot className="h-6 w-6 text-blue-600" />
              <Sparkles className="h-3 w-3 text-blue-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gradient">LLM is analyzing warehouses for you...</h3>
          </div>
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="h-2 bg-blue-200 rounded mb-2"></div>
              <div className="text-sm text-gray-600">Analyzing preferences</div>
            </div>
            <div className="animate-pulse">
              <div className="h-2 bg-blue-300 rounded mb-2"></div>
              <div className="text-sm text-gray-600">Matching warehouses</div>
            </div>
            <div className="animate-pulse">
              <div className="h-2 bg-blue-400 rounded mb-2"></div>
              <div className="text-sm text-gray-600">Calculating scores</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ML Recommendations Header */}
      <Card className="glass-card shadow-professional-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bot className="h-6 w-6 text-blue-400" />
                <Sparkles className="h-3 w-3 text-blue-300 absolute -top-1 -right-1 animate-pulse-soft" />
              </div>
              <div>
                <CardTitle className="text-lg text-gradient-blue">LLM-Powered Recommendations</CardTitle>
                <CardDescription>
                  {recommendations && recommendations.length > 0
                    ? `Showing top ${recommendations.length} warehouses ranked by the LLM`
                    : "Personalized warehouse suggestions based on your preferences"
                  }
                </CardDescription>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="btn-professional-outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomizeMode(true)}
                className="btn-professional-outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Active Preferences Summary */}
      {(preferences.district || preferences.targetPrice || preferences.minAreaSqft || preferences.preferredType) && (
        <Card className="bg-glass border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Active Preferences:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.district && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    {preferences.district}
                  </Badge>
                )}
                {preferences.targetPrice && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                    ₹{preferences.targetPrice}/sqft
                  </Badge>
                )}
                {preferences.minAreaSqft && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                    {preferences.minAreaSqft.toLocaleString()} sqft min
                  </Badge>
                )}
                {preferences.preferredType && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                    {preferences.preferredType}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Grid */}
      {recommendations && recommendations.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((warehouse, index) => (
            <Card
              key={`${warehouse.whId}-${index}`}
              className="overflow-hidden glass-card glass-card-hover relative hover-lift shadow-professional"
              style={{ animationDelay: `${index * 100}ms` }}
              data-warehouse-name={warehouse.name}
              data-warehouse-district={warehouse.district}
            >
              {index === 0 && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
                    <Star className="h-3 w-3 mr-1 fill-yellow-200" />
                    Best Match
                  </Badge>
                </div>
              )}

              <div className="aspect-video overflow-hidden relative">
                <img
                  src={warehouse.image || "https://via.placeholder.com/400x225?text=Warehouse+Image"}
                  alt={warehouse.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 right-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(warehouse.matchScore)}`}>
                    {warehouse.matchScore}% match
                  </div>
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{warehouse.rating}</span>
                  </div>
                </div>
                <CardDescription className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {warehouse.location}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-2xl font-bold text-gradient">₹{warehouse.pricePerSqFt}</span>
                    <span className="text-gray-500 text-sm">/sq ft/month</span>
                  </div>
                  <Badge variant="outline" className="border-blue-200">{warehouse.type}</Badge>
                </div>

                <div>
                  <span className="text-sm text-gray-500">Available Space</span>
                  <div className="font-medium text-green-600">
                    {warehouse.availableAreaSqft
                      ? warehouse.availableAreaSqft.toLocaleString()
                      : warehouse.totalAreaSqft?.toLocaleString() || 'N/A'
                    } sq ft
                  </div>
                </div>

                {/* AI Reasoning */}
                {(warehouse.reasons.length > 0 || warehouse.aiInsights) && (
                  <div className="bg-glass rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-600">
                        {warehouse.aiInsights ? "Gemini ML Analysis" : "Why this matches"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {warehouse.aiInsights ? (
                        // Show Gemini insights if available
                        <div className="text-xs text-gray-600 italic border-l-2 border-purple-200 pl-2">
                          "{warehouse.aiInsights[0]}"
                        </div>
                      ) : (
                        // Otherwise show regular reasons
                        warehouse.reasons.slice(0, 2).map((reason, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-xs text-gray-600">
                            <ChevronRight className="h-3 w-3 text-green-500" />
                            <span>{reason.label}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    className="flex-1 btn-professional"
                    asChild
                  >
                    <Link to={`/warehouses/${warehouse.whId}`}>
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="btn-professional-outline">
                    <Target className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-glass border-blue-100 shadow-glow">
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your preferences to find more warehouse options.
            </p>
            <Button
              onClick={() => setCustomizeMode(true)}
              variant="outline"
              className="border-blue-200 hover:bg-blue-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              Update Preferences
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Load More Button */}
      {recommendations.length >= limit && limit < 200 && (
        <div className="flex justify-center">
          <Button
            onClick={() => setLimit(prev => Math.min(prev + 50, 200))}
            disabled={isLoading}
            className="btn-professional group"
            size="lg"
          >
            <TrendingUp className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            Load More Results
            <span className="ml-2 text-sm opacity-80">
              (Showing {recommendations.length}, load {Math.min(50, 200 - limit)} more)
            </span>
            <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      )}

      {/* AI Insights */}
      <Card className="gradient-dark-purple shadow-professional-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-purple-400 pulse" />
            <span className="text-gradient-gold">
              {recommendations.some(w => w.aiInsights) ? 'Gemini ML Insights' : 'ML Insights'}
            </span>
            {recommendations.some(w => w.aiInsights) && (
              <Badge variant="outline" className="ml-2 bg-professional-navy text-purple-300 border-purple-600">
                <Sparkles className="h-3 w-3 mr-1 text-purple-400 animate-pulse-soft" />
                Powered by Gemini
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient-purple mb-1">
                {recommendations.length > 0 ? `${Math.round(recommendations[0]?.matchScore || 0)}%` : '0%'}
              </div>
              <div className="text-sm text-gray-600">Best match score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient-purple mb-1">
                {recommendations.length}
              </div>
              <div className="text-sm text-gray-600">Recommendations found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient-purple mb-1">
                {recommendations.length > 0
                  ? `₹${Math.round(recommendations.reduce((sum, w) => sum + w.pricePerSqFt, 0) / recommendations.length)}`
                  : '₹0'
                }
              </div>
              <div className="text-sm text-gray-600">Average price/sqft</div>
            </div>
          </div>
          <div className="mt-4 p-4 glass-card rounded-lg">
            <div className="flex items-start space-x-2">
              <Bot className="h-4 w-4 text-purple-400 mt-0.5" />
              <div className="text-sm text-slate-300">
                {recommendations.some(w => w.aiInsights) ? (
                  <div>
                    <strong className="text-gradient-gold">Hybrid ML Analysis:</strong> Analyzed hundreds of Mumbai warehouses
                    using K-Nearest Neighbors (KNN) + Random Forest ensemble algorithm. The system evaluated location suitability,
                    price optimization, size matching, and amenity compatibility to select the top {recommendations.length} warehouses
                    that best match your requirements: ₹{preferences.targetPrice || 60}/sqft target, {(preferences.minAreaSqft || 50000).toLocaleString()} sqft minimum area.
                  </div>
                ) : (
                  <div>
                    <strong className="text-gradient-gold">ML Processing:</strong> {
                      recommendations.length > 0
                        ? `Analyzed ${preferences.district === 'Mumbai' ? '488' : '1000+'} warehouses from your ${preferences.district || 'selected'} region using hybrid KNN+Random Forest ML algorithms. Top ${recommendations.length} matches shown based on ${preferences.targetPrice ? `₹${preferences.targetPrice}/sqft budget, ` : ''}${preferences.minAreaSqft ? `${preferences.minAreaSqft.toLocaleString()} sqft minimum, ` : ''}and compatibility scores.`
                        : "Adjust your preferences using the Customize button to get ML-powered recommendations based on location, budget, and requirements."
                    }
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <RecommendationAlgorithmExplainer />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Checker for easier debugging */}
      {(error || recommendations.length === 0) && (
        <div className="mt-6">
          <EnvChecker />
        </div>
      )}

      {/* Customization Modal */}
      <RecommendationCustomizer
        isOpen={customizeMode}
        preferences={preferences}
        onPreferencesChange={(newPrefs) => {
          console.log('🔄 Modal applying new preferences:', JSON.stringify(newPrefs));

          // Clear ALL React Query cache for recommendations
          queryClient.invalidateQueries({ queryKey: ['recommendations'] });
          queryClient.removeQueries({ queryKey: ['recommendations'] });

          // Update preferences (this will trigger new fetch due to Date.now() in queryKey)
          setPreferences(newPrefs);

          console.log('✅ Preferences updated, new fetch will start automatically');
        }}
        onClose={() => setCustomizeMode(false)}
      />
    </div>
  );
}
