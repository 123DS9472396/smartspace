import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { getPendingVerifications, getAdminNotifications } from '../services/verificationService';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { isDemoSession } from '../services/demoAuth';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Users, Warehouse, DollarSign, TrendingUp, Clock, CircleCheck as CheckCircle, Circle as XCircle, Bell, FileText, ShieldCheck, RefreshCw, ArrowUpRight, ArrowDownRight, Activity, Package, Layers, ChartBar as BarChart3, Zap, Globe, Star } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalWarehouses: number;
  pendingVerifications: number;
  pendingWarehouseSubmissions: number;
  totalBookings: number;
  totalRevenue: number;
  seekerCount: number;
  ownerCount: number;
  pendingBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  totalStorageSqft: number;
  occupiedStorageSqft: number;
  availableStorageSqft: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];

const AnimatedCounter = ({ target, duration = 1500, prefix = '', suffix = '' }: { target: number; duration?: number; prefix?: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    startTime.current = null;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const GlowCard = ({ children, className = '', glowColor = 'blue' }: { children: React.ReactNode; className?: string; glowColor?: string }) => {
  const glowMap: Record<string, string> = {
    blue: 'hover:shadow-blue-500/20',
    cyan: 'hover:shadow-cyan-500/20',
    green: 'hover:shadow-green-500/20',
    yellow: 'hover:shadow-yellow-500/20',
    pink: 'hover:shadow-pink-500/20',
    orange: 'hover:shadow-orange-500/20',
  };
  return (
    <div className={`relative rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:border-slate-600/70 ${glowMap[glowColor] || ''} ${className}`}>
      {children}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800/95 border border-slate-600/80 rounded-xl p-3 shadow-2xl backdrop-blur-sm">
      <p className="text-slate-300 text-xs font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 100;
    const y = 30 - (v / max) * 28;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
};

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const demoMode = isDemoSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, totalWarehouses: 0, pendingVerifications: 0,
    pendingWarehouseSubmissions: 0, totalBookings: 0, totalRevenue: 0,
    seekerCount: 0, ownerCount: 0, pendingBookings: 0, approvedBookings: 0,
    rejectedBookings: 0, totalStorageSqft: 0, occupiedStorageSqft: 0, availableStorageSqft: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [bookingTrend, setBookingTrend] = useState<Array<{ label: string; count: number; revenue: number }>>([]);
  const [revenueTrend, setRevenueTrend] = useState<Array<{ label: string; value: number }>>([]);
  const [bookingStatusData, setBookingStatusData] = useState<Array<{ name: string; value: number }>>([]);

  const safeNumber = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const fetchAdminJson = async <T,>(path: string, fallback: T): Promise<T> => {
    const urls = [path, `http://localhost:8080${path}`, `http://localhost:3000${path}`];
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();
        if (data) return data as T;
      } catch {}
    }
    return fallback;
  };

  const fetchDashboardData = async () => {
    if (!loading) setRefreshing(true);
    try {
      const [adminUsersData, adminWarehousesData, submissionsData, pendingVerifs, bookingsData] = await Promise.all([
        fetchAdminJson('/api/admin/users', { success: false, seekers: [], owners: [], summary: {} }),
        fetchAdminJson('/api/admin/warehouses', { success: false, warehouses: [], summary: {} }),
        supabase.from('warehouse_submissions').select('id', { count: 'exact' }).eq('status', 'pending'),
        getPendingVerifications(),
        supabase.from('activity_logs').select('*').eq('type', 'booking').order('created_at', { ascending: false })
      ]);

      const seekerCount = safeNumber(adminUsersData?.summary?.total_seekers ?? adminUsersData?.seekers?.length);
      const ownerCount = safeNumber(adminUsersData?.summary?.total_owners ?? adminUsersData?.owners?.length);
      const totalUsers = safeNumber(adminUsersData?.summary?.total_users ?? (seekerCount + ownerCount));
      const warehousesList = Array.isArray(adminWarehousesData?.warehouses) ? adminWarehousesData.warehouses : [];
      const warehouses = safeNumber(adminWarehousesData?.summary?.total_warehouses ?? warehousesList.length);
      const bookings = bookingsData.data || [];
      const totalBookings = safeNumber(adminWarehousesData?.summary?.total_bookings ?? bookings.length);
      const pendingBookings = safeNumber(adminWarehousesData?.summary?.pending_bookings ?? bookings.filter((b: any) => b.metadata?.booking_status === 'pending').length);
      const approvedBookings = safeNumber(adminWarehousesData?.summary?.approved_bookings ?? bookings.filter((b: any) => b.metadata?.booking_status === 'approved').length);
      const rejectedBookings = bookings.filter((b: any) => b.metadata?.booking_status === 'rejected').length;

      const totalRevenue = safeNumber(
        adminWarehousesData?.summary?.total_revenue ??
        bookings.reduce((sum: number, b: any) => {
          if (b.metadata?.booking_status === 'approved') return sum + (parseFloat(b.metadata?.total_amount) || 0);
          return sum;
        }, 0)
      );

      const trend: Array<{ label: string; count: number; revenue: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const start = new Date();
        start.setDate(1);
        start.setMonth(start.getMonth() - i);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        const label = start.toLocaleDateString('en-IN', { month: 'short' });
        const monthBookings = bookings.filter((b: any) => {
          const created = new Date(b.created_at);
          return created >= start && created < end;
        });
        const revenue = monthBookings
          .filter((b: any) => b.metadata?.booking_status === 'approved')
          .reduce((sum: number, b: any) => sum + (parseFloat(b.metadata?.total_amount) || 0), 0);
        trend.push({ label, count: monthBookings.length, revenue });
      }
      setBookingTrend(trend);
      setRevenueTrend(trend.map(t => ({ label: t.label, value: t.revenue })));
      setBookingStatusData([
        { name: 'Approved', value: approvedBookings },
        { name: 'Pending', value: pendingBookings },
        { name: 'Rejected', value: rejectedBookings },
      ].filter(d => d.value > 0));

      const totalStorageSqft = warehousesList.reduce((sum: number, w: any) => sum + safeNumber(w.total_area), 0);
      const occupiedStorageSqft = safeNumber(adminWarehousesData?.summary?.occupied_area_sqft ?? warehousesList.reduce((sum: number, w: any) => sum + safeNumber(w.occupied_area), 0));
      const availableStorageSqft = Math.max(0, totalStorageSqft - occupiedStorageSqft);

      setStats({ totalUsers, totalWarehouses: warehouses, pendingVerifications: pendingVerifs.length, pendingWarehouseSubmissions: submissionsData.count || 0, totalBookings, totalRevenue, seekerCount, ownerCount, pendingBookings, approvedBookings, rejectedBookings, totalStorageSqft, occupiedStorageSqft, availableStorageSqft });

      const activities: RecentActivity[] = [];
      pendingVerifs.slice(0, 3).forEach((verif: any) => {
        activities.push({ id: verif.id, type: 'verification', message: `New ${verif.profile_type} verification: ${verif.user_name} (${verif.company_name})`, timestamp: verif.created_at });
      });
      bookings.slice(0, 5).forEach((booking: any) => {
        const status = booking.metadata?.booking_status || 'pending';
        const warehouseName = booking.metadata?.warehouse_name || 'Warehouse';
        const amount = booking.metadata?.total_amount || 0;
        const customerName = booking.metadata?.customer_details?.name || 'Customer';
        activities.push({ id: booking.id, type: 'booking', message: `${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'New'} booking: ${warehouseName} by ${customerName} — ₹${Number(amount).toLocaleString()}`, timestamp: booking.created_at });
      });
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivities(activities.slice(0, 8));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const occupancyPercent = stats.totalStorageSqft ? Math.round((stats.occupiedStorageSqft / stats.totalStorageSqft) * 100) : 0;
  const approvalRate = stats.totalBookings ? Math.round((stats.approvedBookings / stats.totalBookings) * 100) : 0;

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
            <p className="text-slate-200 font-medium text-lg">Loading Admin Dashboard</p>
            <p className="text-slate-500 text-sm">Fetching live data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <Navbar />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-500/6 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-green-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1600px] mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Admin Control Center</span>
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard</h1>
              <p className="text-slate-400 mt-1 text-sm">Real-time platform intelligence and management</p>
            </div>
            <div className="flex items-center gap-3">
              {demoMode && (
                <span className="px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-medium flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Demo Mode
                </span>
              )}
              <Button
                onClick={fetchDashboardData}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 rounded-xl"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Primary KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Total Users',
                value: stats.totalUsers,
                sub: `${stats.seekerCount} seekers · ${stats.ownerCount} owners`,
                icon: Users,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
                glow: 'blue',
                trend: '+12%',
                up: true,
                spark: [60, 72, 65, 80, 90, stats.totalUsers > 0 ? 100 : 0],
                sparkColor: '#3b82f6'
              },
              {
                label: 'Warehouses',
                value: stats.totalWarehouses,
                sub: 'Active listings',
                icon: Warehouse,
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10',
                border: 'border-cyan-500/20',
                glow: 'cyan',
                trend: '+5%',
                up: true,
                spark: [70, 75, 78, 80, 88, 100],
                sparkColor: '#06b6d4'
              },
              {
                label: 'Total Revenue',
                value: formatCurrency(stats.totalRevenue),
                raw: stats.totalRevenue,
                sub: `From ${stats.totalBookings} bookings`,
                icon: DollarSign,
                color: 'text-green-400',
                bg: 'bg-green-500/10',
                border: 'border-green-500/20',
                glow: 'green',
                trend: '+18%',
                up: true,
                spark: revenueTrend.map(r => r.value),
                sparkColor: '#10b981'
              },
              {
                label: 'Approval Rate',
                value: `${approvalRate}%`,
                raw: approvalRate,
                sub: `${stats.approvedBookings} of ${stats.totalBookings} bookings`,
                icon: CheckCircle,
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10',
                border: 'border-yellow-500/20',
                glow: 'yellow',
                trend: approvalRate >= 70 ? '+good' : 'review',
                up: approvalRate >= 70,
                spark: [65, 70, 72, 75, 80, approvalRate],
                sparkColor: '#f59e0b'
              },
            ].map((kpi, i) => (
              <GlowCard key={i} glowColor={kpi.glow} className={`border ${kpi.border} p-5`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${kpi.bg} border ${kpi.border} flex items-center justify-center`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${kpi.up ? 'text-green-400' : 'text-red-400'}`}>
                    {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {kpi.trend}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mb-1">{kpi.label}</p>
                <p className={`text-2xl font-bold text-white mb-1`}>
                  {typeof kpi.value === 'string' ? kpi.value : <AnimatedCounter target={kpi.value as number} />}
                </p>
                <p className="text-slate-500 text-xs mb-3">{kpi.sub}</p>
                <MiniSparkline data={kpi.spark} color={kpi.sparkColor} />
              </GlowCard>
            ))}
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Pending Verifications', value: stats.pendingVerifications, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: ShieldCheck, link: '/admin-verification', badge: stats.pendingVerifications > 0 },
              { label: 'Pending Bookings', value: stats.pendingBookings, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Clock, link: '/admin/bookings', badge: stats.pendingBookings > 0 },
              { label: 'Approved Bookings', value: stats.approvedBookings, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle, link: '/admin/bookings', badge: false },
              { label: 'Submissions', value: stats.pendingWarehouseSubmissions, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Package, link: '/admin/warehouse-submissions', badge: stats.pendingWarehouseSubmissions > 0 },
            ].map((item, i) => (
              <Link key={i} to={item.link}>
                <div className={`relative rounded-xl border ${item.border} bg-slate-900/60 p-4 hover:bg-slate-800/60 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer`}>
                  {item.badge && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${item.bg} border ${item.border} flex items-center justify-center`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">{item.label}</p>
                      <p className={`text-xl font-bold ${item.color}`}>
                        <AnimatedCounter target={item.value} />
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Bookings Trend */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-semibold text-lg">Booking Trends</h3>
                  <p className="text-slate-400 text-sm">Last 6 months performance</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded"></span>Bookings</span>
                  <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-0.5 bg-green-400 inline-block rounded"></span>Revenue</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={bookingTrend} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area yAxisId="left" type="monotone" dataKey="count" name="Bookings" stroke="#3b82f6" strokeWidth={2} fill="url(#colorBookings)" dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }} />
                  <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#colorRevenue)" dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Booking Status Pie */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-6">
              <div className="mb-4">
                <h3 className="text-white font-semibold text-lg">Booking Status</h3>
                <p className="text-slate-400 text-sm">Current distribution</p>
              </div>
              {bookingStatusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={bookingStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {bookingStatusData.map((_: any, i: number) => (
                          <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444'][i]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {bookingStatusData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#10b981', '#f59e0b', '#ef4444'][i] }}></span>
                          {d.name}
                        </span>
                        <span className="text-white font-semibold text-sm">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No booking data</div>
              )}
            </div>
          </div>

          {/* Storage + Revenue Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Storage Utilization */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-semibold">Storage Utilization</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Total Capacity', value: stats.totalStorageSqft, color: 'bg-slate-600', pct: 100, text: 'text-white' },
                  { label: 'Occupied', value: stats.occupiedStorageSqft, color: 'bg-orange-500', pct: occupancyPercent, text: 'text-orange-400' },
                  { label: 'Available', value: stats.availableStorageSqft, color: 'bg-green-500', pct: 100 - occupancyPercent, text: 'text-green-400' },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-400 text-xs">{s.label}</span>
                      <span className={`${s.text} text-sm font-semibold`}>{(s.value / 1000).toFixed(0)}K sqft</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all duration-1000`} style={{ width: `${s.pct}%` }}></div>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs">Occupancy Rate</span>
                    <span className={`text-lg font-bold ${occupancyPercent > 70 ? 'text-red-400' : occupancyPercent > 40 ? 'text-yellow-400' : 'text-green-400'}`}>{occupancyPercent}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Bars */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h3 className="text-white font-semibold">Monthly Revenue</h3>
                </div>
                <span className="text-slate-400 text-xs">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={revenueTrend} barSize={32} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-slate-800/95 border border-slate-600/80 rounded-xl p-3 shadow-2xl">
                        <p className="text-slate-300 text-xs mb-1">{label}</p>
                        <p className="text-green-400 font-bold text-sm">₹{payload[0].value.toLocaleString()}</p>
                      </div>
                    );
                  }} />
                  <Bar dataKey="value" name="Revenue" radius={[6, 6, 0, 0]}>
                    {revenueTrend.map((_: any, i: number) => (
                      <Cell key={i} fill={i === revenueTrend.length - 1 ? '#10b981' : '#1d4ed8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Row: Activity + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold text-lg">Recent Activity</h3>
              </div>
              {recentActivities.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No recent activity</div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {recentActivities.map((activity, idx) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-colors group">
                      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${activity.type === 'verification' ? 'bg-yellow-500/15 border border-yellow-500/25' : 'bg-blue-500/15 border border-blue-500/25'}`}>
                        {activity.type === 'verification' ? (
                          <ShieldCheck className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-sm leading-snug truncate">{activity.message}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold text-lg">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { to: '/admin-verification', icon: ShieldCheck, label: 'Verify Profiles', sub: `${stats.pendingVerifications} pending`, color: 'from-blue-600 to-blue-700', badge: stats.pendingVerifications },
                  { to: '/admin/bookings', icon: FileText, label: 'Bookings', sub: `${stats.pendingBookings} pending`, color: 'from-emerald-600 to-emerald-700', badge: stats.pendingBookings },
                  { to: '/admin/users', icon: Users, label: 'Users', sub: `${stats.totalUsers} total`, color: 'from-cyan-600 to-cyan-700', badge: 0 },
                  { to: '/admin/warehouses', icon: Warehouse, label: 'Warehouses', sub: `${stats.totalWarehouses} active`, color: 'from-orange-600 to-orange-700', badge: 0 },
                  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics', sub: 'Deep insights', color: 'from-pink-600 to-pink-700', badge: 0 },
                  { to: '/admin/warehouse-submissions', icon: Globe, label: 'Submissions', sub: `${stats.pendingWarehouseSubmissions} new`, color: 'from-slate-600 to-slate-700', badge: stats.pendingWarehouseSubmissions },
                ].map((action, i) => (
                  <Link key={i} to={action.to}>
                    <div className={`relative rounded-xl bg-gradient-to-br ${action.color} p-4 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer`}>
                      {action.badge > 0 && (
                        <span className="absolute top-2 right-2 min-w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1">
                          {action.badge}
                        </span>
                      )}
                      <action.icon className="w-5 h-5 text-white mb-2 opacity-90" />
                      <p className="text-white text-xs font-semibold leading-tight">{action.label}</p>
                      <p className="text-white/60 text-xs mt-0.5">{action.sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
