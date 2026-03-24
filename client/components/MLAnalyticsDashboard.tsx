import { useState, useMemo } from "react";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, LineChart, Line, RadarChart,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Area, AreaChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    TrendingUp, MapPin, Target, BarChart3, Brain,
    Activity, Zap, Download, Share, Building2, Star
} from "lucide-react";
import type { RecommendedWarehouse, RecommendationPreferences } from "@shared/api";

interface MLAnalyticsDashboardProps {
    recommendations: RecommendedWarehouse[];
    preferences: RecommendationPreferences;
    platformStats: {
        totalWarehouses: number;
        totalArea: number;
        averagePrice: number;
        averageRating: number;
        districtsCount: number;
    };
}

const NEON_COLORS = {
    green: "#4ade80",
    blue: "#60a5fa",
    purple: "#a78bfa",
    amber: "#fbbf24",
    pink: "#f472b6",
    cyan: "#22d3ee"
};

const DARK_CHART_COLORS = [
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#10b981", // Emerald
    "#f59e0b"  // Amber
];

export function MLAnalyticsDashboard({
    recommendations,
    preferences,
    platformStats
}: MLAnalyticsDashboardProps) {

    // Calculate statistics
    const stats = useMemo(() => {
        if (!recommendations.length) return null;

        const avgPrice = recommendations.reduce((sum, w) => sum + w.pricePerSqFt, 0) / recommendations.length;
        const avgRating = recommendations.reduce((sum, w) => sum + w.rating, 0) / recommendations.length;
        const avgScore = recommendations.reduce((sum, w) => sum + w.matchScore, 0) / recommendations.length;
        const avgSpace = recommendations.reduce((sum, w) => sum + w.availableAreaSqft, 0) / recommendations.length;

        const districts = [...new Set(recommendations.map(w => w.district))];

        const scoreDistribution = {
            excellent: recommendations.filter(w => w.matchScore >= 90).length,
            good: recommendations.filter(w => w.matchScore >= 80 && w.matchScore < 90).length,
            fair: recommendations.filter(w => w.matchScore >= 70 && w.matchScore < 80).length,
            low: recommendations.filter(w => w.matchScore < 70).length
        };

        return { avgPrice, avgRating, avgScore, avgSpace, districts, scoreDistribution };
    }, [recommendations]);

    // Data for Score Distribution Pie Chart
    const scoreDistributionData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: "Excellent (90%+)", value: stats.scoreDistribution.excellent, color: NEON_COLORS.green },
            { name: "Good (80-89%)", value: stats.scoreDistribution.good, color: NEON_COLORS.blue },
            { name: "Fair (70-79%)", value: stats.scoreDistribution.fair, color: NEON_COLORS.amber },
            { name: "Low (<70%)", value: stats.scoreDistribution.low, color: NEON_COLORS.pink }
        ].filter(d => d.value > 0);
    }, [stats]);

    // Data for Price Comparison Bar Chart
    const priceComparisonData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: "Your Matches", value: Math.round(stats.avgPrice), fill: NEON_COLORS.blue },
            { name: "Market Avg", value: Math.round(platformStats.averagePrice), fill: NEON_COLORS.purple }
        ];
    }, [stats, platformStats]);

    // Data for Top 10 Warehouses Bar Chart
    const topWarehousesData = useMemo(() => {
        return recommendations.slice(0, 8).map(w => ({
            name: w.name.length > 15 ? w.name.substring(0, 15) + "..." : w.name,
            score: w.matchScore,
            price: w.pricePerSqFt
        }));
    }, [recommendations]);

    // Data for Algorithm Performance Radar Chart
    const algorithmRadarData = useMemo(() => {
        if (!stats) return [];
        return [
            { factor: "Location Match", value: preferences.district ? 95 : 50 },
            { factor: "Price Match", value: preferences.targetPrice ? 88 : 50 },
            { factor: "Area Match", value: preferences.minAreaSqft ? 92 : 50 },
            { factor: "Rating Quality", value: 85 },
            { factor: "Availability", value: 78 }
        ];
    }, [stats, preferences]);

    // Data for District Distribution
    const districtData = useMemo(() => {
        const districtCounts: Record<string, number> = {};
        recommendations.forEach(w => {
            districtCounts[w.district] = (districtCounts[w.district] || 0) + 1;
        });
        return Object.entries(districtCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value], i) => ({
                name: name.length > 10 ? name.substring(0, 10) + "..." : name,
                value,
                fill: DARK_CHART_COLORS[i % DARK_CHART_COLORS.length]
            }));
    }, [recommendations]);

    // Price Trend Data
    const priceTrendData = useMemo(() => {
        const sorted = [...recommendations].sort((a, b) => a.pricePerSqFt - b.pricePerSqFt);
        return sorted.slice(0, 10).map((w, i) => ({
            index: i + 1,
            price: w.pricePerSqFt,
            score: w.matchScore
        }));
    }, [recommendations]);

    if (!stats || recommendations.length === 0) {
        return (
            <div className="glass-dark rounded-xl p-8 text-center">
                <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-200">No Data Available</h3>
                <p className="text-slate-400 mt-2">Set your preferences and run the ML analysis to see detailed insights.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Dashboard Header */}
            <div className="glass-dark rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                            <Activity className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-100">Live Analytics Dashboard</h2>
                            <p className="text-sm text-slate-400">Real-time ML insights for {recommendations.length} warehouses</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" className="btn-glass">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button size="sm" className="btn-glass">
                            <Share className="h-4 w-4 mr-2" />
                            Share
                        </Button>
                    </div>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="ml-stats-card p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-green-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Avg Match</span>
                    </div>
                    <div className="text-3xl font-bold text-neon-green">{Math.round(stats.avgScore)}%</div>
                    <div className="text-xs text-slate-500 mt-1">
                        {stats.scoreDistribution.excellent} excellent matches
                    </div>
                </div>

                <div className="ml-stats-card p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Avg Price</span>
                    </div>
                    <div className="text-3xl font-bold text-neon-blue">₹{Math.round(stats.avgPrice)}</div>
                    <div className="text-xs text-slate-500 mt-1">
                        {stats.avgPrice < platformStats.averagePrice ? "Below" : "Above"} market avg
                    </div>
                </div>

                <div className="ml-stats-card p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-amber-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Avg Rating</span>
                    </div>
                    <div className="text-3xl font-bold text-neon-amber">{stats.avgRating.toFixed(1)}</div>
                    <div className="text-xs text-slate-500 mt-1">
                        Out of 5.0 stars
                    </div>
                </div>

                <div className="ml-stats-card p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Districts</span>
                    </div>
                    <div className="text-3xl font-bold text-neon-purple">{stats.districts.length}</div>
                    <div className="text-xs text-slate-500 mt-1">
                        Out of {platformStats.districtsCount} available
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Match Score Distribution Pie Chart */}
                <div className="glass-dark rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-md bg-green-500/20">
                            <Target className="h-4 w-4 text-green-400" />
                        </div>
                        <h3 className="font-semibold text-slate-200">Match Quality Distribution</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={scoreDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                    label={({ name, value }) => `${value}`}
                                    labelLine={false}
                                >
                                    {scoreDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(15, 23, 42, 0.9)',
                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                        borderRadius: '8px',
                                        color: '#e2e8f0'
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Warehouses Performance */}
                <div className="glass-dark rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-md bg-amber-500/20">
                            <BarChart3 className="h-4 w-4 text-amber-400" />
                        </div>
                        <h3 className="font-semibold text-slate-200">Top Warehouse Scores</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topWarehousesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-45} textAnchor="end" height={60} />
                                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(15, 23, 42, 0.9)',
                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                        borderRadius: '8px',
                                        color: '#e2e8f0'
                                    }}
                                />
                                <Bar dataKey="score" fill={NEON_COLORS.green} radius={[4, 4, 0, 0]} name="Match Score %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MLAnalyticsDashboard;
