import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import {
  Building,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Eye,
  Loader2,
  IndianRupee,
  BarChart3,
  Package,
  Calendar,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Hash,
  CreditCard,
  Warehouse,
  Layers,
  SquareStack
} from 'lucide-react';

interface BookedBlock {
  id: string;
  block_number: string | number;
  area: number | null;
  label: string;
}

interface Booking {
  booking_id: string;
  seeker_name: string;
  seeker_email: string;
  seeker_phone: string;
  area_sqft: number;
  blocks_booked: BookedBlock[];
  start_date: string;
  end_date: string;
  total_amount: number;
  payment_method: string;
  status: string;
  goods_type: string;
  created_at: string;
}

interface WarehouseData {
  id: string;
  wh_id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  warehouse_type: string;
  status: string;
  total_area: number;
  occupied_area: number;
  available_area: number;
  occupancy_pct: number;
  price_per_sqft: number;
  rating: number;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  owner_company: string;
  total_bookings: number;
  approved_bookings: number;
  pending_bookings: number;
  rejected_bookings: number;
  total_revenue: number;
  bookings: Booking[];
}

interface Summary {
  total_warehouses: number;
  total_bookings: number;
  approved_bookings: number;
  pending_bookings: number;
  rejected_bookings: number;
  total_revenue: number;
  occupied_area_sqft: number;
  average_occupancy_pct: number;
}

const safeNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const safeBlocks = (blocks: unknown): BookedBlock[] => {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((block: any, index: number) => ({
    id: String(block?.id ?? `block_${index + 1}`),
    block_number: block?.block_number ?? index + 1,
    area: typeof block?.area === 'number' ? block.area : null,
    label: block?.label || `Block ${block?.block_number ?? index + 1}`,
  }));
};

