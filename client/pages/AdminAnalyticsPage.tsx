import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ComposedChart
} from 'recharts';
import { Warehouse, TrendingUp, MapPin, DollarSign, ChartBar as BarChart3, ChartPie as PieIcon, RefreshCw, ArrowLeft, Building2, Star, Users, Layers, Activity, Package, Globe, LayoutGrid, Circle as XCircle, Search, ChevronRight, Award, Zap } from 'lucide-react';
import WarehouseExplorer from '../components/WarehouseExplorer';

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#a855f7', '#0ea5e9', '#22c55e', '#eab308'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/98 border border-slate-600/80 rounded-xl p-3 shadow-2xl backdrop-blur-md">
      <p className="text-slate-300 text-xs font-medium mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: <span>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
};

type TabKey = 'geography' | 'pricing' | 'capacity' | 'performance' | 'features' | 'leaderboard' | 'explorer';

const TABS: { key: TabKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'geography', label: 'Geography', icon: Globe, color: 'text-blue-400' },
  { key: 'pricing', label: 'Pricing', icon: DollarSign, color: 'text-green-400' },
  { key: 'capacity', label: 'Capacity', icon: Layers, color: 'text-cyan-400' },
  { key: 'performance', label: 'Performance', icon: TrendingUp, color: 'text-yellow-400' },
  { key: 'features', label: 'Features', icon: Package, color: 'text-pink-400' },
  { key: 'leaderboard', label: 'Leaderboard', icon: Award, color: 'text-orange-400' },
  { key: 'explorer', label: 'Explorer', icon: Search, color: 'text-slate-300' },
];

