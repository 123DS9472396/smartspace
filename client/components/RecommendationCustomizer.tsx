import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Settings, Zap, Target, Brain, Building2, Sparkles, MapPin, DollarSign, AreaChart, Gauge, Shield } from "lucide-react";
import { filterOptions } from "@/data/warehouses";

// Define types locally to avoid import issues
interface RecommendationPreferences {
  district?: string;
  targetPrice?: number;
  minAreaSqft?: number;
  preferredType?: string;
  preferVerified?: boolean;
  preferAvailability?: boolean;
}

interface RecommendationCustomizerProps {
  preferences: RecommendationPreferences;
  onPreferencesChange: (preferences: RecommendationPreferences) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function RecommendationCustomizer({
  preferences,
  onPreferencesChange,
  onClose,
  isOpen
}: RecommendationCustomizerProps) {
  const queryClient = useQueryClient();

  // Always initialize state hooks at the top level, never conditionally
  const [localPrefs, setLocalPrefs] = useState<RecommendationPreferences>(preferences);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  // Always define functions at the top level
  const updatePref = <K extends keyof RecommendationPreferences>(
    key: K,
    value: RecommendationPreferences[K]
  ) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
  };

  // Early return pattern after all hooks are defined
  if (!isOpen) return null;

  const handleApply = () => {
    // NUCLEAR OPTION: Clear all React Query cache before applying new preferences
    queryClient.clear();
    queryClient.removeQueries({ queryKey: ['recommendations'] });
    queryClient.invalidateQueries({ queryKey: ['recommendations'] });

    console.log('🧹 CLEARED ALL CACHE - Applying new preferences:', localPrefs);
    onPreferencesChange(localPrefs);
    onClose();
  };

