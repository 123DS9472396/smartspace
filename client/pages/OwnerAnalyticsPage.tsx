import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Line,
} from "recharts";
import {
  Warehouse,
  TrendingUp,
  DollarSign,
  BarChart3,
  RefreshCw,
  ArrowLeft,
  Building2,
  Star,
  Layers,
  Activity,
  Package,
  XCircle,
  CheckCircle,
  Calendar,
  Users,
  Clock,
  FileText,
  Eye,
} from "lucide-react";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
      <p className="text-slate-300 text-sm font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: p.color }}>
          {p.name}:{" "}
          <span className="font-bold">
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function OwnerAnalyticsPage() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/analytics/owner/${user.id}`);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Analytics API returned an invalid response");
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.analytics);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    if (!user?.id) return;

    const channel = supabase
      .channel(`owner-analytics-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `owner_id=eq.${user.id}`,
        },
        () => fetchAnalytics(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "warehouse_submissions",
          filter: `owner_id=eq.${user.id}`,
        },
        () => fetchAnalytics(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "warehouses",
          filter: `owner_id=eq.${user.id}`,
        },
        () => fetchAnalytics(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        (payload) => {
          const row = payload.new as { type?: string; seeker_id?: string };
          if (
            (row.type === "booking" || row.type === "notification") &&
            row.seeker_id === user.id
          ) {
            fetchAnalytics();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-slate-300">Loading your analytics...</p>
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
            <h2 className="text-xl font-bold text-white mb-2">
              Error Loading Analytics
            </h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <Button onClick={fetchAnalytics}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const o = data.overview;

  if (o.totalWarehouses === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-[1200px]">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-blue-400" /> My Analytics
            </h1>
          </div>
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="py-16 text-center">
              <Warehouse className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">
                No Warehouses Yet
              </h2>
              <p className="text-slate-400 mb-6">
                List your first warehouse to see analytics insights.
              </p>
              <Link to="/list-property">
                <Button>List a Warehouse</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Prepare chart data for per-warehouse comparison
  const warehouseCompare = data.warehouseBreakdown.map((w: any) => ({
    name: w.name?.length > 20 ? w.name.slice(0, 17) + "..." : w.name,
    fullName: w.name,
    area: w.total_area,
    price: w.price_per_sqft,
    occupancy: w.occupancy,
    revenue: w.monthlyRevenue,
    rating: w.rating,
  }));

  const bookingTrend = data.bookingTrend || [];
  const bookingStatusData = Object.entries(
    data.bookingStatusBreakdown || {},
  ).map(([status, count]) => ({
    status,
    count,
  }));
  const paymentMethodData = Object.entries(
    data.paymentMethodBreakdown || {},
  ).map(([method, count]) => ({
    method,
    count,
  }));
  const bookingsByWarehouse = data.bookingsByWarehouse || [];
  const recentBookings = (data.bookingDetails || []).slice(0, 10);
  const upcomingExpirations = (data.upcomingExpirations || []).slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-[1400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                My Warehouse Analytics
              </h1>
              <p className="text-slate-400 mt-1">
                Insights for your {o.totalWarehouses} warehouse
                {o.totalWarehouses > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            {
              label: "My Warehouses",
              value: o.totalWarehouses,
              icon: Warehouse,
              color: "text-blue-400",
              bg: "bg-blue-500/20",
            },
            {
              label: "Total Area",
              value: `${(o.totalArea / 1000).toFixed(0)}K sqft`,
              icon: Layers,
              color: "text-purple-400",
              bg: "bg-purple-500/20",
            },
            {
              label: "Avg Price",
              value: `₹${o.avgPrice}/sqft`,
              icon: DollarSign,
              color: "text-green-400",
              bg: "bg-green-500/20",
            },
            {
              label: "Avg Occupancy",
              value: `${o.avgOccupancy}%`,
              icon: Activity,
              color: "text-cyan-400",
              bg: "bg-cyan-500/20",
            },
            {
              label: "Avg Rating",
              value: `${o.avgRating}★`,
              icon: Star,
              color: "text-yellow-400",
              bg: "bg-yellow-500/20",
            },
            {
              label: "Est. Revenue",
              value: `₹${(o.estimatedMonthlyRevenue / 1000).toFixed(0)}K`,
              icon: TrendingUp,
              color: "text-pink-400",
              bg: "bg-pink-500/20",
            },
          ].map((kpi, i) => (
            <div key={i} className="glass-dark rounded-xl p-4">
              <div className={`${kpi.bg} p-2 rounded-lg w-fit mb-2`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-slate-400 text-xs">{kpi.label}</p>
              <p className="text-xl font-bold text-white">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Booking & Submission Status Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="glass-dark rounded-xl p-4 border-l-4 border-blue-500">
            <p className="text-slate-400 text-xs">Total Bookings</p>
            <p className="text-lg font-bold text-blue-400">{o.totalBookings}</p>
          </div>
          <div className="glass-dark rounded-xl p-4 border-l-4 border-green-500">
            <p className="text-slate-400 text-xs">Confirmed</p>
            <p className="text-lg font-bold text-green-400">
              {o.confirmedBookings}
            </p>
          </div>
          <div className="glass-dark rounded-xl p-4 border-l-4 border-yellow-500">
            <p className="text-slate-400 text-xs">Pending</p>
            <p className="text-lg font-bold text-yellow-400">
              {o.pendingBookings}
            </p>
          </div>
          <div className="glass-dark rounded-xl p-4 border-l-4 border-red-500">
            <p className="text-slate-400 text-xs">Rejected</p>
            <p className="text-lg font-bold text-red-400">
              {o.rejectedBookings}
            </p>
          </div>
          <div className="glass-dark rounded-xl p-4 border-l-4 border-cyan-500">
            <p className="text-slate-400 text-xs">Submissions Approved</p>
            <p className="text-lg font-bold text-cyan-400">
              {o.approvedSubmissions}
            </p>
          </div>
          <div className="glass-dark rounded-xl p-4 border-l-4 border-orange-500">
            <p className="text-slate-400 text-xs">Submissions Pending</p>
            <p className="text-lg font-bold text-orange-400">
              {o.pendingSubmissions}
            </p>
          </div>
          <div className="glass-dark rounded-xl p-4 border-l-4 border-red-500">
            <p className="text-slate-400 text-xs">Submissions Rejected</p>
            <p className="text-lg font-bold text-red-400">
              {o.rejectedSubmissions}
            </p>
          </div>
        </div>

        {/* Booking Value & Due Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-dark rounded-xl p-4 border-l-4 border-emerald-500">
            <p className="text-slate-400 text-xs">Avg Booking Value</p>
            <p className="text-lg font-bold text-emerald-400">
              ₹{Number(o.avgBookingValue || 0).toLocaleString()}
            </p>
          </div>
          <div className="glass-dark rounded-xl p-4 border-l-4 border-amber-500">
            <p className="text-slate-400 text-xs">Due Revenue</p>
            <p className="text-lg font-bold text-amber-400">
              ₹{Number(o.dueRevenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="glass-dark rounded-xl p-4 border-l-4 border-rose-500">
            <p className="text-slate-400 text-xs">Overdue Bookings</p>
            <p className="text-lg font-bold text-rose-400">
              {o.overdueBookings || 0}
            </p>
          </div>
        </div>

        {/* Booking Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" /> Booking Trend (6
                months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={bookingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis yAxisId="left" stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="count"
                    name="Bookings"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue (₹)"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" /> Booking Status
                Mix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="count"
                    nameKey="status"
                    label={({ status, percent }: any) =>
                      `${status} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {bookingStatusData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/60 border-slate-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" /> Bookings by
                Warehouse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={bookingsByWarehouse}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#94a3b8"
                    width={80}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    name="Bookings"
                    fill="#06b6d4"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" /> Payment
                Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    nameKey="method"
                    label={({ method, percent }: any) =>
                      `${method} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {paymentMethodData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Top Seekers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(data.topSeekers || []).map((s: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{s.name}</p>
                      <p className="text-slate-400 text-xs">
                        {s.email || "No email"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-semibold">
                        ₹{Number(s.total).toLocaleString()}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {s.count} bookings
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" /> Upcoming
                Expirations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingExpirations.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  No bookings expiring in the next 14 days.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingExpirations.map((b: any) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg"
                    >
                      <div>
                        <p className="text-white text-sm font-medium">
                          {b.warehouse_name}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {b.seeker_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-300 text-sm">
                          {b.end_date
                            ? new Date(b.end_date).toLocaleDateString()
                            : "-"}
                        </p>
                        <p className="text-slate-400 text-xs">
                          ₹{Number(b.total_amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="bg-slate-800/60 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" /> Recent Booking
              Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left text-slate-400 pb-3 pr-4">
                      Warehouse
                    </th>
                    <th className="text-left text-slate-400 pb-3 pr-4">
                      Seeker
                    </th>
                    <th className="text-left text-slate-400 pb-3 pr-4">
                      Dates
                    </th>
                    <th className="text-right text-slate-400 pb-3 pr-4">
                      Area
                    </th>
                    <th className="text-right text-slate-400 pb-3 pr-4">
                      Amount
                    </th>
                    <th className="text-right text-slate-400 pb-3 pr-4">
                      Status
                    </th>
                    <th className="text-right text-slate-400 pb-3">
                      Booked On
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b: any) => (
                    <tr
                      key={b.id}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <p className="text-white font-medium truncate max-w-[200px]">
                          {b.warehouse_name}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {b.warehouse_city}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        <p className="text-slate-200">{b.seeker_name}</p>
                        <p className="text-slate-500 text-xs">
                          {b.seeker_email}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-slate-400">
                        {b.start_date
                          ? new Date(b.start_date).toLocaleDateString()
                          : "-"}{" "}
                        →{" "}
                        {b.end_date
                          ? new Date(b.end_date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-3 pr-4 text-right text-blue-400">
                        {Number(b.area_sqft).toLocaleString()} sqft
                      </td>
                      <td className="py-3 pr-4 text-right text-green-400">
                        ₹{Number(b.total_amount).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Badge
                          className={`text-xs ${b.booking_status === "approved" || b.booking_status === "confirmed" ? "bg-green-500/20 text-green-400" : b.booking_status === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}
                        >
                          {b.booking_status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-slate-400">
                        {b.created_at
                          ? new Date(b.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue per Warehouse */}
          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" /> Revenue by
                Warehouse (Est.)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={warehouseCompare}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    angle={-30}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    content={({ payload }: any) => {
                      if (!payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
                          <p className="text-white font-medium text-sm">
                            {d?.fullName}
                          </p>
                          <p className="text-green-400 text-sm">
                            Revenue: ₹{Number(d?.revenue).toLocaleString()}
                          </p>
                          <p className="text-blue-400 text-sm">
                            Area: {Number(d?.area).toLocaleString()} sqft
                          </p>
                          <p className="text-purple-400 text-sm">
                            ₹{d?.price}/sqft
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Est. Revenue (₹)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  >
                    {warehouseCompare.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Type Distribution */}
          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" /> Warehouse Type
                Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={data.typeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={50}
                    dataKey="count"
                    nameKey="type"
                    label={({ type, percent }: any) =>
                      `${type} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: "#94a3b8" }}
                  >
                    {data.typeDistribution.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Area & Price Comparison */}
          <Card className="bg-slate-800/60 border-slate-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" /> Area & Price
                Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={warehouseCompare}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    angle={-30}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#94a3b8"
                    label={{
                      value: "Area (sqft)",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#94a3b8",
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#94a3b8"
                    label={{
                      value: "₹/sqft",
                      angle: 90,
                      position: "insideRight",
                      fill: "#94a3b8",
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="area"
                    name="Area (sqft)"
                    fill="#3b82f680"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="price"
                    name="₹/sqft"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* City Distribution */}
          {data.cityDistribution.length > 1 && (
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-400" /> Warehouses by
                  City
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.cityDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      dataKey="count"
                      nameKey="city"
                      label={({ city, count }: any) => `${city}: ${count}`}
                      labelLine={{ stroke: "#94a3b8" }}
                    >
                      {data.cityDistribution.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Occupancy Radar */}
          {warehouseCompare.length >= 3 && (
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" /> Occupancy &
                  Rating Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={warehouseCompare}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      tick={{ fontSize: 10 }}
                    />
                    <PolarRadiusAxis stroke="#94a3b8" />
                    <Radar
                      name="Occupancy %"
                      dataKey="occupancy"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.3}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Warehouse Breakdown Table */}
        <Card className="bg-slate-800/60 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" /> Warehouse Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left text-slate-400 pb-3 pr-4">
                      Warehouse
                    </th>
                    <th className="text-left text-slate-400 pb-3 pr-4">
                      Location
                    </th>
                    <th className="text-right text-slate-400 pb-3 pr-4">
                      Area
                    </th>
                    <th className="text-right text-slate-400 pb-3 pr-4">
                      ₹/sqft
                    </th>
                    <th className="text-right text-slate-400 pb-3 pr-4">
                      Occupancy
                    </th>
                    <th className="text-right text-slate-400 pb-3 pr-4">
                      Rating
                    </th>
                    <th className="text-right text-slate-400 pb-3 pr-4">
                      Est. Revenue
                    </th>
                    <th className="text-center text-slate-400 pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.warehouseBreakdown.map((w: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <p className="text-white font-medium truncate max-w-[200px]">
                          {w.name}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-slate-400">
                        {w.city}, {w.state}
                      </td>
                      <td className="py-3 pr-4 text-right text-blue-400">
                        {Number(w.total_area).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right text-green-400">
                        ₹{w.price_per_sqft}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span
                          className={`${w.occupancy >= 70 ? "text-green-400" : w.occupancy >= 40 ? "text-yellow-400" : "text-red-400"}`}
                        >
                          {w.occupancy}%
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-yellow-400">
                        {w.rating ? `${w.rating}★` : "-"}
                      </td>
                      <td className="py-3 pr-4 text-right text-purple-400">
                        ₹{Number(w.monthlyRevenue).toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={
                            w.status === "active" || w.status === "available"
                              ? "default"
                              : "secondary"
                          }
                          className={`text-xs ${w.status === "active" || w.status === "available" ? "bg-green-500/20 text-green-400" : "bg-slate-600 text-slate-300"}`}
                        >
                          {w.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Submissions History */}
        {data.submissions.length > 0 && (
          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-400" /> Recent
                Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.submissions.slice(0, 10).map((s: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{s.name}</p>
                      <p className="text-slate-400 text-xs">
                        {s.city} •{" "}
                        {new Date(s.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs ${
                        s.status === "approved"
                          ? "bg-green-500/20 text-green-400"
                          : s.status === "rejected"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {s.status === "approved" ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : s.status === "rejected" ? (
                        <XCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