export default function AdminWarehousesPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchWarehouses(); }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/warehouses');
      const data = await response.json();
      if (data.success) {
        const normalizedWarehouses = (data.warehouses || []).map((wh: any) => ({
          ...wh,
          total_area: safeNumber(wh.total_area),
          occupied_area: safeNumber(wh.occupied_area),
          available_area: safeNumber(wh.available_area),
          occupancy_pct: safeNumber(wh.occupancy_pct),
          price_per_sqft: safeNumber(wh.price_per_sqft),
          total_bookings: safeNumber(wh.total_bookings),
          approved_bookings: safeNumber(wh.approved_bookings),
          pending_bookings: safeNumber(wh.pending_bookings),
          rejected_bookings: safeNumber(wh.rejected_bookings),
          total_revenue: safeNumber(wh.total_revenue),
          bookings: Array.isArray(wh.bookings)
            ? wh.bookings.map((booking: any) => ({
                ...booking,
                area_sqft: safeNumber(booking?.area_sqft),
                total_amount: safeNumber(booking?.total_amount),
                blocks_booked: safeBlocks(booking?.blocks_booked),
              }))
            : [],
        }));

        setWarehouses(normalizedWarehouses);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = warehouses.filter(wh => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      wh.name?.toLowerCase().includes(q) ||
      wh.city?.toLowerCase().includes(q) ||
      wh.state?.toLowerCase().includes(q) ||
      wh.owner_name?.toLowerCase().includes(q) ||
      wh.owner_email?.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && wh.status === 'active') ||
      (statusFilter === 'pending' && wh.status === 'pending') ||
      (statusFilter === 'booked' && wh.total_bookings > 0);
    return matchSearch && matchStatus;
  });

  const fmt = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  const fmtDate = (d: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getBlockLabels = (blocks: BookedBlock[] = []) => safeBlocks(blocks).map(block => block.label || `Block ${block.block_number}`);

  const getBlocksArea = (blocks: BookedBlock[] = []) =>
    safeBlocks(blocks).reduce((sum, block) => sum + (typeof block.area === 'number' ? block.area : 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-900/50 text-green-400 border border-green-700"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-900/50 text-yellow-400 border border-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300 border border-slate-600">{status || 'Unknown'}</Badge>;
    }
  };

  const getBookingBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-900/50 text-green-400 border border-green-700 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-900/50 text-yellow-400 border border-yellow-700 text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-900/50 text-red-400 border border-red-700 text-xs"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const occupancyColor = (pct: number) =>
    pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-400' : 'bg-green-500';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Warehouse className="w-8 h-8 text-blue-400" />
                Warehouse Analytics
              </h1>
              <p className="text-slate-400 mt-1">All warehouses with owner details, bookings and revenue</p>
            </div>
          </div>
          <Button onClick={fetchWarehouses} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-800/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Total Warehouses</p>
                    <p className="text-3xl font-bold text-white mt-1">{summary.total_warehouses}</p>
                    <p className="text-xs text-blue-400 mt-1">{filtered.length} shown</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Warehouse className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/40 to-yellow-950/40 border-yellow-800/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-300 text-sm font-medium">Total Bookings</p>
                    <p className="text-3xl font-bold text-white mt-1">{summary.total_bookings}</p>
                    <p className="text-xs text-yellow-400 mt-1">{summary.pending_bookings} pending review</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/40 to-green-950/40 border-green-800/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold text-white mt-1">{fmt(summary.total_revenue)}</p>
                    <p className="text-xs text-green-400 mt-1">{summary.approved_bookings} approved</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm font-medium">Avg Occupancy</p>
                    <p className="text-3xl font-bold text-white mt-1">{summary.average_occupancy_pct}%</p>
                    <p className="text-xs text-purple-400 mt-1">{(summary.occupied_area_sqft || 0).toLocaleString()} sqft used</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by warehouse name, city, state, owner..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { val: 'all', label: 'All' },
              { val: 'active', label: 'Active' },
              { val: 'pending', label: 'Pending' },
              { val: 'booked', label: 'Has Bookings' },
            ].map(({ val, label }) => (
              <Button
                key={val}
                variant={statusFilter === val ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(val)}
                className={statusFilter === val ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {!loading && (
          <p className="text-sm text-slate-400 mb-4">
            Showing <span className="text-white font-medium">{filtered.length}</span> of{' '}
            <span className="text-white font-medium">{warehouses.length}</span> warehouses
          </p>
        )}

        {/* Warehouse List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-slate-400">Loading warehouse data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-16 text-center">
              <Warehouse className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Warehouses Found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(wh => (
              <Card key={wh.id} className="bg-gray-800/80 border-gray-700 hover:border-gray-500 transition-all duration-200 overflow-hidden">
                <CardContent className="p-0">

                  {/* Warehouse Main Row */}
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">

                      {/* Left: Info */}
                      <div className="flex-1 space-y-4">
                        {/* Name & Badges */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <Building className="w-5 h-5 text-blue-400 shrink-0" />
                          <h3 className="text-lg font-bold text-white">{wh.name}</h3>
                          {getStatusBadge(wh.status)}
                          <Badge className="bg-slate-700/60 text-slate-300 border border-slate-600 text-xs">{wh.warehouse_type || 'General'}</Badge>
                          {wh.wh_id && <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded">{wh.wh_id}</span>}
                        </div>

                        {/* Location + Owner Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-gray-300">{wh.city}, {wh.state}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-white font-semibold">{wh.owner_name || 'Unknown Owner'}</span>
                          </div>
                          {wh.owner_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-gray-300 truncate">{wh.owner_email}</span>
                            </div>
                          )}
                          {wh.owner_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-gray-300">{wh.owner_phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-gray-300">{wh.price_per_sqft ? `${wh.price_per_sqft}/sqft` : 'Price N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-gray-300">{(wh.total_area || 0).toLocaleString()} sqft total</span>
                          </div>
                        </div>

                        {/* Occupancy Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">
                              Occupancy — <span className="text-white">{(wh.occupied_area || 0).toLocaleString()}</span> / {(wh.total_area || 0).toLocaleString()} sqft
                            </span>
                            <span className={`font-bold ${wh.occupancy_pct > 80 ? 'text-red-400' : wh.occupancy_pct > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {wh.occupancy_pct}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${occupancyColor(wh.occupancy_pct)}`}
                              style={{ width: `${Math.min(wh.occupancy_pct, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Booking counters */}
                        <div className="flex items-center gap-5 text-sm flex-wrap">
                          <span className="text-gray-400">Bookings: <span className="text-white font-semibold">{wh.total_bookings}</span></span>
                          <span className="flex items-center gap-1 text-green-400"><CheckCircle className="w-3.5 h-3.5" />{wh.approved_bookings} approved</span>
                          <span className="flex items-center gap-1 text-yellow-400"><Clock className="w-3.5 h-3.5" />{wh.pending_bookings} pending</span>
                          <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3.5 h-3.5" />{wh.rejected_bookings} rejected</span>
                        </div>
                      </div>

                      {/* Right: Revenue + Toggle */}
                      <div className="flex flex-col items-end gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-sm text-gray-400 mb-1">Revenue Earned</p>
                          <p className="text-2xl font-bold text-green-400">{fmt(wh.total_revenue)}</p>
                          {wh.available_area > 0 && (
                            <p className="text-xs text-slate-400 mt-1">{(wh.available_area).toLocaleString()} sqft available</p>
                          )}
                        </div>
                        {wh.total_bookings > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedId(expandedId === wh.id ? null : wh.id)}
                            className="border-blue-600/50 text-blue-400 hover:bg-blue-900/30 hover:border-blue-500 gap-1.5"
                          >
                            {expandedId === wh.id
                              ? <><ChevronUp className="w-4 h-4" />Hide Bookings</>
                              : <><Eye className="w-4 h-4" />View {wh.total_bookings} Booking{wh.total_bookings !== 1 ? 's' : ''}</>
                            }
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Bookings Panel */}
                  {expandedId === wh.id && wh.bookings.length > 0 && (
                    <div className="border-t border-gray-700 bg-slate-900/60 px-6 py-5">
                      <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-400" />
                        Bookings for <span className="text-white">{wh.name}</span>
                        <span className="ml-auto text-xs text-slate-500">{wh.bookings.length} total</span>
                      </h4>

                      <div className="space-y-3">
                        {wh.bookings.map((b, i) => (
                          <div key={b.booking_id || i} className="bg-gray-800/70 border border-gray-700 rounded-xl p-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

                              {/* Seeker + Details */}
                              <div className="flex-1 space-y-3">
                                {/* Seeker name + badge */}
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-blue-400" />
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold">{b.seeker_name || 'Unknown Seeker'}</p>
                                    <p className="text-xs text-slate-400">Space Seeker</p>
                                  </div>
                                  {getBookingBadge(b.status)}
                                  {b.goods_type && (
                                    <Badge className="bg-slate-700/60 text-slate-300 border border-slate-600 text-xs">{b.goods_type}</Badge>
                                  )}
                                </div>

                                {/* Details grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm pl-11">
                                  {b.seeker_email && (
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{b.seeker_email}</span>
                                    </div>
                                  )}
                                  {b.seeker_phone && (
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span>{b.seeker_phone}</span>
                                    </div>
                                  )}
                                  {b.area_sqft > 0 && (
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <SquareStack className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span><span className="text-white font-semibold">{b.area_sqft.toLocaleString()}</span> sqft booked</span>
                                    </div>
                                  )}
                                  {b.blocks_booked && b.blocks_booked.length > 0 && (
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span><span className="text-white font-semibold">{b.blocks_booked.length}</span> block{b.blocks_booked.length !== 1 ? 's' : ''}</span>
                                      <span className="text-xs text-slate-500 font-mono">[{getBlockLabels(b.blocks_booked).join(', ')}]</span>
                                      {getBlocksArea(b.blocks_booked) > 0 && (
                                        <span className="text-xs text-slate-400">• {getBlocksArea(b.blocks_booked).toLocaleString()} sqft</span>
                                      )}
                                    </div>
                                  )}
                                  {b.start_date && (
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span>{fmtDate(b.start_date)} &rarr; {fmtDate(b.end_date)}</span>
                                    </div>
                                  )}
                                  {b.payment_method && (
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="capitalize">{b.payment_method}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Amount */}
                              <div className="flex flex-col items-end gap-1 shrink-0 text-right min-w-[100px]">
                                {b.total_amount > 0 ? (
                                  <>
                                    <p className="text-xs text-gray-400">Booking Amount</p>
                                    <p className="text-xl font-bold text-green-400">{fmt(b.total_amount)}</p>
                                  </>
                                ) : (
                                  <p className="text-sm text-slate-500">Amount N/A</p>
                                )}
                                <p className="text-xs text-slate-500 mt-1">Booked {fmtDate(b.created_at)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}