  const handleReset = () => {
    const defaultPrefs: RecommendationPreferences = {
      preferVerified: true,
      preferAvailability: true,
    };
    setLocalPrefs(defaultPrefs);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-dark border-white/10 shadow-professional-xl">
        <CardHeader className="bg-slate-800/50 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              <div className="flex flex-col">
                <CardTitle className="text-gradient-blue text-lg">ML Recommendation Engine</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure your preferences to get personalized AI-powered warehouse recommendations
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-300 hover:text-white hover:bg-slate-700">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Tabs for Basic/Advanced */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'basic' | 'advanced')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="basic" className="flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Basic Preferences
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                Advanced ML Options
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              {/* Location Preferences */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <Label className="text-base font-medium text-slate-200">Location</Label>
                </div>
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="district" className="text-sm text-slate-300">Preferred District</Label>
                    <Select
                      value={localPrefs.district || "any"}
                      onValueChange={(value) => updatePref('district', value === "any" ? undefined : value)}
                    >
                      <SelectTrigger className="glow-input">
                        <SelectValue placeholder="Any district" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any district</SelectItem>
                        {filterOptions.districts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Budget & Space */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <Label className="text-base font-medium text-slate-200">Budget & Space</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="targetPrice" className="text-sm text-slate-300">Target Price (₹/sqft/month)</Label>
                    <Input
                      id="targetPrice"
                      type="number"
                      placeholder="e.g. 70"
                      min="0"
                      step="1"
                      value={localPrefs.targetPrice || ""}
                      onChange={(e) => updatePref('targetPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="glow-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minArea" className="text-sm text-slate-300">Minimum Area (sqft)</Label>
                    <Input
                      id="minArea"
                      type="number"
                      placeholder="e.g. 50000"
                      min="0"
                      value={localPrefs.minAreaSqft || ""}
                      onChange={(e) => updatePref('minAreaSqft', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="glow-input"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Warehouse Type */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <Label className="text-base font-medium text-slate-200">Warehouse Type</Label>
                </div>
                <Select
                  value={localPrefs.preferredType || "any"}
                  onValueChange={(value) => updatePref('preferredType', value === "any" ? undefined : value)}
                >
                  <SelectTrigger className="glow-input">
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any type</SelectItem>
                    {filterOptions.warehouseTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Quality Preferences */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <Label className="text-base font-medium text-slate-200">Quality Preferences</Label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm text-slate-200">Prefer Verified Facilities</Label>
                    <p className="text-xs text-slate-400">Prioritize warehouses with verified ownership certificates</p>
                  </div>
                  <Switch
                    checked={localPrefs.preferVerified || false}
                    onCheckedChange={(checked) => updatePref('preferVerified', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm text-slate-200">Prefer High Availability</Label>
                    <p className="text-xs text-slate-400">Prioritize warehouses with more available space</p>
                  </div>
                  <Switch
                    checked={localPrefs.preferAvailability || false}
                    onCheckedChange={(checked) => updatePref('preferAvailability', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="glass-dark rounded-lg p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  <h3 className="font-semibold text-slate-100">ML Recommendation Engine</h3>
                </div>
                <p className="text-sm text-slate-300 mb-3">
                  Our AI uses advanced machine learning algorithms including Random Forest and K-Nearest Neighbors
                  to find the best warehouse matches based on your preferences.
                </p>

                {/* Algorithm Selection */}
                <div className="space-y-4 mt-4">
                  <Label className="text-sm">Recommendation Algorithm</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="glass-dark p-3 rounded-lg border border-white/10 cursor-pointer hover:border-purple-400/50 transition-all">
                      <div className="text-center mb-2">
                        <div className="h-8 w-8 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <h4 className="text-xs font-medium text-center text-slate-100">Hybrid</h4>
                      <p className="text-xs text-slate-400 text-center mt-1">Combines all algorithms</p>
                    </div>

                    <div className="glass-dark p-3 rounded-lg border border-white/10 cursor-pointer hover:border-green-400/50 transition-all">
                      <div className="text-center mb-2">
                        <div className="h-8 w-8 mx-auto bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                          <AreaChart className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <h4 className="text-xs font-medium text-center text-slate-100">Random Forest</h4>
                      <p className="text-xs text-slate-400 text-center mt-1">Best for diverse options</p>
                    </div>

                    <div className="glass-dark p-3 rounded-lg border border-white/10 cursor-pointer hover:border-orange-400/50 transition-all">
                      <div className="text-center mb-2">
                        <div className="h-8 w-8 mx-auto bg-gradient-to-br from-orange-600 to-amber-500 rounded-full flex items-center justify-center">
                          <Target className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <h4 className="text-xs font-medium text-center text-slate-100">KNN</h4>
                      <p className="text-xs text-slate-400 text-center mt-1">Best for precision</p>
                    </div>
                  </div>
                </div>

                {/* Preference Weights */}
                <div className="mt-6 space-y-5">
                  <h4 className="text-sm font-medium text-slate-200">Feature Importance</h4>
                  <p className="text-xs text-slate-400">Adjust the importance of each factor in the recommendation algorithm</p>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs text-slate-300">Location</Label>
                        <span className="text-xs font-medium text-purple-400">High</span>
                      </div>
                      <Slider
                        defaultValue={[80]}
                        max={100}
                        step={1}
                        className="py-1"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs text-slate-300">Price</Label>
                        <span className="text-xs font-medium text-purple-400">Medium</span>
                      </div>
                      <Slider
                        defaultValue={[60]}
                        max={100}
                        step={1}
                        className="py-1"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs text-slate-300">Size</Label>
                        <span className="text-xs font-medium text-purple-400">Medium</span>
                      </div>
                      <Slider
                        defaultValue={[60]}
                        max={100}
                        step={1}
                        className="py-1"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs text-slate-300">Amenities</Label>
                        <span className="text-xs font-medium text-purple-400">Low</span>
                      </div>
                      <Slider
                        defaultValue={[40]}
                        max={100}
                        step={1}
                        className="py-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Active Filters Summary */}
          {(localPrefs.district || localPrefs.targetPrice || localPrefs.minAreaSqft || localPrefs.preferredType) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Gauge className="h-4 w-4 text-orange-600" />
                  <Label className="text-base font-medium text-slate-200">Active Filters</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {localPrefs.district && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      <MapPin className="h-3 w-3 mr-1" />
                      {localPrefs.district}
                    </Badge>
                  )}
                  {localPrefs.targetPrice && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ₹{localPrefs.targetPrice}/sqft
                    </Badge>
                  )}
                  {localPrefs.minAreaSqft && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                      <AreaChart className="h-3 w-3 mr-1" />
                      {localPrefs.minAreaSqft.toLocaleString()} sqft min
                    </Badge>
                  )}
                  {localPrefs.preferredType && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                      <Building2 className="h-3 w-3 mr-1" />
                      {localPrefs.preferredType}
                    </Badge>
                  )}
                  {localPrefs.preferVerified && (
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified Only
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ML Explanation */}
          <div className="glass-dark rounded-lg p-4 border border-white/10 mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="h-5 w-5 text-blue-400" />
              <h3 className="font-medium text-slate-100">How Our ML Algorithms Work</h3>
            </div>
            <p className="text-sm text-slate-300">
              Our smart recommendation engine combines multiple ML approaches:
            </p>
            <ul className="text-xs text-slate-400 mt-2 space-y-1 ml-5 list-disc">
              <li>Random Forest creates multiple decision trees to find the best warehouses for your needs</li>
              <li>K-Nearest Neighbors matches warehouses with similar properties to your preferences</li>
              <li>Hybrid approach blends different algorithms for optimal results</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={handleReset} className="hover:bg-red-900/30 border-red-500/50 text-red-400">
              Reset to Default
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose} className="hover:bg-slate-700 border-slate-600 text-slate-300">
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Apply ML Preferences
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
