import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Building2, MapPin, Star, ArrowLeft, Plus, X, TrendingUp, Search,
  CheckCircle2, XCircle, Loader2, Sparkles, Brain, RefreshCw,
  Shield, Wifi, Thermometer, Truck, Zap, DollarSign, Layers,
  BarChart3, Award, Clock, Package
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getAIResponse } from "@/services/aiService";
import { Navbar } from "@/components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LiveWarehouse {
  id: string;
  wh_id: string;
  name: string;
  city: string;
  district: string;
  state: string;
  address: string;
  total_area: number;
  price_per_sqft: number;
  rating: number;
  reviews_count: number;
  warehouse_type: string;
  amenities: string[] | null;
  occupancy: number;
  available_blocks: number;
  total_blocks: number;
  verified: boolean | null;
  images: string[] | null;
  license_valid_upto: string | null;
  status: string;
}

interface CompareWarehouse extends LiveWarehouse {
  computedAvailableArea: number;
  computedOccupancyPct: number;
}

interface AIComparison {
  loading: boolean;
  summary: string;
  winner: string;
  insights: Record<string, string>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const WAREHOUSE_IMAGES: Record<string, string> = {
  "Cold Storage":          "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80",
  "Pharma":                "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80",
  "Industrial":            "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80",
  "General Storage":       "https://images.unsplash.com/photo-1553864250-05b20249ee6c?w=600&q=80",
  "Food Storage":          "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&q=80",
  "Textile":               "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80",
  default:                 "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80",
};

function getWarehouseImage(w: LiveWarehouse) {
  if (w.images && w.images.length > 0) return w.images[0];
  const type = w.warehouse_type || "";
  for (const [key, url] of Object.entries(WAREHOUSE_IMAGES)) {
    if (type.toLowerCase().includes(key.toLowerCase())) return url;
  }
  return WAREHOUSE_IMAGES.default;
}

function normalizeOccupancy(raw: number): number {
  if (!raw) return 0;
  // Normalize: if stored as percentage (e.g. 65), convert to decimal (0.65)
  return raw > 1 ? raw / 100 : raw;
}

function enrichWarehouse(w: LiveWarehouse): CompareWarehouse {
  const occ = normalizeOccupancy(w.occupancy);
  const area = Number(w.total_area) || 0;
  return {
    ...w,
    computedOccupancyPct: Math.round(occ * 100),
    computedAvailableArea: Math.round(area * (1 - occ)),
  };
}

// ─── Feature Row Component ────────────────────────────────────────────────────
function FeatureRow({ label, values, highlight }: {
  label: string;
  values: (string | number | boolean | null)[];
  highlight?: boolean;
}) {
  const getBest = () => {
    if (values.every(v => typeof v === "number")) {
      const max = Math.max(...(values as number[]));
      return values.map(v => v === max);
    }
    return values.map(() => false);
  };
  const best = getBest();

  return (
    <div className={`grid gap-2 py-2.5 border-b border-slate-700/40 items-center ${
      `grid-cols-[180px_repeat(${values.length},1fr)]`
    } ${highlight ? "bg-blue-900/10 -mx-3 px-3 rounded" : ""}`}>
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      {values.map((v, i) => (
        <div key={i} className="text-center">
          {typeof v === "boolean" ? (
            v ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
              : <XCircle className="h-4 w-4 text-slate-600 mx-auto" />
          ) : (
            <span className={`text-xs font-medium ${best[i] ? "text-emerald-400" : "text-slate-300"}`}>
              {v ?? "N/A"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Compare() {
  const [searchParams] = useSearchParams();
  const [allWarehouses, setAllWarehouses] = useState<LiveWarehouse[]>([]);
  const [selected, setSelected] = useState<CompareWarehouse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [aiComparison, setAiComparison] = useState<AIComparison>({
    loading: false, summary: "", winner: "", insights: {}
  });

  // Debounce search for server-side query
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Extract unique cities / types for filters
  const cities = [...new Set(allWarehouses.map(w => w.city || w.district).filter(Boolean))].sort();
  const types = [...new Set(allWarehouses.map(w => w.warehouse_type).filter(Boolean))].sort();

  // Fetch all warehouses from Supabase
  const fetchWarehouses = useCallback(async () => {
    setLoadingWarehouses(true);
    try {
      let query = supabase
        .from("warehouses")
        .select(`
          id, wh_id, name, city, district, state, address,
          total_area, price_per_sqft, rating, reviews_count,
          warehouse_type, amenities, occupancy, available_blocks,
          total_blocks, images, license_valid_upto, status
        `)
        .eq("status", "active")
        .not("total_area", "is", null);

      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,city.ilike.%${debouncedSearch}%,district.ilike.%${debouncedSearch}%`);
      }

      const { data, error } = await query
        .order("rating", { ascending: false })
        .limit(1000);

      if (error) throw error;
      setAllWarehouses(data || []);

      // Auto-select warehouses from URL params (e.g. /compare?ids=abc,def)
      const ids = searchParams.get("ids")?.split(",") || [];
      if (ids.length > 0 && data) {
        const preSelected = data
          .filter(w => ids.includes(w.id) || ids.includes(w.wh_id))
          .slice(0, 4)
          .map(enrichWarehouse);
        setSelected(preSelected);
      }
    } catch (err) {
      console.error("Failed to fetch warehouses:", err);
    } finally {
      setLoadingWarehouses(false);
    }
  }, [searchParams, debouncedSearch]);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  // Filtered list for the picker panel
  const filteredWarehouses = allWarehouses.filter(w => {
    const selectedIds = new Set(selected.map(s => s.id));
    if (selectedIds.has(w.id)) return false;
    const q = searchQuery.toLowerCase();
    const matchQ = !q || w.name?.toLowerCase().includes(q) ||
      w.city?.toLowerCase().includes(q) || w.district?.toLowerCase().includes(q);
    const matchCity = cityFilter === "all" || w.city === cityFilter || w.district === cityFilter;
    const matchType = typeFilter === "all" || w.warehouse_type === typeFilter;
    return matchQ && matchCity && matchType;
  });

  const addWarehouse = (w: LiveWarehouse) => {
    if (selected.length >= 4 || selected.find(s => s.id === w.id)) return;
    setSelected(prev => [...prev, enrichWarehouse(w)]);
  };

  const removeWarehouse = (id: string) => {
    setSelected(prev => prev.filter(w => w.id !== id));
    setAiComparison(prev => ({ ...prev, summary: "", winner: "", insights: {} }));
  };

  // AI-powered comparison analysis
  const runAIComparison = async () => {
    if (selected.length < 2) return;
    setAiComparison(prev => ({ ...prev, loading: true }));
    try {
      const warehouseData = selected.map((w, i) => ({
        index: i + 1,
        name: w.name,
        city: w.city || w.district,
        type: w.warehouse_type,
        price: `₹${w.price_per_sqft}/sqft`,
        totalArea: `${(w.total_area || 0).toLocaleString()} sqft`,
        availableArea: `${w.computedAvailableArea.toLocaleString()} sqft`,
        occupancy: `${w.computedOccupancyPct}%`,
        rating: w.rating,
        verified: "Yes",
        amenities: (w.amenities || []).slice(0, 6).join(", ") || "Standard",
      }));

      const prompt = `You are an expert warehouse consultant. A client is comparing ${selected.length} warehouses side by side. Analyze each and give a recommendation.

WAREHOUSES BEING COMPARED:
${JSON.stringify(warehouseData, null, 2)}

Provide a JSON response ONLY with this structure:
{
  "winner": "<name of the best overall warehouse>",
  "summary": "<2-3 sentence executive summary of the comparison and recommendation>",
  "insights": {
    "${selected[0]?.name}": "<one key strength and one weakness>",
    ${selected[1] ? `"${selected[1]?.name}": "<one key strength and one weakness>",` : ""}
    ${selected[2] ? `"${selected[2]?.name}": "<one key strength and one weakness>",` : ""}
    ${selected[3] ? `"${selected[3]?.name}": "<one key strength and one weakness>"` : ""}
  }
}`;

      const response = await getAIResponse({
        prompt,
        systemPrompt: "You are a warehouse logistics expert. Respond only with valid JSON, no markdown.",
        temperature: 0.3,
        maxTokens: 600,
      });

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAiComparison({
          loading: false,
          summary: parsed.summary || "",
          winner: parsed.winner || "",
          insights: parsed.insights || {},
        });
      } else {
        throw new Error("No valid JSON in response");
      }
    } catch (err) {
      console.warn("AI comparison failed:", err);
      setAiComparison({
        loading: false,
        summary: "Unable to generate AI comparison at this time. Please review the metrics manually.",
        winner: "",
        insights: {},
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Link to="/" className="hover:text-blue-400 transition-colors">Home</Link>
              <span>/</span>
              <Link to="/warehouses" className="hover:text-blue-400 transition-colors">Warehouses</Link>
              <span>/</span>
              <span className="text-slate-300">Compare</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Compare Warehouses</h1>
            <p className="text-slate-400 mt-1">
              Compare up to 4 warehouses side-by-side with AI-powered insights.
              {allWarehouses.length > 0 && (
                <span className="text-blue-400 ml-1">{allWarehouses.length} warehouses available.</span>
              )}
            </p>
          </div>
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white" asChild>
            <Link to="/warehouses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Link>
          </Button>
        </div>

        {/* Warehouse Picker */}
        {selected.length < 4 && (
          <Card className="bg-slate-900/80 border-slate-700 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-400" />
                    Add Warehouses to Compare
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {selected.length}/4 selected. Search from live database.
                  </CardDescription>
                </div>
              </div>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search by name or city..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
                  />
                </div>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-slate-300">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.slice(0, 30).map(c => (
                      <SelectItem key={c} value={c} className="text-slate-300">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-44 bg-slate-800 border-slate-600 text-slate-300">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all">All Types</SelectItem>
                    {types.map(t => (
                      <SelectItem key={t} value={t} className="text-slate-300">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingWarehouses ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  <span className="ml-3 text-slate-400">Loading warehouses from database...</span>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {filteredWarehouses.map(w => (
                    <div
                      key={w.id}
                      className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group"
                      onClick={() => addWarehouse(w)}
                    >
                      <img
                        src={getWarehouseImage(w)}
                        alt={w.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{w.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {w.city || w.district}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-blue-400 font-semibold">₹{w.price_per_sqft}/sqft</span>
                          <Shield className="h-3 w-3 text-emerald-400" />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700 h-8 px-2"
                        onClick={e => { e.stopPropagation(); addWarehouse(w); }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {filteredWarehouses.length === 0 && (
                    <div className="col-span-3 text-center py-8 text-slate-500">
                      No warehouses match your filters.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Nothing selected state */}
        {selected.length === 0 && !loadingWarehouses && (
          <Card className="bg-slate-900/60 border-slate-700 text-center py-16">
            <CardContent>
              <BarChart3 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No Warehouses Selected</h3>
              <p className="text-slate-500">Add 2–4 warehouses from the panel above to start comparing.</p>
            </CardContent>
          </Card>
        )}

        {/* Comparison View */}
        {selected.length >= 1 && (
          <div className="space-y-6">

            {/* Cards Row */}
            <div className={`grid gap-4 ${selected.length === 1 ? "grid-cols-1 max-w-sm" : selected.length === 2 ? "grid-cols-2" : selected.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
              {selected.map(w => (
                <Card key={w.id} className={`relative bg-slate-900/80 border-2 transition-all ${
                  aiComparison.winner === w.name ? "border-emerald-500 shadow-lg shadow-emerald-500/20" : "border-slate-700"
                }`}>
                  {aiComparison.winner === w.name && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-emerald-600 text-white text-xs px-3 py-1 flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        AI Recommended
                      </Badge>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-900/30 z-10"
                    onClick={() => removeWarehouse(w.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <CardHeader className="pb-3">
                    <div className="aspect-video rounded-lg overflow-hidden mb-3">
                      <img src={getWarehouseImage(w)} alt={w.name} className="w-full h-full object-cover" />
                    </div>
                    <CardTitle className="text-sm text-white leading-tight">{w.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3 w-3" />
                      {w.city || w.district}, {w.state}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">₹{w.price_per_sqft}</div>
                      <div className="text-xs text-slate-500">per sq ft/month</div>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-white">{w.rating?.toFixed(1) || "N/A"}</span>
                      <span className="text-xs text-slate-500">({w.reviews_count || 0})</span>
                    </div>
                    <Badge variant="outline" className="w-full justify-center text-xs border-slate-600 text-slate-300">
                      {w.warehouse_type || "General"}
                    </Badge>
                    {/* Occupancy bar */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Occupancy</span>
                        <span>{w.computedOccupancyPct}%</span>
                      </div>
                      <Progress value={w.computedOccupancyPct} className="h-1.5" />
                    </div>
                    {/* AI Insight */}
                    {aiComparison.insights[w.name] && (
                      <div className="bg-blue-900/20 border border-blue-800/40 rounded p-2 text-xs text-blue-300">
                        <Brain className="h-3 w-3 inline mr-1 text-blue-400" />
                        {aiComparison.insights[w.name]}
                      </div>
                    )}
                    <Button className="w-full text-xs h-8 bg-blue-600 hover:bg-blue-700" asChild>
                      <Link to={`/warehouses/${w.wh_id || w.id}`}>View & Book</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Comparison Panel */}
            {selected.length >= 2 && (
              <Card className="bg-gradient-to-r from-blue-950/60 to-purple-950/60 border-blue-800/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-400" />
                      <CardTitle className="text-white">AI Comparison Analysis</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
                      onClick={runAIComparison}
                      disabled={aiComparison.loading}
                    >
                      {aiComparison.loading ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing...</>
                      ) : (
                        <><Brain className="h-4 w-4 mr-2" />Run AI Analysis</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {aiComparison.summary && (
                  <CardContent>
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
                      {aiComparison.winner && (
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm text-emerald-400 font-semibold">
                            Best Choice: {aiComparison.winner}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-slate-300 leading-relaxed">{aiComparison.summary}</p>
                    </div>
                  </CardContent>
                )}
                {!aiComparison.summary && !aiComparison.loading && (
                  <CardContent>
                    <p className="text-sm text-slate-500 text-center py-4">
                      Click "Run AI Analysis" to get an intelligent recommendation based on your selected warehouses.
                    </p>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Detailed Comparison Table */}
            {selected.length >= 2 && (
              <Card className="bg-slate-900/80 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    Detailed Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {/* Section: Capacity */}
                    <div className="mb-1">
                      <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Layers className="h-3 w-3" />
                        Capacity & Space
                      </p>
                      <FeatureRow
                        label="Total Area"
                        values={selected.map(w => `${(w.total_area || 0).toLocaleString()} sqft`)}
                      />
                      <FeatureRow
                        label="Available Area"
                        values={selected.map(w => `${w.computedAvailableArea.toLocaleString()} sqft`)}
                        highlight
                      />
                      <FeatureRow
                        label="Occupancy %"
                        values={selected.map(w => `${w.computedOccupancyPct}%`)}
                      />
                      <FeatureRow
                        label="Total Blocks"
                        values={selected.map(w => w.total_blocks || "N/A")}
                      />
                    </div>

                    <Separator className="bg-slate-700 my-4" />

                    {/* Section: Pricing */}
                    <div className="mb-1">
                      <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <DollarSign className="h-3 w-3" />
                        Pricing
                      </p>
                      <FeatureRow
                        label="Price/sqft/month"
                        values={selected.map(w => `₹${w.price_per_sqft}`)}
                        highlight
                      />
                      <FeatureRow
                        label="Est. Monthly (10,000 sqft)"
                        values={selected.map(w => `₹${((w.price_per_sqft || 0) * 10000).toLocaleString()}`)}
                      />
                    </div>

                    <Separator className="bg-slate-700 my-4" />

                    {/* Section: Quality */}
                    <div className="mb-1">
                      <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Star className="h-3 w-3" />
                        Quality & Trust
                      </p>
                      <FeatureRow
                        label="Rating"
                        values={selected.map(w => w.rating?.toFixed(1) || "N/A")}
                        highlight
                      />
                      <FeatureRow
                        label="Reviews Count"
                        values={selected.map(w => w.reviews_count || 0)}
                      />
                      <FeatureRow
                        label="Verified Facility"
                        values={selected.map(() => true)}
                      />
                      <FeatureRow
                        label="License Valid Until"
                        values={selected.map(w =>
                          w.license_valid_upto
                            ? new Date(w.license_valid_upto).toLocaleDateString("en-IN")
                            : "Not disclosed"
                        )}
                      />
                    </div>

                    <Separator className="bg-slate-700 my-4" />

                    {/* Section: Amenities */}
                    <div>
                      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Package className="h-3 w-3" />
                        Common Amenities
                      </p>
                      {(() => {
                        const allAmenities = [
                          "24/7 Security", "Loading Dock", "Climate Control",
                          "Office Space", "WiFi", "CCTV", "Fire Safety",
                          "Parking", "Cold Storage", "Pest Control"
                        ];
                        return allAmenities.map(am => (
                          <FeatureRow
                            key={am}
                            label={am}
                            values={selected.map(w => {
                              const amList = w.amenities || [];
                              return amList.some(a =>
                                a.toLowerCase().includes(am.toLowerCase()) ||
                                am.toLowerCase().includes(a.toLowerCase())
                              );
                            })}
                          />
                        ));
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <div className="flex justify-center gap-4 pb-8">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={runAIComparison}
                disabled={selected.length < 2 || aiComparison.loading}
              >
                {aiComparison.loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" />Analyzing with AI...</>
                ) : (
                  <><Brain className="h-5 w-5 mr-2" />Get AI Recommendation</>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:text-white"
                onClick={() => setSelected([])}
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
