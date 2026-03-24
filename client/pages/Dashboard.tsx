import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Bot,
  Calendar,
  ChartBar as BarChart3,
  DollarSign,
  Eye,
  Loader,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Upload,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getAIResponse } from "@/services/aiService";
import {
  warehouseService,
  type SupabaseWarehouse,
} from "@/services/warehouseService";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [ownerSection, setOwnerSection] = useState("overview");
  const [ownerWarehouses, setOwnerWarehouses] = useState<SupabaseWarehouse[]>(
    [],
  );
  const [ownerBookingItems, setOwnerBookingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalInquiries: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
  });
  const [ownerOps, setOwnerOps] = useState({
    pendingBookings: 0,
    approvedBookings: 0,
    rejectedBookings: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
  });

  const isOwner = profile?.user_type === "owner";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user && profile) {
      loadDashboardData();

      if (profile.user_type === "owner") {
        const channel = supabase
          .channel(`owner-dashboard-${user.id}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "activity_logs" },
            (payload) => {
              const row = payload.new as { type?: string; seeker_id?: string };
              if (
                (row.type === "booking" || row.type === "notification") &&
                row.seeker_id === user.id
              ) {
                loadDashboardData();
              }
            },
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "bookings",
              filter: `owner_id=eq.${user.id}`,
            },
            () => {
              loadDashboardData();
            },
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "warehouse_submissions",
              filter: `owner_id=eq.${user.id}`,
            },
            () => {
              loadDashboardData();
            },
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "warehouses",
              filter: `owner_id=eq.${user.id}`,
            },
            () => {
              loadDashboardData();
            },
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [user, profile, authLoading, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      if (profile?.user_type === "owner" && user) {
        const [
          { data: ownerWarehouses, count },
          bookingsResp,
          submissionsResp,
        ] = await Promise.all([
          warehouseService.getWarehousesByOwner(user.id),
          fetch(`/api/owner/bookings?owner_id=${encodeURIComponent(user.id)}`),
          fetch(
            `/api/warehouse-submissions/owner/${encodeURIComponent(user.id)}`,
          ),
        ]);

        const bookingsPayload = bookingsResp.ok
          ? await bookingsResp.json()
          : { success: false, bookings: [] };
        const submissionsPayload = submissionsResp.ok
          ? await submissionsResp.json()
          : { success: false, submissions: [] };

        const ownerBookings = (bookingsPayload.bookings || []) as Array<{
          booking_status?: string;
          total_amount?: number;
        }>;
        const ownerSubmissions = (submissionsPayload.submissions ||
          []) as Array<{
          status?: string;
        }>;

        const pendingBookings = ownerBookings.filter(
          (b) => b.booking_status === "pending",
        ).length;
        const approvedBookings = ownerBookings.filter(
          (b) => b.booking_status === "approved",
        ).length;
        const rejectedBookings = ownerBookings.filter(
          (b) =>
            b.booking_status === "rejected" || b.booking_status === "cancelled",
        ).length;
        const approvedRevenue = ownerBookings
          .filter((b) => b.booking_status === "approved")
          .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

        const pendingSubmissions = ownerSubmissions.filter(
          (s) => s.status === "pending",
        ).length;
        const approvedSubmissions = ownerSubmissions.filter(
          (s) => s.status === "approved",
        ).length;

        const occupancyRate = ownerWarehouses?.length
          ? Math.round(
              ownerWarehouses.reduce((sum, w) => {
                const raw = Number(w.occupancy || 0);
                return sum + (raw <= 1 ? raw * 100 : raw);
              }, 0) / ownerWarehouses.length,
            )
          : 0;

        setStats({
          totalProperties: count || 0,
          totalInquiries: pendingBookings,
          monthlyRevenue: approvedRevenue,
          occupancyRate,
        });

        setOwnerOps({
          pendingBookings,
          approvedBookings,
          rejectedBookings,
          pendingSubmissions,
          approvedSubmissions,
        });

        setOwnerBookingItems(bookingsPayload.bookings || []);
        setOwnerWarehouses(ownerWarehouses || []);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error loading data",
        description: "Could not load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateOwnerInsights = async () => {
    setAiLoading(true);
    try {
      const prompt = `Create a short owner insight (4-6 sentences) for a warehouse owner dashboard.

Portfolio Summary:
- Total Properties: ${stats.totalProperties}
- Avg Occupancy: ${stats.occupancyRate}%

Provide 2 actionable tips on pricing, availability, or marketing.`;

      const response = await getAIResponse({
        prompt,
        systemPrompt:
          "You are a business advisor for warehouse owners. Keep it concise and actionable.",
        temperature: 0.3,
        maxTokens: 220,
      });

      setAiInsights(response.text.trim());
    } catch (error) {
      console.error("AI insight error:", error);
      toast({
        title: "AI insights failed",
        description: "Unable to generate insights right now.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">
          Please sign in to access your dashboard.
        </p>
      </div>
    );
  }

  const OwnerDashboard = () => (
    <div className="font-space">
      <Tabs
        value={ownerSection}
        onValueChange={setOwnerSection}
        className="w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr] gap-6 lg:gap-8 items-start">
          <aside className="hidden lg:block shrink-0">
            <div className="sticky top-24 space-y-4">
              <Card className="border-slate-700/60 bg-slate-900/40">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Workspace
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-3 pb-3">
                  <TabsList className="flex flex-col h-auto w-full items-stretch gap-1 bg-transparent p-0">
                    <TabsTrigger
                      value="overview"
                      className="justify-start gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 data-[state=active]:bg-slate-800/80 data-[state=active]:text-white data-[state=active]:shadow-none rounded-md transition-colors"
                    >
                      <Sparkles className="h-4 w-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="properties"
                      className="justify-start gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 data-[state=active]:bg-slate-800/80 data-[state=active]:text-white data-[state=active]:shadow-none rounded-md transition-colors"
                    >
                      <Building2 className="h-4 w-4" />
                      Properties
                    </TabsTrigger>
                    <TabsTrigger
                      value="bookings"
                      className="justify-start gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 data-[state=active]:bg-slate-800/80 data-[state=active]:text-white data-[state=active]:shadow-none rounded-md transition-colors"
                    >
                      <Calendar className="h-4 w-4" />
                      Bookings & Requests
                    </TabsTrigger>
                    <TabsTrigger
                      value="analytics"
                      className="justify-start gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 data-[state=active]:bg-slate-800/80 data-[state=active]:text-white data-[state=active]:shadow-none rounded-md transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>
            </div>
          </aside>

          <div className="space-y-6">
            <Card className="border-slate-700/60 bg-slate-900/40">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Owner Workspace
                    </p>
                    <h2 className="text-2xl font-semibold text-white">
                      Welcome, {profile.name}
                    </h2>
                    <p className="text-sm text-slate-300 mt-1">
                      Manage your warehouse properties and track performance
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/list-property">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Property
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="lg:hidden">
              <Card className="border-slate-700/60 bg-slate-900/40 p-1.5 mb-6">
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 h-auto bg-transparent w-full p-0">
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-slate-800/80 data-[state=active]:shadow-none py-2 text-xs"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="properties"
                    className="data-[state=active]:bg-slate-800/80 data-[state=active]:shadow-none py-2 text-xs"
                  >
                    Properties
                  </TabsTrigger>
                  <TabsTrigger
                    value="bookings"
                    className="data-[state=active]:bg-slate-800/80 data-[state=active]:shadow-none py-2 text-xs"
                  >
                    Bookings
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="data-[state=active]:bg-slate-800/80 data-[state=active]:shadow-none py-2 text-xs"
                  >
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </Card>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <Card className="border-slate-700/60 bg-slate-900/40">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Portfolio Summary
                      </p>
                      <h3 className="text-lg font-semibold text-white">
                        Your operational snapshot
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 text-emerald-300"
                      >
                        Active listings:{" "}
                        {
                          ownerWarehouses.filter(
                            (w) =>
                              w.status === "active" || w.status === "approved",
                          ).length
                        }
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 text-amber-300"
                      >
                        Pending approvals: {ownerOps.pendingSubmissions}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-blue-500/40 text-blue-300"
                      >
                        Approved bookings: {ownerOps.approvedBookings}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-violet-500/40 text-violet-300"
                      >
                        Avg occupancy: {stats.occupancyRate}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-fr">
                  <Card className="h-full">
                    <CardContent className="p-6 h-full">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Total Properties
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.totalProperties}
                          </p>
                        </div>
                        <Building2 className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="h-full">
                    <CardContent className="p-6 h-full">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Monthly Revenue
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            ₹{(stats.monthlyRevenue / 100000).toFixed(1)}L
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="h-full">
                    <CardContent className="p-6 h-full">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Pending Requests
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.totalInquiries}
                          </p>
                        </div>
                        <MessageSquare className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="h-full">
                    <CardContent className="p-6 h-full">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Occupancy Rate
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.occupancyRate}%
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-600" />
                      </div>
                      <Progress value={stats.occupancyRate} className="mt-2" />
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="border-slate-700/60 bg-slate-900/40">
                    <CardHeader>
                      <CardTitle className="text-base">Owner Control</CardTitle>
                      <CardDescription>
                        Operational queue and listing health
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-md bg-slate-800/60 px-3 py-3 text-slate-300">
                          Pending bookings
                          <div className="text-lg font-semibold text-white">
                            {ownerOps.pendingBookings}
                          </div>
                        </div>
                        <div className="rounded-md bg-slate-800/60 px-3 py-3 text-slate-300">
                          Pending listings
                          <div className="text-lg font-semibold text-white">
                            {ownerOps.pendingSubmissions}
                          </div>
                        </div>
                        <div className="rounded-md bg-slate-800/60 px-3 py-3 text-slate-300">
                          Approved bookings
                          <div className="text-lg font-semibold text-white">
                            {ownerOps.approvedBookings}
                          </div>
                        </div>
                        <div className="rounded-md bg-slate-800/60 px-3 py-3 text-slate-300">
                          Approved listings
                          <div className="text-lg font-semibold text-white">
                            {ownerOps.approvedSubmissions}
                          </div>
                        </div>
                      </div>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/owner/notifications">
                          <Calendar className="mr-2 h-4 w-4" />
                          View Booking Requests
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="border-blue-200/40 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 dark:from-slate-900/60 dark:to-slate-800/60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">
                        AI Owner Insights
                      </CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateOwnerInsights}
                      disabled={aiLoading}
                      className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
                    >
                      {aiLoading ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                          Generate Insights
                        </>
                      )}
                    </Button>
                  </div>
                  <CardDescription>
                    Personalized market and pricing guidance for your portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aiInsights ? (
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      {aiInsights}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Click “Generate Insights” to get AI guidance on pricing,
                      demand, and marketing.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Property Management</CardTitle>
                      <CardDescription>
                        Insights and controls for every warehouse you own
                      </CardDescription>
                    </div>
                    <Button asChild>
                      <Link to="/list-property">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Property
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!loading && ownerWarehouses.length > 0 ? (
                    <div className="space-y-4">
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                              <th className="pb-3 pr-4 text-slate-500">
                                Warehouse
                              </th>
                              <th className="pb-3 pr-4 text-slate-500">
                                Availability
                              </th>
                              <th className="pb-3 pr-4 text-slate-500">
                                Price
                              </th>
                              <th className="pb-3 pr-4 text-slate-500">
                                Status
                              </th>
                              <th className="pb-3 text-right text-slate-500">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {ownerWarehouses.map((property) => (
                              <tr
                                key={property.id}
                                className="border-b border-slate-100 dark:border-slate-800"
                              >
                                <td className="py-4 pr-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-200">
                                      <img
                                        src={
                                          property.images &&
                                          property.images.length > 0
                                            ? property.images[0]
                                            : "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop&crop=center"
                                        }
                                        alt={property.name || "Warehouse"}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src =
                                            "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop&crop=center";
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <p className="font-medium text-slate-900 dark:text-slate-100">
                                        {property.name ||
                                          `Warehouse in ${property.city}`}
                                      </p>
                                      <p className="text-xs text-slate-500 flex items-center">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {property.city}, {property.state}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 pr-4 text-slate-600 dark:text-slate-300">
                                  {Math.floor(
                                    property.total_area *
                                      (1 -
                                        (Number(property.occupancy || 0) <= 1
                                          ? Number(property.occupancy || 0)
                                          : Number(property.occupancy || 0) /
                                            100)),
                                  ).toLocaleString()}{" "}
                                  sq ft
                                </td>
                                <td className="py-4 pr-4 text-slate-600 dark:text-slate-300">
                                  ₹{property.price_per_sqft}/sq ft
                                </td>
                                <td className="py-4 pr-4">
                                  <Badge
                                    variant={
                                      property.status === "active" ||
                                      property.status === "approved"
                                        ? "default"
                                        : property.status === "rejected"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                  >
                                    {property.status === "active"
                                      ? "Active"
                                      : property.status === "approved"
                                        ? "Approved"
                                        : property.status === "rejected"
                                          ? "Rejected"
                                          : property.status ===
                                              "pending_approval"
                                            ? "Pending Review"
                                            : "Pending"}
                                  </Badge>
                                </td>
                                <td className="py-4 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <Button size="sm" variant="outline" asChild>
                                      <Link
                                        to={
                                          property.status === "active" ||
                                          property.status === "approved"
                                            ? `/warehouses/${property.id}`
                                            : "#"
                                        }
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        {property.status === "pending_approval"
                                          ? "Pending"
                                          : "View"}
                                      </Link>
                                    </Button>
                                    <Button size="sm" variant="ghost">
                                      <Settings className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="space-y-4 md:hidden">
                        {ownerWarehouses.map((property) => (
                          <div
                            key={property.id}
                            className="rounded-lg border border-slate-200 dark:border-slate-800 p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 overflow-hidden rounded-lg bg-slate-200">
                                <img
                                  src={
                                    property.images &&
                                    property.images.length > 0
                                      ? property.images[0]
                                      : "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop&crop=center"
                                  }
                                  alt={property.name || "Warehouse"}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop&crop=center";
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                  {property.name ||
                                    `Warehouse in ${property.city}`}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {property.city}, {property.state}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  property.status === "active" ||
                                  property.status === "approved"
                                    ? "default"
                                    : property.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {property.status === "active"
                                  ? "Active"
                                  : property.status === "approved"
                                    ? "Approved"
                                    : property.status === "rejected"
                                      ? "Rejected"
                                      : property.status === "pending_approval"
                                        ? "Pending Review"
                                        : "Pending"}
                              </Badge>
                            </div>
                            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                              <div>
                                {Math.floor(
                                  property.total_area *
                                    (1 -
                                      (Number(property.occupancy || 0) <= 1
                                        ? Number(property.occupancy || 0)
                                        : Number(property.occupancy || 0) /
                                          100)),
                                ).toLocaleString()}{" "}
                                sq ft available
                              </div>
                              <div>₹{property.price_per_sqft}/sq ft</div>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                                className="flex-1"
                              >
                                <Link
                                  to={
                                    property.status === "active" ||
                                    property.status === "approved"
                                      ? `/warehouses/${property.id}`
                                      : "#"
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  {property.status === "pending_approval"
                                    ? "Pending"
                                    : "View"}
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="flex-1"
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Building2 className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Properties Listed
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Start by listing your first warehouse property
                      </p>
                      <Button asChild>
                        <Link to="/list-property">
                          <Plus className="mr-2 h-4 w-4" />
                          List Your Property
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Tools</CardTitle>
                  <CardDescription>
                    Import and manage bulk inventory (Coming Soon)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <Upload className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Bulk import feature will be available soon
                    </p>
                    <Button variant="outline" disabled>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Booking Notifications
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={loadDashboardData}
                      className="hover:bg-blue-50 dark:hover:bg-blue-950"
                      title="Refresh notifications"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                  <CardDescription>
                    View and respond to booking requests for your properties
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Badge
                      variant="outline"
                      className={`justify-center text-xs ${ownerOps.pendingBookings > 0 ? "border-red-500/50 text-red-600 dark:text-red-400" : "border-amber-500/50 text-amber-600"}`}
                    >
                      Pending bookings: {ownerOps.pendingBookings}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="justify-center text-xs border-blue-500/50 text-blue-600"
                    >
                      Pending listings: {ownerOps.pendingSubmissions}
                    </Badge>
                  </div>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Link to="/owner/notifications">
                      View All Notifications
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Owner Booking Activity
                  </CardTitle>
                  <CardDescription>
                    Recent booking requests and updates for your warehouses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ownerBookingItems.length === 0 ? (
                    <div className="text-center py-10">
                      <MessageSquare className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500">No booking activity yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left text-slate-500 pb-3 pr-4">
                              Warehouse
                            </th>
                            <th className="text-left text-slate-500 pb-3 pr-4">
                              Seeker
                            </th>
                            <th className="text-left text-slate-500 pb-3 pr-4">
                              Dates
                            </th>
                            <th className="text-right text-slate-500 pb-3 pr-4">
                              Amount
                            </th>
                            <th className="text-right text-slate-500 pb-3 pr-4">
                              Status
                            </th>
                            <th className="text-right text-slate-500 pb-3">
                              Booked On
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {ownerBookingItems.slice(0, 8).map((b: any) => (
                            <tr
                              key={b.id}
                              className="border-b border-slate-100 dark:border-slate-800"
                            >
                              <td className="py-3 pr-4">
                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                  {b.warehouse_name || "Warehouse"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {b.warehouse_city || ""}
                                </p>
                              </td>
                              <td className="py-3 pr-4">
                                <p className="text-slate-800 dark:text-slate-200">
                                  {b.seeker_name || "Customer"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {b.seeker_email || ""}
                                </p>
                              </td>
                              <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                                {b.start_date
                                  ? new Date(b.start_date).toLocaleDateString()
                                  : "-"}{" "}
                                →{" "}
                                {b.end_date
                                  ? new Date(b.end_date).toLocaleDateString()
                                  : "-"}
                              </td>
                              <td className="py-3 pr-4 text-right text-green-600">
                                ₹{Number(b.total_amount || 0).toLocaleString()}
                              </td>
                              <td className="py-3 pr-4 text-right">
                                <Badge
                                  className={`text-xs ${b.booking_status === "approved" || b.booking_status === "confirmed" ? "bg-green-500/20 text-green-500" : b.booking_status === "rejected" ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-600"}`}
                                >
                                  {b.booking_status || "pending"}
                                </Badge>
                              </td>
                              <td className="py-3 text-right text-slate-500">
                                {b.created_at
                                  ? new Date(b.created_at).toLocaleDateString()
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Analytics Center
                  </CardTitle>
                  <CardDescription>
                    Deep analytics, revenue, and booking intelligence
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-800/60 px-3 py-3 text-slate-200">
                      Bookings Approved
                      <div className="text-lg font-semibold text-white">
                        {ownerOps.approvedBookings}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 px-3 py-3 text-slate-200">
                      Bookings Pending
                      <div className="text-lg font-semibold text-white">
                        {ownerOps.pendingBookings}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 px-3 py-3 text-slate-200">
                      Listings Pending
                      <div className="text-lg font-semibold text-white">
                        {ownerOps.pendingSubmissions}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 px-3 py-3 text-slate-200">
                      Monthly Revenue
                      <div className="text-lg font-semibold text-white">
                        ₹{(stats.monthlyRevenue / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </div>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Link to="/owner/analytics">Open Full Analytics</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );

  const SeekerDashboard = () => (
    <Card>
      <CardHeader>
        <CardTitle>Seeker Dashboard</CardTitle>
        <CardDescription>
          Explore warehouses and manage your bookings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Browse Warehouses
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Find storage spaces that match your needs.
          </p>
          <Button asChild>
            <Link to="/warehouses">Find Warehouses</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {!isOwner && (
          <Card className="mb-8 border-slate-700/60 bg-slate-900/40 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Welcome, {profile.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Find and book warehouse spaces for your business
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/warehouses">
                      <Search className="mr-2 h-4 w-4" />
                      Find Warehouses
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {!isOwner && (
            <TabsList className="grid w-full grid-cols-3 bg-slate-900/60 border border-slate-700/60">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value={"saved"}>Saved</TabsTrigger>
              <TabsTrigger value={"activity"}>Activity</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="overview" className="mt-6">
            {isOwner ? <OwnerDashboard /> : <SeekerDashboard />}
          </TabsContent>

          <TabsContent
            value={isOwner ? "properties" : "saved"}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {isOwner ? "Property Management" : "Saved Properties"}
                </CardTitle>
                <CardDescription>
                  {isOwner
                    ? "Detailed management tools for your warehouse listings"
                    : "Properties you have bookmarked for future reference"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Building2 className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    More tools coming soon
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    We are expanding this workspace with richer tools.
                  </p>
                  <Button asChild>
                    <Link to={isOwner ? "/list-property" : "/warehouses"}>
                      {isOwner ? "Add Property" : "Browse Warehouses"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value={isOwner ? "inquiries" : "activity"}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {isOwner ? "Inquiries & Messages" : "Activity"}
                </CardTitle>
                <CardDescription>
                  {isOwner
                    ? "Manage tenant inquiries and communications"
                    : "Track your requests and updates"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Messaging hub coming soon
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    We are building advanced inquiry management features.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
