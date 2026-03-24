import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bot, Star, MapPin, Building2, Users, ArrowRight, RefreshCw, Settings, Brain, Zap, Target, ChartBar as BarChart3, TrendingUp, Filter, Info, ChevronRight, Clock, Save, Share, CircleHelp as HelpCircle, Sparkles, Download, TriangleAlert as AlertTriangle, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useSmartRecommendations } from "@/hooks/use-recommendations";
import RecommendationCustomizer from "@/components/RecommendationCustomizer";
import MLRecommendations from "@/components/MLRecommendations";
import MLAnalyticsDashboard from "@/components/MLAnalyticsDashboard";
import EnvChecker from "@/components/EnvChecker";
import { Navbar } from "@/components/Navbar";
import GeminiApiKeySetup from "@/components/GeminiApiKeySetup";
import { platformStats, filterOptions } from "@/data/warehouses";

export default function MLRecommendationsPage() {
  const {
    data,
    isLoading,
    error,
    refetch,
    preferences,
    setPreferences,
    customizeMode,
    setCustomizeMode,
    clearPreferences,
    limit,
    setLimit
  } = useSmartRecommendations();

  const recommendations = data?.items || [];
  const [activeTab, setActiveTab] = useState("recommendations");
  const [showInsights, setShowInsights] = useState(true);
  const [compareWarehouseIds, setCompareWarehouseIds] = useState<string[]>([]);

  // Toggle warehouse selection for comparison
  const toggleWarehouseComparison = (whId: string) => {
    if (compareWarehouseIds.includes(whId)) {
      setCompareWarehouseIds(compareWarehouseIds.filter(id => id !== whId));
    } else {
      if (compareWarehouseIds.length < 3) {
        setCompareWarehouseIds([...compareWarehouseIds, whId]);
      }
    }
  };

  // Helper to get color based on match score
  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 80) return "text-blue-600 bg-blue-100";
    if (score >= 70) return "text-orange-600 bg-orange-100";
    return "text-gray-600 bg-gray-100";
  };

  // Calculate statistics about recommendations
  const getRecommendationStats = () => {
    if (!recommendations || recommendations.length === 0) return null;

    const avgPrice = recommendations.reduce((sum, w) => sum + w.pricePerSqFt, 0) / recommendations.length;
    const avgSpace = recommendations.reduce((sum, w) => sum + w.totalAreaSqft, 0) / recommendations.length;
    const avgRating = recommendations.reduce((sum, w) => sum + w.rating, 0) / recommendations.length;
    const avgScore = recommendations.reduce((sum, w) => sum + w.matchScore, 0) / recommendations.length;
    const districtCount = new Set(recommendations.map(w => w.district)).size;

    return {
      avgPrice,
      avgSpace,
      avgRating,
      avgScore,
      districtCount,
      topScore: recommendations.length > 0 ? recommendations[0].matchScore : 0
    };
  };

  const stats = getRecommendationStats();

  return (
    <div className="min-h-screen bg-gradient-warehouse relative">
      <div className="bg-decoration"></div>
      <Navbar />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 fade-in">
          <h1 className="text-3xl font-bold text-gradient-premium flex items-center gap-3">
            <div className="relative">
              <Bot className="h-10 w-10 text-blue-400 glow-animate" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
            LLM Warehouse Recommendations
          </h1>
          <p className="text-lg text-slate-300 mt-3">
            Personalized warehouse suggestions powered by an <span className="text-neon-blue font-medium">LLM-first ranking engine</span>
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="recommendations" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center glass-dark p-3 rounded-xl fade-in">
            <TabsList className="tabs-glass">
              <TabsTrigger value="recommendations" className="tab-item-glass flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="insights" className="tab-item-glass flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                AI Insights
              </TabsTrigger>
              <TabsTrigger value="how-it-works" className="tab-item-glass flex items-center gap-2">
                <Brain className="h-4 w-4" />
                How It Works
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-3">
              <Button
                size="sm"
                onClick={() => setCustomizeMode(true)}
                className="btn-glass"
              >
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
              <Button
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="btn-glass"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button size="sm" asChild className="btn-glass-primary">
                <Link to="/warehouses">
                  <Building2 className="h-4 w-4 mr-2" />
                  All Warehouses
                </Link>
              </Button>
            </div>
          </div>

          <TabsContent value="recommendations" className="space-y-6">
            {/* Gemini API Key Setup Guide */}
            <GeminiApiKeySetup />

            {/* Active Filters Summary */}
            {(preferences.district || preferences.targetPrice || preferences.minAreaSqft || preferences.preferredType) && (
              <div className="preferences-card-dark p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Filter className="h-5 w-5 text-blue-400" />
                    <span className="text-sm font-medium text-slate-200">Active Preferences:</span>
                    <div className="flex flex-wrap gap-2">
                      {preferences.district && (
                        <span className="badge-premium badge-location inline-flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {preferences.district}
                        </span>
                      )}
                      {preferences.targetPrice && (
                        <span className="badge-premium badge-price inline-flex items-center">
                          <Zap className="h-3 w-3 mr-1" />
                          ₹{preferences.targetPrice}/sqft
                        </span>
                      )}
                      {preferences.minAreaSqft && (
                        <span className="badge-premium badge-area inline-flex items-center">
                          <Target className="h-3 w-3 mr-1" />
                          {preferences.minAreaSqft.toLocaleString()} sqft min
                        </span>
                      )}
                      {preferences.preferredType && (
                        <span className="badge-premium badge-type inline-flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {preferences.preferredType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Button variant="ghost" size="sm" onClick={clearPreferences} className="text-slate-300 hover:text-white hover:bg-slate-700/50">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stat Cards */}
            {stats && recommendations.length > 0 && showInsights && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="ml-stats-card p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Best Match</p>
                      <p className="text-3xl font-bold ml-score-display">{stats.topScore}%</p>
                    </div>
                    <Target className="h-10 w-10 text-green-500/30" />
                  </div>
                </div>
                <div className="ml-stats-card p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Avg. Price</p>
                      <p className="text-3xl font-bold text-neon-blue">₹{Math.round(stats.avgPrice)}</p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-blue-500/30" />
                  </div>
                </div>
                <div className="ml-stats-card p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Avg. Rating</p>
                      <p className="text-3xl font-bold text-neon-amber">{stats.avgRating.toFixed(1)}</p>
                    </div>
                    <Star className="h-10 w-10 text-amber-500/30" />
                  </div>
                </div>
                <div className="ml-stats-card p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Found In</p>
                      <p className="text-3xl font-bold text-neon-purple">{stats.districtCount} districts</p>
                    </div>
                    <MapPin className="h-10 w-10 text-purple-500/30" />
                  </div>
                </div>
              </div>
            )}

            {/* Main Recommendations */}
            <MLRecommendations
              recommendations={recommendations}
              preferences={preferences}
              setPreferences={setPreferences}
              isLoading={isLoading}
              error={error}
              refetch={refetch}
              customizeMode={customizeMode}
              setCustomizeMode={setCustomizeMode}
              limit={limit}
              setLimit={setLimit}
            />

            {/* Compare Selected */}
            {compareWarehouseIds.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-20">
                <div className="container mx-auto">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100">
                        {compareWarehouseIds.length} selected
                      </Badge>
                      <span className="text-sm font-medium">Compare warehouses</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompareWarehouseIds([])}
                      >
                        Clear
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        disabled={compareWarehouseIds.length < 2}
                      >
                        <Link to={`/compare?ids=${compareWarehouseIds.join(',')}`}>
                          Compare
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <MLAnalyticsDashboard
              recommendations={recommendations}
              preferences={preferences}
              platformStats={platformStats}
            />
          </TabsContent>


          <TabsContent value="how-it-works" className="space-y-6">
            {/* System Status Card */}
            <div className="glass-dark rounded-xl p-5 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span className="font-semibold text-slate-200">System Status</span>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                If you're experiencing issues with recommendations or seeing empty results, use the diagnostic tool below.
              </p>
              <EnvChecker />
            </div>

            {/* How It Works Card */}
            <div className="glass-dark rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                  <Brain className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">How Our LLM Ranking Works</h3>
                  <p className="text-sm text-slate-400">LLM-first ranking with heuristic guardrails</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Algorithm Weights */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <h4 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    Scoring Factors
                  </h4>
                  <div className="space-y-3">
                    {[
                      { name: "Location Match", weight: "25%", color: "bg-blue-500" },
                      { name: "Price Optimization", weight: "20%", color: "bg-green-500" },
                      { name: "Area Requirements", weight: "20%", color: "bg-amber-500" },
                      { name: "Type Preference", weight: "15%", color: "bg-purple-500" },
                      { name: "Availability", weight: "15%", color: "bg-pink-500" },
                      { name: "Quality Rating", weight: "5%", color: "bg-cyan-500" }
                    ].map((factor, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${factor.color}`} />
                          <span className="text-sm text-slate-300">{factor.name}</span>
                        </div>
                        <span className="badge-premium text-xs">{factor.weight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Match Score Legend */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <h4 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-400" />
                    Match Score Guide
                  </h4>
                  <div className="space-y-3">
                    {[
                      { range: "90-100%", label: "Perfect Match", color: "text-green-400", dot: "bg-green-400" },
                      { range: "80-89%", label: "Excellent Match", color: "text-blue-400", dot: "bg-blue-400" },
                      { range: "70-79%", label: "Good Match", color: "text-amber-400", dot: "bg-amber-400" },
                      { range: "<70%", label: "Fair Match", color: "text-slate-400", dot: "bg-slate-400" }
                    ].map((score, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${score.dot}`} />
                        <span className={`text-sm font-medium ${score.color}`}>{score.range}</span>
                        <span className="text-sm text-slate-400">{score.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className="my-6 bg-slate-700/50" />

              {/* Algorithm Pipeline */}
              <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <h4 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  5-Algorithm Ensemble Pipeline
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {["KNN", "Random Forest", "XGBoost", "Neural Net", "TF-IDF"].map((algo, i) => (
                    <div key={i} className="text-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                      <div className="text-xs text-indigo-400 font-medium">{algo}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Step {i + 1}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  All algorithms run in parallel with dynamic weight adjustment for optimal accuracy
                </p>
              </div>
            </div>

            {/* Tips Section */}
            <div className="glass-dark rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Tips for Best Results
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { step: "1", title: "Be Specific", desc: "Choose a specific district for focused results" },
                  { step: "2", title: "Set Budget", desc: "Include target price for value optimization" },
                  { step: "3", title: "Specify Area", desc: "Set minimum sqft for accurate matches" },
                  { step: "4", title: "Choose Type", desc: "Select warehouse type for specialized needs" },
                  { step: "5", title: "Quality Filters", desc: "Enable verified & availability filters" },
                  { step: "6", title: "Iterate", desc: "Refine preferences based on results" }
                ].map((tip, i) => (
                  <div key={i} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-400">{tip.step}</span>
                      </div>
                      <span className="font-medium text-slate-200">{tip.title}</span>
                    </div>
                    <p className="text-xs text-slate-400">{tip.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Customization Modal */}
      <RecommendationCustomizer
        isOpen={customizeMode}
        preferences={preferences}
        onPreferencesChange={setPreferences}
        onClose={() => setCustomizeMode(false)}
      />
    </div>
  );
}
