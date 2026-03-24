import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Search, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  X, Building2, MapPin, DollarSign, Star, Layers, Activity,
  Package, Eye, ArrowUpDown, RefreshCw, Loader2, LayoutGrid, List,
  TrendingUp, TrendingDown, Award, Hash, Image
} from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

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

interface FilterState {
  search: string;
  state: string;
  city: string;
  type: string;
  status: string;
  sortBy: string;
  sortOrder: string;
}

interface Warehouse {
  id: string;
  wh_id: string;
  name: string;
  city: string;
  district: string;
  state: string;
  total_area: number;
  capacity: number;
  price_per_sqft: number;
  warehouse_type: string;
  status: string;
  occupancy: number;
  occupancyPct: number;
  rating: number;
  reviews_count: number;
  amenities: string[];
  features: string[];
  imageCount: number;
  amenityCount: number;
  featureCount: number;
  created_at: string;
  owner_id: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface WarehouseDetailData {
  warehouse: any;
  comparison: {
    totalWarehouses: number;
    platform: { avgPrice: number; avgArea: number; avgOccupancy: number; avgRating: number };
    city: { name: string; count: number; avgPrice: number; avgArea: number; avgOccupancy: number; avgRating: number };
    type: { name: string; count: number; avgPrice: number; avgArea: number; avgOccupancy: number; avgRating: number };
    ranks: { priceCheapest: number; areaLargest: number; ratingBest: number };
  };
}

export default function WarehouseExplorer() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<FilterState>({
    search: '', state: '', city: '', type: '', status: '', sortBy: 'created_at', sortOrder: 'desc',
  });
  const [filterOptions, setFilterOptions] = useState<{ states: string[]; cities: string[]; types: string[]; statuses: string[] }>({
    states: [], cities: [], types: [], statuses: [],
  });
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WarehouseDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchInput, setSearchInput] = useState('');

  // Fetch filter options on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/analytics/filters');
        const json = await res.json();
        if (json.success) setFilterOptions(json.filters);
      } catch (e) { console.error('Failed to fetch filters:', e); }
      finally { setFiltersLoading(false); }
    })();
  }, []);

  // Fetch warehouse list
  const fetchWarehouses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.state && { state: filters.state }),
        ...(filters.city && { city: filters.city }),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      const res = await fetch(`/api/analytics/warehouses?${params}`);
      const json = await res.json();
      if (json.success) {
        setWarehouses(json.warehouses);
        setPagination(json.pagination);
      }
    } catch (err) { console.error('Failed to fetch warehouses:', err); }
    finally { setLoading(false); }
  }, [filters, pagination.limit]);

  useEffect(() => { fetchWarehouses(1); }, [filters]);

  // Fetch individual warehouse detail
  const fetchDetail = async (id: string) => {
    if (selectedId === id) { setSelectedId(null); setDetail(null); return; }
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/analytics/warehouse/${id}`);
      const json = await res.json();
      if (json.success) setDetail(json);
    } catch (err) { console.error('Failed to fetch warehouse detail:', err); }
    finally { setDetailLoading(false); }
  };

  const handleSearch = () => {
    setFilters(f => ({ ...f, search: searchInput }));
  };

  const clearFilters = () => {
    setFilters({ search: '', state: '', city: '', type: '', status: '', sortBy: 'created_at', sortOrder: 'desc' });
    setSearchInput('');
  };

  const toggleSort = (col: string) => {
    setFilters(f => ({
      ...f,
      sortBy: col,
      sortOrder: f.sortBy === col && f.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const activeFilterCount = [filters.search, filters.state, filters.city, filters.type, filters.status].filter(Boolean).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getRankBadge = (rank: number, total: number) => {
    const pct = (rank / total) * 100;
    if (pct <= 5) return { color: 'text-yellow-400 bg-yellow-400/20', label: 'Top 5%' };
    if (pct <= 10) return { color: 'text-green-400 bg-green-400/20', label: 'Top 10%' };
    if (pct <= 25) return { color: 'text-blue-400 bg-blue-400/20', label: 'Top 25%' };
    if (pct <= 50) return { color: 'text-purple-400 bg-purple-400/20', label: 'Top 50%' };
    return { color: 'text-slate-400 bg-slate-400/20', label: `#${rank.toLocaleString()}` };
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="glass-dark rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, city, state, or WH ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 px-6">
              <Search className="w-4 h-4 mr-1" /> Search
            </Button>
          </div>

          {/* Filter & View toggles */}
          <div className="flex gap-2">
            <Button variant="outline" className={`border-slate-600 ${showFilters ? 'bg-slate-700 text-white' : 'text-slate-300'}`} onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-1" /> Filters {activeFilterCount > 0 && <Badge className="ml-1 bg-blue-600 text-xs">{activeFilterCount}</Badge>}
            </Button>
            <div className="flex border border-slate-600 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('table')} className={`px-3 py-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">State</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:border-blue-500"
                value={filters.state} onChange={e => setFilters(f => ({ ...f, state: e.target.value }))}>
                <option value="">All States</option>
                {filterOptions.states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">City</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:border-blue-500"
                value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}>
                <option value="">All Cities</option>
                {filterOptions.cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Type</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:border-blue-500"
                value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
                <option value="">All Types</option>
                {filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Status</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:border-blue-500"
                value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                <option value="">All Statuses</option>
                {filterOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {activeFilterCount > 0 && (
              <div className="col-span-full">
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={clearFilters}>
                  <X className="w-3 h-3 mr-1" /> Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">
          Showing <span className="text-white font-medium">{((pagination.page - 1) * pagination.limit + 1).toLocaleString()}</span>–<span className="text-white font-medium">{Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString()}</span> of{' '}
          <span className="text-white font-bold">{pagination.total.toLocaleString()}</span> warehouses
        </p>
        <div className="flex items-center gap-2">
          <select className="bg-slate-800 border border-slate-600 rounded text-white text-xs px-2 py-1"
            value={pagination.limit} onChange={e => setPagination(p => ({ ...p, limit: Number(e.target.value) }))}>
            <option value="10">10/page</option>
            <option value="25">25/page</option>
            <option value="50">50/page</option>
            <option value="100">100/page</option>
          </select>
        </div>
      </div>

      {/* Loading spinner */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading warehouses...</p>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* ─── TABLE VIEW ─── */
        <div className="glass-dark rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700">
                  {[
                    { key: 'name', label: 'Warehouse', width: 'min-w-[200px]' },
                    { key: 'city', label: 'Location', width: 'min-w-[140px]' },
                    { key: 'warehouse_type', label: 'Type', width: 'min-w-[120px]' },
                    { key: 'total_area', label: 'Area (sqft)', width: 'min-w-[100px]' },
                    { key: 'price_per_sqft', label: 'Price/sqft', width: 'min-w-[90px]' },
                    { key: 'occupancy', label: 'Occupancy', width: 'min-w-[90px]' },
                    { key: 'rating', label: 'Rating', width: 'min-w-[80px]' },
                  ].map(col => (
                    <th key={col.key} className={`px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white ${col.width}`}
                      onClick={() => toggleSort(col.key)}>
                      <div className="flex items-center gap-1">
                        {col.label}
                        <ArrowUpDown className={`w-3 h-3 ${filters.sortBy === col.key ? 'text-blue-400' : 'text-slate-600'}`} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase min-w-[90px]">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase w-[60px]">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {warehouses.map(w => (
                  <React.Fragment key={w.id}>
                    <tr className={`hover:bg-slate-700/30 transition-colors cursor-pointer ${selectedId === w.id ? 'bg-blue-900/20 border-l-2 border-blue-500' : ''}`}
                      onClick={() => fetchDetail(w.id)}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white text-sm font-medium truncate max-w-[220px]">{w.name}</p>
                          <p className="text-slate-500 text-xs">{w.wh_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-slate-300">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[120px]">{w.city}</span>
                        </div>
                        <p className="text-slate-500 text-xs">{w.state}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">{w.warehouse_type || 'General'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 font-mono">
                        {Number(w.total_area).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-400 font-mono font-medium">
                        ₹{Number(w.price_per_sqft).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${w.occupancyPct >= 80 ? 'bg-green-500' : w.occupancyPct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${w.occupancyPct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400">{w.occupancyPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span className="text-sm text-white">{Number(w.rating).toFixed(1)}</span>
                          <span className="text-xs text-slate-500">({w.reviews_count})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${getStatusColor(w.status)}`}>{w.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {selectedId === w.id
                          ? <ChevronUp className="w-4 h-4 text-blue-400 inline" />
                          : <ChevronDown className="w-4 h-4 text-slate-500 inline" />
                        }
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {selectedId === w.id && (
                      <tr>
                        <td colSpan={9} className="px-0 py-0">
                          <WarehouseDetailPanel detail={detail} loading={detailLoading} totalWarehouses={pagination.total} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── GRID VIEW ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map(w => (
            <div key={w.id} className={`glass-dark rounded-xl p-4 cursor-pointer hover:border-blue-500/50 border transition-all ${selectedId === w.id ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-slate-700/50'}`}
              onClick={() => fetchDetail(w.id)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm truncate">{w.name}</h3>
                  <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{w.city}, {w.state}</p>
                </div>
                <Badge className={`text-xs ml-2 ${getStatusColor(w.status)}`}>{w.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-slate-800/60 rounded-lg p-2">
                  <p className="text-slate-500">Area</p>
                  <p className="text-white font-medium">{Number(w.total_area).toLocaleString()} sqft</p>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2">
                  <p className="text-slate-500">Price</p>
                  <p className="text-green-400 font-medium">₹{Number(w.price_per_sqft)}/sqft</p>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2">
                  <p className="text-slate-500">Occupancy</p>
                  <p className="text-white font-medium">{w.occupancyPct}%</p>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2">
                  <p className="text-slate-500">Rating</p>
                  <p className="text-yellow-400 font-medium">{Number(w.rating).toFixed(1)}★ ({w.reviews_count})</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">{w.warehouse_type || 'General'}</Badge>
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  {w.imageCount > 0 && <span className="flex items-center gap-0.5"><Image className="w-3 h-3" />{w.imageCount}</span>}
                  {w.amenityCount > 0 && <span className="flex items-center gap-0.5"><Package className="w-3 h-3" />{w.amenityCount}</span>}
                </div>
              </div>

              {/* Inline detail for grid */}
              {selectedId === w.id && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <WarehouseDetailPanel detail={detail} loading={detailLoading} totalWarehouses={pagination.total} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300" disabled={pagination.page <= 1}
            onClick={() => fetchWarehouses(pagination.page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Page buttons */}
          {(() => {
            const pages: number[] = [];
            const total = pagination.totalPages;
            const current = pagination.page;
            // Always show first, last, and nearby pages
            const showPages = new Set<number>();
            showPages.add(1);
            showPages.add(total);
            for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) showPages.add(i);
            const sorted = [...showPages].sort((a, b) => a - b);
            const result: (number | string)[] = [];
            for (let i = 0; i < sorted.length; i++) {
              if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
              result.push(sorted[i]);
            }
            return result.map((p, i) =>
              typeof p === 'string' ? (
                <span key={`ellipsis-${i}`} className="text-slate-500 px-2">...</span>
              ) : (
                <Button key={p} variant={p === current ? 'default' : 'outline'} size="sm"
                  className={p === current ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
                  onClick={() => fetchWarehouses(p)}>
                  {p}
                </Button>
              )
            );
          })()}

          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300" disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchWarehouses(pagination.page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/** ─── Warehouse Detail Panel (Expanded Row) ─── */
function WarehouseDetailPanel({ detail, loading, totalWarehouses }: { detail: WarehouseDetailData | null; loading: boolean; totalWarehouses: number }) {
  if (loading) {
    return (
      <div className="p-6 bg-slate-800/40 border-t border-b border-blue-500/20">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400 mr-2" />
          <span className="text-slate-400">Loading warehouse analysis...</span>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const { warehouse: wh, comparison: comp } = detail;

  // Build comparison data for radar chart
  const radarData = [
    {
      metric: 'Price',
      warehouse: Number(wh.price_per_sqft) || 0,
      platform: comp.platform.avgPrice,
      city: comp.city.avgPrice,
    },
    {
      metric: 'Occupancy',
      warehouse: wh.occupancyPct || 0,
      platform: comp.platform.avgOccupancy,
      city: comp.city.avgOccupancy,
    },
    {
      metric: 'Rating',
      warehouse: (Number(wh.rating) || 0) * 20, // scale to 100
      platform: comp.platform.avgRating * 20,
      city: comp.city.avgRating * 20,
    },
  ];

  // Build comparison bar chart
  const comparisonBars = [
    {
      metric: 'Price (₹/sqft)',
      'This Warehouse': Number(wh.price_per_sqft) || 0,
      'Platform Avg': comp.platform.avgPrice,
      'City Avg': comp.city.avgPrice,
      'Type Avg': comp.type.avgPrice,
    },
    {
      metric: 'Occupancy (%)',
      'This Warehouse': wh.occupancyPct || 0,
      'Platform Avg': comp.platform.avgOccupancy,
      'City Avg': comp.city.avgOccupancy,
      'Type Avg': comp.type.avgOccupancy,
    },
    {
      metric: 'Rating (★)',
      'This Warehouse': Number(wh.rating) || 0,
      'Platform Avg': comp.platform.avgRating,
      'City Avg': comp.city.avgRating,
      'Type Avg': comp.type.avgRating,
    },
  ];

  // Area comparison
  const areaComparison = [
    { name: 'This Warehouse', value: Number(wh.total_area) || 0 },
    { name: 'Platform Avg', value: comp.platform.avgArea },
    { name: `${comp.city.name} Avg`, value: comp.city.avgArea },
    { name: `${comp.type.name} Avg`, value: comp.type.avgArea },
  ];

  const getComparisonIndicator = (value: number, avg: number, lowerIsBetter = false) => {
    const diff = ((value - avg) / avg) * 100;
    const isGood = lowerIsBetter ? diff < 0 : diff > 0;
    if (Math.abs(diff) < 2) return { icon: '→', color: 'text-slate-400', label: 'On par' };
    return {
      icon: isGood ? '↑' : '↓',
      color: isGood ? 'text-green-400' : 'text-red-400',
      label: `${Math.abs(diff).toFixed(1)}% ${diff > 0 ? 'above' : 'below'} avg`,
    };
  };

  const priceComp = getComparisonIndicator(Number(wh.price_per_sqft), comp.platform.avgPrice, true);
  const occComp = getComparisonIndicator(wh.occupancyPct, comp.platform.avgOccupancy);
  const ratingComp = getComparisonIndicator(Number(wh.rating), comp.platform.avgRating);

  const getRankBadge = (rank: number, total: number) => {
    const pct = (rank / total) * 100;
    if (pct <= 5) return { color: 'text-yellow-400 bg-yellow-400/20', label: `Top 5% (#${rank.toLocaleString()})` };
    if (pct <= 10) return { color: 'text-green-400 bg-green-400/20', label: `Top 10% (#${rank.toLocaleString()})` };
    if (pct <= 25) return { color: 'text-blue-400 bg-blue-400/20', label: `Top 25% (#${rank.toLocaleString()})` };
    if (pct <= 50) return { color: 'text-purple-400 bg-purple-400/20', label: `Top 50% (#${rank.toLocaleString()})` };
    return { color: 'text-slate-400 bg-slate-400/20', label: `#${rank.toLocaleString()} of ${total.toLocaleString()}` };
  };

  const priceRank = getRankBadge(comp.ranks.priceCheapest, comp.totalWarehouses);
  const areaRank = getRankBadge(comp.ranks.areaLargest, comp.totalWarehouses);
  const ratingRank = getRankBadge(comp.ranks.ratingBest, comp.totalWarehouses);

  return (
    <div className="p-6 bg-gradient-to-r from-slate-800/60 via-blue-900/10 to-slate-800/60 border-t border-b border-blue-500/20">
      {/* Warehouse header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            {wh.name}
          </h3>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            <MapPin className="w-3 h-3" /> {wh.city}, {wh.district}, {wh.state}
            <span className="text-slate-600">|</span>
            <Hash className="w-3 h-3" /> {wh.wh_id}
            <span className="text-slate-600">|</span>
            <span className={`${wh.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>{wh.status}</span>
          </p>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-slate-500 text-xs">Area</p>
          <p className="text-white font-bold text-lg">{Number(wh.total_area).toLocaleString()}</p>
          <p className="text-slate-500 text-xs">sq ft</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-slate-500 text-xs">Price/sqft</p>
          <p className="text-green-400 font-bold text-lg">₹{Number(wh.price_per_sqft)}</p>
          <p className={`text-xs ${priceComp.color}`}>{priceComp.icon} {priceComp.label}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-slate-500 text-xs">Occupancy</p>
          <p className="text-white font-bold text-lg">{wh.occupancyPct}%</p>
          <p className={`text-xs ${occComp.color}`}>{occComp.icon} {occComp.label}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-slate-500 text-xs">Rating</p>
          <p className="text-yellow-400 font-bold text-lg">{Number(wh.rating).toFixed(1)}★</p>
          <p className={`text-xs ${ratingComp.color}`}>{ratingComp.icon} {ratingComp.label}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-slate-500 text-xs">Images</p>
          <p className="text-white font-bold text-lg">{wh.imageCount}</p>
          <p className="text-slate-500 text-xs">photos</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-slate-500 text-xs">Monthly Revenue Est.</p>
          <p className="text-blue-400 font-bold text-lg">₹{Math.round((Number(wh.total_area) || 0) * (Number(wh.price_per_sqft) || 0) * (Number(wh.occupancy) || 0)).toLocaleString()}</p>
          <p className="text-slate-500 text-xs">estimated</p>
        </div>
      </div>

      {/* Rankings row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-800/40 rounded-lg p-3 flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-slate-500 text-xs">Price Rank (Cheapest)</p>
            <p className={`text-sm font-bold ${priceRank.color.split(' ')[0]}`}>{priceRank.label}</p>
          </div>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-3 flex items-center gap-3">
          <Layers className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-slate-500 text-xs">Area Rank (Largest)</p>
            <p className={`text-sm font-bold ${areaRank.color.split(' ')[0]}`}>{areaRank.label}</p>
          </div>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-3 flex items-center gap-3">
          <Star className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-slate-500 text-xs">Rating Rank (Best)</p>
            <p className={`text-sm font-bold ${ratingRank.color.split(' ')[0]}`}>{ratingRank.label}</p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Comparison Bar Chart */}
        <Card className="bg-slate-800/40 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <BarChart className="w-4 h-4 text-blue-400" />
              Comparison: Warehouse vs Averages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparisonBars} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 10 }} width={75} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="This Warehouse" fill="#3b82f6" radius={[0, 2, 2, 0]} barSize={10} />
                <Bar dataKey="Platform Avg" fill="#6366f1" radius={[0, 2, 2, 0]} barSize={10} />
                <Bar dataKey="City Avg" fill="#06b6d4" radius={[0, 2, 2, 0]} barSize={10} />
                <Bar dataKey="Type Avg" fill="#10b981" radius={[0, 2, 2, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Area Comparison */}
        <Card className="bg-slate-800/40 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Area Comparison (sqft)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={areaComparison} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Area (sqft)" radius={[4, 4, 0, 0]}>
                  {areaComparison.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart + Amenities/Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar */}
        <Card className="bg-slate-800/40 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Performance Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis stroke="#334155" tick={{ fill: '#64748b', fontSize: 9 }} />
                <Radar name="This Warehouse" dataKey="warehouse" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Radar name="Platform Avg" dataKey="platform" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                <Radar name="City Avg" dataKey="city" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Amenities & Features */}
        <Card className="bg-slate-800/40 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-green-400" />
              Amenities & Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
              {wh.amenityList && wh.amenityList.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-medium mb-1.5">Amenities ({wh.amenityList.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {wh.amenityList.map((a: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs border-green-500/30 text-green-400 bg-green-500/10">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {wh.featureList && wh.featureList.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-medium mb-1.5">Features ({wh.featureList.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {wh.featureList.map((f: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs border-blue-500/30 text-blue-400 bg-blue-500/10">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(!wh.amenityList?.length && !wh.featureList?.length) && (
                <p className="text-slate-500 text-sm text-center py-4">No amenities or features listed</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Context cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">In {comp.city.name}</p>
          <p className="text-sm text-white">{comp.city.count.toLocaleString()} warehouses • Avg ₹{comp.city.avgPrice}/sqft • {comp.city.avgOccupancy}% occ</p>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Same type ({comp.type.name})</p>
          <p className="text-sm text-white">{comp.type.count.toLocaleString()} warehouses • Avg ₹{comp.type.avgPrice}/sqft • {comp.type.avgOccupancy}% occ</p>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Platform total</p>
          <p className="text-sm text-white">{comp.totalWarehouses.toLocaleString()} warehouses • Avg ₹{comp.platform.avgPrice}/sqft • {comp.platform.avgOccupancy}% occ</p>
        </div>
      </div>
    </div>
  );
}
