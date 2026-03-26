import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Search, Building2, Package, Mail, Phone, Calendar, Shield, ArrowLeft, RefreshCw, CircleCheck as CheckCircle, Circle as XCircle, User, Warehouse, IndianRupee, Hash, MapPin, Loader as Loader2, TrendingUp, Eye, ChevronDown, ChevronUp } from 'lucide-react';

interface UserBooking {
  booking_id: string;
  warehouse_name: string;
  warehouse_city: string;
  warehouse_state: string;
  area_sqft: number;
  total_amount: number;
  payment_method: string;
  status: string;
  goods_type: string;
  blocks_booked: Array<{ id: string; block_number: string | number; area: number | null; label: string }>;
  created_at: string;
  start_date: string;
  end_date: string;
}

interface OwnerWarehouse {
  id: string;
  wh_id: string;
  name: string;
  city: string;
  state: string;
  status: string;
  warehouse_type: string;
  total_area: number;
  price_per_sqft: number;
  created_at: string;
}

interface Seeker {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  user_type: 'seeker';
  verification_status: string;
  total_bookings: number;
  total_spent: number;
  bookings: UserBooking[];
  created_at: string;
}

interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  city: string;
  state: string;
  user_type: 'owner';
  verification_status: string;
  total_warehouses: number;
  warehouses: OwnerWarehouse[];
  created_at: string;
}

interface Summary {
  total_seekers: number;
  total_owners: number;
  total_users: number;
  total_bookings: number;
  total_warehouses: number;
}

const safeNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const safeArray = <T,>(value: T[] | null | undefined) => Array.isArray(value) ? value : [];

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'seekers' | 'owners'>('all');
  const [expandedSeekerId, setExpandedSeekerId] = useState<string | null>(null);
  const [expandedOwnerId, setExpandedOwnerId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      fetchUsers();
    }
  }, [profile]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        const normalizedSeekers = safeArray(data.seekers).map((seeker: any) => ({
          ...seeker,
          phone: seeker?.phone || '',
          company_name: seeker?.company_name || '',
          total_bookings: safeNumber(seeker?.total_bookings),
          total_spent: safeNumber(seeker?.total_spent),
          bookings: safeArray(seeker?.bookings).map((booking: any) => ({
            ...booking,
            area_sqft: safeNumber(booking?.area_sqft),
            total_amount: safeNumber(booking?.total_amount),
            blocks_booked: safeArray(booking?.blocks_booked),
          })),
        }));

        const normalizedOwners = safeArray(data.owners).map((owner: any) => ({
          ...owner,
          phone: owner?.phone || '',
          company_name: owner?.company_name || '',
          total_warehouses: safeNumber(owner?.total_warehouses),
          warehouses: safeArray(owner?.warehouses).map((warehouse: any) => ({
            ...warehouse,
            total_area: safeNumber(warehouse?.total_area),
            price_per_sqft: safeNumber(warehouse?.price_per_sqft),
          })),
        }));

        setSeekers(normalizedSeekers);
        setOwners(normalizedOwners);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  const fmtDate = (d: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-900/40 text-green-400 border border-green-700 text-xs">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-900/40 text-yellow-400 border border-yellow-700 text-xs">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-900/40 text-red-400 border border-red-700 text-xs">Rejected</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300 border border-slate-600 text-xs">{status}</Badge>;
    }
  };

  const getWarehouseStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-900/40 text-green-400 border border-green-700 text-xs">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-900/40 text-yellow-400 border border-yellow-700 text-xs">Pending</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300 border border-slate-600 text-xs">{status || 'Unknown'}</Badge>;
    }
  };

  const q = searchTerm.toLowerCase();

  const filteredSeekers = seekers.filter(s =>
    s.name?.toLowerCase().includes(q) ||
    s.email?.toLowerCase().includes(q) ||
    s.phone?.toLowerCase().includes(q)
  );

  const filteredOwners = owners.filter(o =>
    o.name?.toLowerCase().includes(q) ||
    o.email?.toLowerCase().includes(q) ||
    o.city?.toLowerCase().includes(q) ||
    o.state?.toLowerCase().includes(q) ||
    o.company_name?.toLowerCase().includes(q)
  );

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
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-slate-400 hover:text-white hover:bg-slate-700">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-400" />
                User Management
              </h1>
              <p className="text-slate-400 mt-1">All registered seekers and warehouse owners</p>
            </div>
          </div>
          <Button onClick={fetchUsers} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-800/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold text-white mt-1">{summary.total_users}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/40 to-green-950/40 border-green-800/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm font-medium">Space Seekers</p>
                    <p className="text-3xl font-bold text-white mt-1">{summary.total_seekers}</p>
                    <p className="text-xs text-green-400 mt-1">{summary.total_bookings} bookings made</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm font-medium">Warehouse Owners</p>
                    <p className="text-3xl font-bold text-white mt-1">{summary.total_owners}</p>
                    <p className="text-xs text-purple-400 mt-1">{summary.total_warehouses} warehouses listed</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-400" />
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
                    <p className="text-xs text-yellow-400 mt-1">across all seekers</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search + Tabs */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, city..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveTab('all')}
              className={activeTab === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
            >
              All ({(summary?.total_users) || 0})
            </Button>
            <Button
              variant={activeTab === 'seekers' ? 'default' : 'outline'}
              onClick={() => setActiveTab('seekers')}
              className={activeTab === 'seekers' ? 'bg-green-600 hover:bg-green-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
            >
              Seekers ({filteredSeekers.length})
            </Button>
            <Button
              variant={activeTab === 'owners' ? 'default' : 'outline'}
              onClick={() => setActiveTab('owners')}
              className={activeTab === 'owners' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
            >
              Owners ({filteredOwners.length})
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-slate-400">Loading users...</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Seekers Section */}
            {(activeTab === 'all' || activeTab === 'seekers') && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Space Seekers</h2>
                  <Badge className="bg-green-900/40 text-green-400 border border-green-700">{filteredSeekers.length}</Badge>
                </div>

                {filteredSeekers.length === 0 ? (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-10 text-center">
                      <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No seekers found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredSeekers.map((seeker, i) => (
                      <Card key={`seeker-${seeker.id}-${i}`} className="bg-gray-800/70 border-gray-700 hover:border-gray-500 transition-all overflow-hidden">
                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                            {/* Left: Identity */}
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                                <User className="w-6 h-6 text-green-400" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-white text-base">{seeker.name || 'Unknown'}</h3>
                                  <Badge className="bg-green-900/40 text-green-400 border border-green-700 text-xs">Seeker</Badge>
                                  {seeker.verification_status === 'verified' && (
                                    <Badge className="bg-blue-900/40 text-blue-400 border border-blue-700 text-xs">
                                      <Shield className="w-3 h-3 mr-1" />Verified
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                  {seeker.email && (
                                    <span className="flex items-center gap-1.5">
                                      <Mail className="w-3.5 h-3.5" />{seeker.email}
                                    </span>
                                  )}
                                  {seeker.phone && (
                                    <span className="flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5" />{seeker.phone}
                                    </span>
                                  )}
                                  {seeker.company_name && (
                                    <span className="flex items-center gap-1.5">
                                      <Building2 className="w-3.5 h-3.5" />{seeker.company_name}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />Joined {fmtDate(seeker.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Stats */}
                            <div className="flex items-center gap-6 shrink-0">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-white">{seeker.total_bookings || 0}</p>
                                <p className="text-xs text-gray-400">Bookings</p>
                              </div>
                              {(seeker.total_spent || 0) > 0 && (
                                <div className="text-center">
                                  <p className="text-xl font-bold text-green-400">{fmt(seeker.total_spent)}</p>
                                  <p className="text-xs text-gray-400">Total Spent</p>
                                </div>
                              )}
                              {seeker.bookings?.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setExpandedSeekerId(expandedSeekerId === seeker.id ? null : seeker.id)}
                                  className="border-green-700/60 text-green-400 hover:bg-green-900/20"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  {expandedSeekerId === seeker.id ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                                  Bookings
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        {expandedSeekerId === seeker.id && seeker.bookings?.length > 0 && (
                          <div className="border-t border-gray-700 bg-slate-900/50 px-5 py-4 space-y-3">
                            {seeker.bookings.map((booking) => (
                              <div key={booking.booking_id} className="rounded-xl border border-gray-700 bg-gray-800/70 p-4">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-white font-semibold">{booking.warehouse_name}</p>
                                      {getBookingStatusBadge(booking.status)}
                                      {booking.goods_type && <Badge className="bg-slate-700/60 text-slate-300 border border-slate-600 text-xs">{booking.goods_type}</Badge>}
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{[booking.warehouse_city, booking.warehouse_state].filter(Boolean).join(', ') || 'Location N/A'}</span>
                                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{fmtDate(booking.start_date)} - {fmtDate(booking.end_date)}</span>
                                      <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" />{booking.blocks_booked?.length || 0} block{(booking.blocks_booked?.length || 0) !== 1 ? 's' : ''}</span>
                                      <span>{booking.area_sqft?.toLocaleString()} sqft</span>
                                      {booking.payment_method && <span className="capitalize">{booking.payment_method}</span>}
                                    </div>
                                    {booking.blocks_booked?.length > 0 && (
                                      <p className="text-xs text-slate-500 font-mono">{booking.blocks_booked.map(block => block.label).join(', ')}</p>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-lg font-bold text-green-400">{fmt(booking.total_amount)}</p>
                                    <p className="text-xs text-slate-500">Booked {fmtDate(booking.created_at)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Owners Section */}
            {(activeTab === 'all' || activeTab === 'owners') && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Warehouse Owners</h2>
                  <Badge className="bg-purple-900/40 text-purple-400 border border-purple-700">{filteredOwners.length}</Badge>
                </div>

                {filteredOwners.length === 0 ? (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-10 text-center">
                      <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No owners found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredOwners.map((owner, i) => (
                      <Card key={`owner-${owner.id}-${i}`} className="bg-gray-800/70 border-gray-700 hover:border-gray-500 transition-all overflow-hidden">
                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                            {/* Left: Identity */}
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                                <Building2 className="w-6 h-6 text-purple-400" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-white text-base">{owner.name || 'Unknown'}</h3>
                                  <Badge className="bg-purple-900/40 text-purple-400 border border-purple-700 text-xs">Owner</Badge>
                                  {owner.verification_status === 'verified' && (
                                    <Badge className="bg-blue-900/40 text-blue-400 border border-blue-700 text-xs">
                                      <Shield className="w-3 h-3 mr-1" />Verified
                                    </Badge>
                                  )}
                                  {owner.company_name && (
                                    <Badge className="bg-slate-700/60 text-slate-300 border border-slate-600 text-xs">{owner.company_name}</Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                  {owner.email && (
                                    <span className="flex items-center gap-1.5">
                                      <Mail className="w-3.5 h-3.5" />{owner.email}
                                    </span>
                                  )}
                                  {owner.phone && (
                                    <span className="flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5" />{owner.phone}
                                    </span>
                                  )}
                                  {(owner.city || owner.state) && (
                                    <span className="flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5" />{[owner.city, owner.state].filter(Boolean).join(', ')}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />Since {fmtDate(owner.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Warehouse count */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-purple-400">{owner.total_warehouses || 0}</p>
                                <p className="text-xs text-gray-400">Warehouse{(owner.total_warehouses || 0) !== 1 ? 's' : ''}</p>
                              </div>
                              {owner.warehouses?.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setExpandedOwnerId(expandedOwnerId === owner.id ? null : owner.id)}
                                  className="border-purple-700/60 text-purple-400 hover:bg-purple-900/20"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  {expandedOwnerId === owner.id ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                                  Warehouses
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        {expandedOwnerId === owner.id && owner.warehouses?.length > 0 && (
                          <div className="border-t border-gray-700 bg-slate-900/50 px-5 py-4 space-y-3">
                            {owner.warehouses.map((warehouse) => (
                              <div key={warehouse.id} className="rounded-xl border border-gray-700 bg-gray-800/70 p-4">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-white font-semibold">{warehouse.name}</p>
                                      {getWarehouseStatusBadge(warehouse.status)}
                                      {warehouse.warehouse_type && <Badge className="bg-slate-700/60 text-slate-300 border border-slate-600 text-xs">{warehouse.warehouse_type}</Badge>}
                                      {warehouse.wh_id && <span className="text-xs text-slate-500 font-mono">{warehouse.wh_id}</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{[warehouse.city, warehouse.state].filter(Boolean).join(', ') || 'Location N/A'}</span>
                                      <span className="flex items-center gap-1"><Warehouse className="w-3.5 h-3.5" />{warehouse.total_area?.toLocaleString()} sqft</span>
                                      <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />{warehouse.price_per_sqft || 0}/sqft</span>
                                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Listed {fmtDate(warehouse.created_at)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}