const ChartCard = ({ title, subtitle, icon: Icon, iconColor = 'text-blue-400', children, span = 1 }: {
  title: string; subtitle?: string; icon?: React.ElementType; iconColor?: string; children: React.ReactNode; span?: number;
}) => (
  <div className={`rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-6 ${span === 2 ? 'lg:col-span-2' : ''}`}>
    <div className="flex items-center gap-2 mb-5">
      {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
      <div>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

export default function AdminAnalyticsPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('geography');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/admin');
      if (!res.ok) {
        const text = await res.text();
        let msg = `Server error (${res.status})`;
        try { msg = JSON.parse(text)?.error || msg; } catch {}
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
      <div className="min-h-screen bg-[#070b14]">
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
      <div className="min-h-screen bg-[#070b14] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" style={{ animationDuration: '0.8s' }}></div>
              <div className="absolute inset-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-white font-semibold text-lg">Crunching Analytics</p>
            <p className="text-slate-500 text-sm">Analyzing warehouse data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <XCircle className="w-16 h-16 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Error Loading Analytics</h2>
            <p className="text-slate-400 max-w-sm">{error}</p>
            <Button onClick={fetchAnalytics} className="bg-blue-600 hover:bg-blue-700">Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const o = data.overview;

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/6 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-green-500/4 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-[1600px] mx-auto px-6 py-8" style={{ zIndex: 1 }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard
              </Button>
            </Link>
            <div className="w-px h-6 bg-slate-700"></div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h1 className="text-2xl font-bold text-white tracking-tight">Warehouse Analytics</h1>
              </div>
              <p className="text-slate-400 text-sm">{o.totalWarehouses.toLocaleString()} warehouses · {o.uniqueStates} states · {o.uniqueCities} cities</p>
            </div>
          </div>
          <Button onClick={fetchAnalytics} variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Total Warehouses', value: o.totalWarehouses.toLocaleString(), icon: Warehouse, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            { label: 'Total Area', value: `${(o.totalArea / 1000000).toFixed(1)}M sqft`, icon: Layers, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            { label: 'Avg Price/sqft', value: `₹${o.avgPrice}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
            { label: 'Avg Occupancy', value: `${o.avgOccupancy}%`, icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
            { label: 'Avg Rating', value: `${o.avgRating}★`, icon: Star, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            { label: 'Unique Owners', value: o.uniqueOwners.toLocaleString(), icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
          ].map((kpi, i) => (
            <div key={i} className={`rounded-2xl border ${kpi.border} bg-slate-900/80 backdrop-blur-sm p-4 hover:-translate-y-0.5 transition-transform duration-200`}>
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} border ${kpi.border} flex items-center justify-center mb-2`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-slate-400 text-xs mb-0.5">{kpi.label}</p>
              <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Price Band Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Min Price', value: `₹${o.minPrice}/sqft`, color: 'text-green-400', bar: 'bg-green-500', accent: 'border-green-500/30' },
            { label: 'Median Price', value: `₹${o.medianPrice}/sqft`, color: 'text-blue-400', bar: 'bg-blue-500', accent: 'border-blue-500/30' },
            { label: 'Average Price', value: `₹${o.avgPrice}/sqft`, color: 'text-cyan-400', bar: 'bg-cyan-500', accent: 'border-cyan-500/30' },
            { label: 'Max Price', value: `₹${o.maxPrice}/sqft`, color: 'text-red-400', bar: 'bg-red-500', accent: 'border-red-500/30' },
          ].map((p, i) => (
            <div key={i} className={`rounded-xl border ${p.accent} bg-slate-900/60 p-4`}>
              <div className={`h-0.5 w-8 ${p.bar} rounded-full mb-2`}></div>
              <p className="text-slate-400 text-xs mb-1">{p.label}</p>
              <p className={`text-base font-bold ${p.color}`}>{p.value}</p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 bg-slate-900/60 border border-slate-700/50 rounded-2xl p-1.5 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.key
                  ? 'bg-slate-800 text-white shadow-lg border border-slate-600/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.key ? tab.color : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Geography Tab */}
        {activeTab === 'geography' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Warehouses by State" icon={MapPin} iconColor="text-blue-400" subtitle="Top 15 states">
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={data.stateDistribution.slice(0, 15)} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="state" stroke="#475569" width={75} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Warehouses" radius={[0, 4, 4, 0]}>
                      {data.stateDistribution.slice(0, 15).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="State Distribution" icon={PieIcon} iconColor="text-cyan-400" subtitle="Market share by state">
                <ResponsiveContainer width="100%" height={380}>
                  <PieChart>
                    <Pie data={data.stateDistribution.slice(0, 10)} cx="50%" cy="50%" outerRadius={130} innerRadius={55} dataKey="count" nameKey="state" label={({ state, percent }: any) => `${state} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#475569', strokeWidth: 1 }}>
                      {data.stateDistribution.slice(0, 10).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Top 20 Cities" icon={Building2} iconColor="text-yellow-400" subtitle="By warehouse count" span={2}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.cityDistribution} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="city" stroke="#475569" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Warehouses" radius={[4, 4, 0, 0]}>
                      {data.cityDistribution.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Warehouse Types" icon={LayoutGrid} iconColor="text-green-400" subtitle="Distribution by category">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data.typeDistribution} cx="50%" cy="50%" outerRadius={110} dataKey="count" nameKey="type" label={({ type, percent }: any) => `${type} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#475569', strokeWidth: 1 }}>
                      {data.typeDistribution.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Listing Status" icon={Activity} iconColor="text-orange-400" subtitle="Active vs pending">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data.statusDistribution} cx="50%" cy="50%" outerRadius={110} innerRadius={50} dataKey="count" nameKey="status" label={({ status, count }: any) => `${status}: ${count}`} labelLine={{ stroke: '#475569', strokeWidth: 1 }}>
                      {data.statusDistribution.map((_: any, i: number) => (
                        <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#94a3b8'][i % 5]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Price Range Distribution" icon={DollarSign} iconColor="text-green-400" subtitle="Number of warehouses per price band">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.priceRanges} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="range" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Warehouses" radius={[5, 5, 0, 0]}>
                      {data.priceRanges.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Average Price by State" icon={TrendingUp} iconColor="text-blue-400" subtitle="₹/sqft with warehouse count">
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={data.avgPriceByState} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="state" stroke="#475569" width={75} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avgPrice" name="Avg ₹/sqft" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Line type="monotone" dataKey="count" name="Count" stroke="#f59e0b" dot={{ fill: '#f59e0b', r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Price vs Area Scatter" icon={Activity} iconColor="text-pink-400" subtitle="Top warehouses — price vs size" span={2}>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart margin={{ bottom: 20, left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="total_area" stroke="#475569" name="Area (sqft)" label={{ value: 'Area (sqft)', position: 'bottom', fill: '#94a3b8', fontSize: 11 }} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis dataKey="price_per_sqft" stroke="#475569" name="₹/sqft" label={{ value: '₹/sqft', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip content={({ payload }: any) => {
                      if (!payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="bg-slate-900/98 border border-slate-600 rounded-xl p-3 shadow-2xl">
                          <p className="text-white font-medium text-sm">{d?.name}</p>
                          <p className="text-slate-400 text-xs">{d?.city}, {d?.state}</p>
                          <p className="text-green-400 text-sm mt-1">₹{d?.price_per_sqft}/sqft</p>
                          <p className="text-blue-400 text-sm">{Number(d?.total_area).toLocaleString()} sqft</p>
                        </div>
                      );
                    }} />
                    <Scatter data={data.topByArea} fill="#3b82f6" opacity={0.8} />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* Capacity Tab */}
        {activeTab === 'capacity' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Size Distribution" icon={Layers} iconColor="text-cyan-400" subtitle="Warehouse footprint ranges (sqft)">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.sizeRanges} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="range" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Warehouses" radius={[5, 5, 0, 0]}>
                      {data.sizeRanges.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Occupancy Distribution" icon={Activity} iconColor="text-yellow-400" subtitle="How full are the warehouses?">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={data.occupancyBuckets} cx="50%" cy="50%" outerRadius={115} innerRadius={50} dataKey="count" nameKey="range" label={({ range, count }: any) => `${range}: ${count}`} labelLine={{ stroke: '#475569', strokeWidth: 1 }}>
                      {data.occupancyBuckets.map((_: any, i: number) => (
                        <Cell key={i} fill={['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'][i % 5]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Monthly New Listings" icon={TrendingUp} iconColor="text-green-400" subtitle="Warehouse addition trend" span={2}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.monthlyListings} margin={{ top: 5, right: 10 }}>
                    <defs>
                      <linearGradient id="gradListings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="New Listings" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradListings)" dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Rating Distribution" icon={Star} iconColor="text-yellow-400" subtitle="Warehouse quality scores">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.ratingBuckets} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="range" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Warehouses" radius={[5, 5, 0, 0]}>
                      {data.ratingBuckets.map((_: any, i: number) => (
                        <Cell key={i} fill={['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Top Owners by Listings" icon={Users} iconColor="text-pink-400" subtitle="Most prolific warehouse operators">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.topOwners.map((o: any, i: number) => ({ ...o, label: `Owner ${i + 1}` }))} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="label" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Warehouses" fill="#ec4899" radius={[5, 5, 0, 0]}>
                      {data.topOwners.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="State-wise Price vs Count" icon={Globe} iconColor="text-blue-400" subtitle="Dual axis comparison" span={2}>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={data.avgPriceByState}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="state" stroke="#475569" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                    <Bar yAxisId="right" dataKey="count" name="Warehouse Count" fill="#3b82f640" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="avgPrice" name="Avg ₹/sqft" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Top Amenities" icon={Package} iconColor="text-green-400" subtitle="Most common warehouse amenities">
                {data.topAmenities.length > 0 ? (
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={data.topAmenities} layout="vertical" margin={{ left: 120 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="amenity" stroke="#475569" width={115} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Warehouses" radius={[0, 4, 4, 0]}>
                        {data.topAmenities.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No amenity data available</div>
                )}
              </ChartCard>

              <ChartCard title="Top Features" icon={Star} iconColor="text-yellow-400" subtitle="Most offered warehouse features">
                {data.topFeatures.length > 0 ? (
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={data.topFeatures} layout="vertical" margin={{ left: 120 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="feature" stroke="#475569" width={115} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Warehouses" radius={[0, 4, 4, 0]}>
                        {data.topFeatures.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No feature data available</div>
                )}
              </ChartCard>

              {data.topAmenities.length > 2 && (
                <ChartCard title="Amenities Radar" icon={Activity} iconColor="text-blue-400" subtitle="Coverage across top amenities" span={2}>
                  <ResponsiveContainer width="100%" height={380}>
                    <RadarChart data={data.topAmenities.slice(0, 8)}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="amenity" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <PolarRadiusAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Radar name="Count" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Top 10 by Area" icon={Layers} iconColor="text-blue-400" subtitle="Largest warehouse footprints">
                <div className="space-y-2">
                  {data.topByArea.map((w: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-colors group">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < 3 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-700/60 text-slate-400'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{w.name}</p>
                        <p className="text-slate-500 text-xs">{w.city}, {w.state}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-blue-400 font-bold text-sm">{(Number(w.total_area) / 1000).toFixed(0)}K sqft</p>
                        <p className="text-slate-500 text-xs">₹{w.price_per_sqft}/sqft</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>

              <ChartCard title="Top 10 by Price" icon={DollarSign} iconColor="text-green-400" subtitle="Highest priced warehouses">
                <div className="space-y-2">
                  {data.topByPrice.map((w: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < 3 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-700/60 text-slate-400'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{w.name}</p>
                        <p className="text-slate-500 text-xs">{w.city}, {w.state}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-green-400 font-bold text-sm">₹{Number(w.price_per_sqft).toLocaleString()}/sqft</p>
                        <p className="text-slate-500 text-xs">{(Number(w.total_area) / 1000).toFixed(0)}K sqft</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </div>
        )}

        {/* Explorer Tab */}
        {activeTab === 'explorer' && (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-6">
            <WarehouseExplorer />
          </div>
        )}

      </div>
    </div>
  );
}
