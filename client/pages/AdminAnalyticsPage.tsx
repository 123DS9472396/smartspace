import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Treemap, ScatterChart, Scatter,
  ComposedChart
} from 'recharts';
import {
  Warehouse, TrendingUp, MapPin, DollarSign, BarChart3, PieChart as PieIcon,
  RefreshCw, ArrowLeft, Building2, Star, Users, Layers, Activity, Package,
  Globe, Filter, LayoutGrid, XCircle, Search
} from 'lucide-react';
import WarehouseExplorer from '../components/WarehouseExplorer';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#a855f7', '#0ea5e9', '#22c55e', '#eab308'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
      <p className="text-slate-300 text-sm font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AdminAnalyticsPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/admin');
      if (!res.ok) {
        const text = await res.text();
        let msg = `Server error (${res.status})`;
        try { msg = JSON.parse(text)?.error || msg; } catch {}
        if (msg.includes('fetch failed') || msg.includes('TypeError')) {
          msg = 'Cannot connect to database. The Supabase project may be paused or there is a network issue. Please check https://supabase.com/dashboard and ensure your project is active.';
        }
        throw new Error(msg);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.analytics);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (profile?.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">Only administrators can access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-slate-300">Loading analytics data...</p>
            <p className="text-slate-500 text-sm mt-1">Analyzing 10,000+ warehouses</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Analytics</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <Button onClick={fetchAnalytics}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const o = data.overview;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-[1400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                Warehouse Analytics
              </h1>
              <p className="text-slate-400 mt-1">{o.totalWarehouses.toLocaleString()} warehouses across {o.uniqueStates} states and {o.uniqueCities} cities</p>
            </div>
          </div>
          <Button onClick={fetchAnalytics} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Warehouses', value: o.totalWarehouses.toLocaleString(), icon: Warehouse, color: 'text-blue-400', bg: 'bg-blue-500/20' },
            { label: 'Total Area', value: `${(o.totalArea / 1000000).toFixed(1)}M sqft`, icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/20' },
            { label: 'Avg Price/sqft', value: `₹${o.avgPrice}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
            { label: 'Avg Occupancy', value: `${o.avgOccupancy}%`, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
            { label: 'Avg Rating', value: `${o.avgRating}★`, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
            { label: 'Unique Owners', value: o.uniqueOwners.toLocaleString(), icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/20' },
          ].map((kpi, i) => (
            <div key={i} className="glass-dark rounded-xl p-4">
              <div className={`${kpi.bg} p-2 rounded-lg w-fit mb-2`}><kpi.icon className={`w-5 h-5 ${kpi.color}`} /></div>
              <p className="text-slate-400 text-xs">{kpi.label}</p>
              <p className="text-xl font-bold text-white">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Price Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-dark rounded-xl p-4 border-l-4 border-green-500">
            <p className="text-slate-400 text-xs">Min Price</p>
            <p className="text-lg font-bold text-green-400">₹{o.minPrice}/sqft</p>
          </div>
          <div className="glass-dark rounded-xl p-4 border-l-4 border-blue-500">
            <p className="text-slate-400 text-xs">Median Price</p>
            <p className="text-lg font-bold text-blue-400">₹{o.medianPrice}/sqft</p>
          </div>
          <div className="glass-dark rounded-xl p-4 border-l-4 border-purple-500">
            <p className="text-slate-400 text-xs">Average Price</p>
            <p className="text-lg font-bold text-purple-400">₹{o.avgPrice}/sqft</p>
          </div>
          <div className="glass-dark rounded-xl p-4 border-l-4 border-red-500">
            <p className="text-slate-400 text-xs">Max Price</p>
            <p className="text-lg font-bold text-red-400">₹{o.maxPrice}/sqft</p>
          </div>
        </div>

        {/* Tabbed Charts */}
        <Tabs defaultValue="geography" className="w-full">
          <TabsList className="bg-slate-800/80 border border-slate-700 mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="geography" className="data-[state=active]:bg-blue-600"><Globe className="w-4 h-4 mr-1" /> Geography</TabsTrigger>
            <TabsTrigger value="pricing" className="data-[state=active]:bg-green-600"><DollarSign className="w-4 h-4 mr-1" /> Pricing</TabsTrigger>
            <TabsTrigger value="capacity" className="data-[state=active]:bg-purple-600"><Layers className="w-4 h-4 mr-1" /> Capacity</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-cyan-600"><TrendingUp className="w-4 h-4 mr-1" /> Performance</TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-yellow-600"><Package className="w-4 h-4 mr-1" /> Features</TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-pink-600"><Star className="w-4 h-4 mr-1" /> Leaderboard</TabsTrigger>
            <TabsTrigger value="explorer" className="data-[state=active]:bg-indigo-600"><Search className="w-4 h-4 mr-1" /> Warehouse Explorer</TabsTrigger>
          </TabsList>

          {/* ─── Geography Tab ─── */}
          <TabsContent value="geography" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* State Distribution Bar */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-400" /> Warehouses by State</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data.stateDistribution.slice(0, 15)} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis type="category" dataKey="state" stroke="#94a3b8" width={75} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Warehouses" radius={[0, 4, 4, 0]}>
                        {data.stateDistribution.slice(0, 15).map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* State Pie Chart */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><PieIcon className="w-5 h-5 text-purple-400" /> State Distribution (%)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie data={data.stateDistribution.slice(0, 10)} cx="50%" cy="50%" outerRadius={130} innerRadius={60} dataKey="count" nameKey="state" label={({ state, percent }: any) => `${state} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#94a3b8' }}>
                        {data.stateDistribution.slice(0, 10).map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Cities Bar */}
              <Card className="bg-slate-800/60 border-slate-700 lg:col-span-2">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-cyan-400" /> Top 20 Cities by Warehouse Count</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.cityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="city" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Warehouses" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Warehouse Type Distribution */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-green-400" /> Warehouse Type Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie data={data.typeDistribution} cx="50%" cy="50%" outerRadius={120} dataKey="count" nameKey="type" label={({ type, percent }: any) => `${type} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#94a3b8' }}>
                        {data.typeDistribution.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-yellow-400" /> Status Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie data={data.statusDistribution} cx="50%" cy="50%" outerRadius={120} innerRadius={50} dataKey="count" nameKey="status" label={({ status, count }: any) => `${status}: ${count}`} labelLine={{ stroke: '#94a3b8' }}>
                        {data.statusDistribution.map((_: any, i: number) => (
                          <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#94a3b8'][i % 5]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Pricing Tab ─── */}
          <TabsContent value="pricing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Price Distribution */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" /> Price Range Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.priceRanges}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="range" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Warehouses" fill="#10b981" radius={[4, 4, 0, 0]}>
                        {data.priceRanges.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Avg Price by State */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-400" /> Avg Price by State (₹/sqft)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={data.avgPriceByState} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis type="category" dataKey="state" stroke="#94a3b8" width={75} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avgPrice" name="Avg ₹/sqft" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      <Line type="monotone" dataKey="count" name="Count" stroke="#f59e0b" dot />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Price vs Area Scatter */}
              <Card className="bg-slate-800/60 border-slate-700 lg:col-span-2">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Filter className="w-5 h-5 text-pink-400" /> Top Warehouses: Price vs Area</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ScatterChart margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="total_area" stroke="#94a3b8" name="Area (sqft)" label={{ value: 'Area (sqft)', position: 'bottom', fill: '#94a3b8' }} />
                      <YAxis dataKey="price_per_sqft" stroke="#94a3b8" name="₹/sqft" label={{ value: '₹/sqft', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                      <Tooltip content={({ payload }: any) => {
                        if (!payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
                            <p className="text-white font-medium text-sm">{d?.name}</p>
                            <p className="text-slate-300 text-xs">{d?.city}, {d?.state}</p>
                            <p className="text-green-400 text-sm">₹{d?.price_per_sqft}/sqft</p>
                            <p className="text-blue-400 text-sm">{Number(d?.total_area).toLocaleString()} sqft</p>
                          </div>
                        );
                      }} />
                      <Scatter data={data.topByArea} fill="#3b82f6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Capacity Tab ─── */}
          <TabsContent value="capacity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Size Distribution */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-purple-400" /> Size Distribution (sqft)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.sizeRanges}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="range" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Warehouses" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {data.sizeRanges.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Occupancy Distribution */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-cyan-400" /> Occupancy Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie data={data.occupancyBuckets} cx="50%" cy="50%" outerRadius={120} innerRadius={50} dataKey="count" nameKey="range" label={({ range, count }: any) => `${range}: ${count}`} labelLine={{ stroke: '#94a3b8' }}>
                        {data.occupancyBuckets.map((_: any, i: number) => (
                          <Cell key={i} fill={['#ef4444', '#f59e0b', '#eab308', '#10b981', '#3b82f6'][i % 5]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Listings Trend */}
              <Card className="bg-slate-800/60 border-slate-700 lg:col-span-2">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Monthly New Listings</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.monthlyListings}>
                      <defs>
                        <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" name="New Listings" stroke="#3b82f6" fill="url(#gradBlue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Performance Tab ─── */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rating Distribution */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> Rating Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.ratingBuckets}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="range" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Warehouses" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                        {data.ratingBuckets.map((_: any, i: number) => (
                          <Cell key={i} fill={['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'][i % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Owner Distribution (top owners by warehouse count) */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Users className="w-5 h-5 text-pink-400" /> Top Owners by Listings</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.topOwners.map((o: any, i: number) => ({ ...o, label: `Owner ${i + 1}` }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Warehouses" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Average Area vs Price per State (Scatter) */}
              <Card className="bg-slate-800/60 border-slate-700 lg:col-span-2">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400" /> State-wise Price Comparison</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={data.avgPriceByState}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="state" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" stroke="#94a3b8" label={{ value: '₹/sqft', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" label={{ value: 'Count', angle: 90, position: 'insideRight', fill: '#94a3b8' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar yAxisId="right" dataKey="count" name="Warehouse Count" fill="#3b82f680" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="left" type="monotone" dataKey="avgPrice" name="Avg Price ₹/sqft" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Features Tab ─── */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Amenities */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Package className="w-5 h-5 text-green-400" /> Top Amenities</CardTitle></CardHeader>
                <CardContent>
                  {data.topAmenities.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={data.topAmenities} layout="vertical" margin={{ left: 120 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis type="category" dataKey="amenity" stroke="#94a3b8" width={115} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Warehouses" fill="#10b981" radius={[0, 4, 4, 0]}>
                          {data.topAmenities.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-400 text-center py-12">No amenity data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Features */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> Top Features</CardTitle></CardHeader>
                <CardContent>
                  {data.topFeatures.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={data.topFeatures} layout="vertical" margin={{ left: 120 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis type="category" dataKey="feature" stroke="#94a3b8" width={115} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Warehouses" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                          {data.topFeatures.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-400 text-center py-12">No feature data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Amenities Radar (top 8) */}
              {data.topAmenities.length > 2 && (
                <Card className="bg-slate-800/60 border-slate-700 lg:col-span-2">
                  <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400" /> Amenities Radar</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={data.topAmenities.slice(0, 8)}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="amenity" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis stroke="#94a3b8" />
                        <Radar name="Count" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ─── Leaderboard Tab ─── */}
          <TabsContent value="leaderboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top by Area */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-blue-400" /> Top 10 by Area (sqft)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.topByArea.map((w: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg hover:bg-slate-700/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-slate-500 w-6">#{i + 1}</span>
                          <div>
                            <p className="text-white text-sm font-medium truncate max-w-[200px]">{w.name}</p>
                            <p className="text-slate-400 text-xs">{w.city}, {w.state}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-blue-400 font-bold">{Number(w.total_area).toLocaleString()} sqft</p>
                          <p className="text-slate-400 text-xs">₹{w.price_per_sqft}/sqft</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top by Price */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" /> Top 10 by Price (₹/sqft)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.topByPrice.map((w: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg hover:bg-slate-700/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-slate-500 w-6">#{i + 1}</span>
                          <div>
                            <p className="text-white text-sm font-medium truncate max-w-[200px]">{w.name}</p>
                            <p className="text-slate-400 text-xs">{w.city}, {w.state}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold">₹{Number(w.price_per_sqft).toLocaleString()}/sqft</p>
                          <p className="text-slate-400 text-xs">{Number(w.total_area).toLocaleString()} sqft</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* ─── Explorer Tab ─── */}
          <TabsContent value="explorer">
            <WarehouseExplorer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
