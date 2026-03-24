import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import {
  Building2,
  Heart,
  Package,
  Activity,
  MessageSquare,
  Calendar,
  MapPin,
  Star,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Loader2,
  Eye,
  X,
  Download,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { warehouseService } from '@/services/warehouseService';

// Types
interface Booking {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  warehouse_location: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  area_sqft: number;
  blocks_booked: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  admin_status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  payment_status: string;
  created_at: string;
  admin_note?: string;
}

interface SavedWarehouse {
  id: string;
  warehouse_id: string;
  saved_at: string;
  warehouse: {
    id: string;
    wh_id: string;
    name: string;
    city: string;
    state: string;
    price_per_sqft: number;
    total_area: number;
    rating: number;
    images: string[];
    occupancy: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'booking' | 'inquiry' | 'saved' | 'view';
  description: string;
  metadata: any;
  created_at: string;
}

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  savedWarehouses: number;
  inquiriesSent: number;
}

export default function SeekerHub() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    rejectedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalSpent: 0,
    savedWarehouses: 0,
    inquiriesSent: 0
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedWarehouses, setSavedWarehouses] = useState<SavedWarehouse[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  // Get seeker ID
  const seekerId = user?.id || 'demo-seeker';

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/seeker-hub');
      return;
    }
    loadAllData();
  }, [user]);

  // Load all dashboard data
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBookings(),
        loadSavedWarehouses(),
        loadActivities()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load bookings from API
  const loadBookings = async () => {
    try {
      const response = await fetch(`/api/bookings?seeker_id=${seekerId}`);
      const data = await response.json();
      
      if (data.success && data.bookings) {
        setBookings(data.bookings);
        
        // Calculate stats from real data
        const pending = data.bookings.filter((b: Booking) => b.admin_status === 'pending').length;
        const approved = data.bookings.filter((b: Booking) => b.admin_status === 'approved').length;
        const rejected = data.bookings.filter((b: Booking) => b.admin_status === 'rejected').length;
        const completed = data.bookings.filter((b: Booking) => b.status === 'completed').length;
        const cancelled = data.bookings.filter((b: Booking) => b.status === 'cancelled').length;
        const spent = data.bookings
          .filter((b: Booking) => b.admin_status === 'approved' && b.payment_status !== 'refunded')
          .reduce((sum: number, b: Booking) => sum + (b.total_amount || 0), 0);
        
        setStats(prev => ({
          ...prev,
          totalBookings: data.bookings.length,
          pendingBookings: pending,
          approvedBookings: approved,
          rejectedBookings: rejected,
          completedBookings: completed,
          cancelledBookings: cancelled,
          totalSpent: spent
        }));
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    }
  };

  // Load saved warehouses (with localStorage fallback)
  const loadSavedWarehouses = async () => {
    try {
      console.log('📋 Loading saved warehouses for seeker:', seekerId);
      const response = await fetch(`/api/saved/${seekerId}`);
      const data = await response.json();
      console.log('📦 Saved warehouses response:', data);
      
      if (data.success && data.warehouses && data.warehouses.length > 0) {
        console.log('✅ Found', data.warehouses.length, 'saved warehouses');
        setSavedWarehouses(data.warehouses);
        setStats(prev => ({
          ...prev,
          savedWarehouses: data.warehouses.length
        }));
      } else {
        console.log('⚠️ No saved warehouses from API, trying localStorage');
        // Fallback to localStorage if server has no data
        const savedKey = `saved_warehouses_${seekerId}`;
        const localSaved = JSON.parse(localStorage.getItem(savedKey) || '[]');
        
        if (localSaved.length > 0) {
          // Fetch warehouse details for localStorage items
          const warehousePromises = localSaved.map(async (warehouseId: string) => {
            try {
              const result = await warehouseService.getWarehouseById(warehouseId);
              const warehouseData = result.data;
              if (warehouseData) {
                return {
                  id: `local_${warehouseId}`,
                  seeker_id: seekerId,
                  warehouse_id: warehouseId,
                  created_at: new Date().toISOString(),
                  warehouse: {
                    id: warehouseData.id,
                    name: warehouseData.name,
                    city: warehouseData.city,
                    state: warehouseData.state,
                    price_per_sqft: warehouseData.price_per_sqft,
                    rating: warehouseData.rating || 4.5,
                    images: warehouseData.images || []
                  }
                };
              }
              return null;
            } catch (e) {
              return null;
            }
          });
          
          const resolvedWarehouses = await Promise.all(warehousePromises);
          const validWarehouses = resolvedWarehouses.filter(w => w !== null);
          
          setSavedWarehouses(validWarehouses);
          setStats(prev => ({
            ...prev,
            savedWarehouses: validWarehouses.length
          }));
        } else {
          setSavedWarehouses([]);
        }
      }
    } catch (error) {
      console.error('Error loading saved warehouses:', error);
      // Try localStorage on error
      const savedKey = `saved_warehouses_${seekerId}`;
      const localSaved = JSON.parse(localStorage.getItem(savedKey) || '[]');
      
      if (localSaved.length > 0) {
        // Fetch warehouse details for localStorage items
        try {
          const warehousePromises = localSaved.map(async (warehouseId: string) => {
            try {
              const result = await warehouseService.getWarehouseById(warehouseId);
              const warehouseData = result.data;
              if (warehouseData) {
                return {
                  id: `local_${warehouseId}`,
                  seeker_id: seekerId,
                  warehouse_id: warehouseId,
                  created_at: new Date().toISOString(),
                  warehouse: {
                    id: warehouseData.id,
                    name: warehouseData.name,
                    city: warehouseData.city,
                    state: warehouseData.state,
                    price_per_sqft: warehouseData.price_per_sqft,
                    rating: warehouseData.rating || 4.5,
                    images: warehouseData.images || []
                  }
                };
              }
              return null;
            } catch (e) {
              return null;
            }
          });
          
          const resolvedWarehouses = await Promise.all(warehousePromises);
          const validWarehouses = resolvedWarehouses.filter(w => w !== null);
          
          setSavedWarehouses(validWarehouses);
          setStats(prev => ({
            ...prev,
            savedWarehouses: validWarehouses.length
          }));
        } catch (e) {
          setSavedWarehouses([]);
        }
      } else {
        setSavedWarehouses([]);
      }
    }
  };

  // Load recent activities
  const loadActivities = async () => {
    try {
      const response = await fetch(`/api/activity/${seekerId}?limit=20`);
      const data = await response.json();
      
      if (data.success && data.activities) {
        // Filter out booking activities since we show them separately
        const nonBookingActivities = data.activities.filter(
          (a: ActivityItem) => a.type !== 'booking'
        );
        setActivities(nonBookingActivities);
        
        // Count inquiries
        const inquiryCount = data.activities.filter(
          (a: ActivityItem) => a.type === 'inquiry'
        ).length;
        setStats(prev => ({
          ...prev,
          inquiriesSent: inquiryCount
        }));
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, seeker_id: seekerId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Booking Cancelled", description: "Your booking has been cancelled successfully." });
        loadBookings();
      } else {
        throw new Error(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({ 
        title: "Error", 
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Remove saved warehouse
  const handleRemoveSaved = async (warehouseId: string) => {
    try {
      const response = await fetch('/api/saved/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seekerId, warehouseId })
      });
      
      const data = await response.json();
      
      if (data.success && !data.saved) {
        setSavedWarehouses(prev => prev.filter(sw => sw.warehouse_id !== warehouseId));
        setStats(prev => ({ ...prev, savedWarehouses: prev.savedWarehouses - 1 }));
        toast({ title: "Removed", description: "Warehouse removed from saved list." });
      }
    } catch (error) {
      console.error('Error removing saved warehouse:', error);
      toast({ 
        title: "Error", 
        description: "Failed to remove warehouse.",
        variant: "destructive"
      });
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    if (bookingFilter !== 'all') {
      // Match against admin_status for pending/approved/rejected, status for completed/active/cancelled
      const matchesAdmin = booking.admin_status === bookingFilter;
      const matchesStatus = booking.status === bookingFilter;
      if (!matchesAdmin && !matchesStatus) return false;
    }
    if (searchTerm && !booking.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (booking: Booking) => {
    const a = booking.admin_status;
    const s = booking.status;
    if (a === 'pending') return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="h-3 w-3 mr-1" />Awaiting Owner</Badge>;
    if (a === 'rejected') return <Badge className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    if (a === 'cancelled' || s === 'cancelled') return <Badge className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
    if (s === 'completed') return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    if (a === 'approved' && s === 'active') return <Badge className="bg-green-500/20 text-green-400 border-green-500/50"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    if (a === 'approved') return <Badge className="bg-green-500/20 text-green-400 border-green-500/50"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    return <Badge variant="outline">{a || s}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
          {/* Booking Status Notifications */}
          {bookings
            .filter(b => (b.admin_status === 'approved' || b.admin_status === 'rejected') &&
              !dismissedNotifications.has(b.id))
            .slice(0, 3)
            .map(b => (
              <div
                key={b.id}
                className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                  b.admin_status === 'approved'
                    ? 'border-green-500/40 bg-green-500/10 text-green-300'
                    : 'border-red-500/40 bg-red-500/10 text-red-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {b.admin_status === 'approved' ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <span className="font-medium">
                      {b.admin_status === 'approved' ? 'Booking Approved! ' : 'Booking Rejected — '}
                    </span>
                    {b.admin_status === 'approved'
                      ? <>Your request for <span className="font-semibold">{b.warehouse_name}</span> has been approved by the owner.</>
                      : <>Your request for <span className="font-semibold">{b.warehouse_name}</span> was not accepted.{b.admin_note ? ` Reason: ${b.admin_note}` : ''}</>
                    }
                    {b.admin_status === 'approved' && (
                      <button
                        className="ml-3 underline text-green-400 hover:text-green-200"
                        onClick={() => { setActiveTab('bookings'); setBookingFilter('approved'); }}
                      >
                        View Booking
                      </button>
                    )}
                  </div>
                </div>
                <button
                  title="Dismiss notification"
                  className="shrink-0 opacity-60 hover:opacity-100"
                  onClick={() => setDismissedNotifications(prev => new Set([...prev, b.id]))}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
        {/* Header */}
        <Card className="glass-card mb-8 border-slate-700/60 bg-slate-900/40 backdrop-blur-sm">
          <CardContent className="p-6 md:p-7">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.name || 'Seeker'}</h1>
                <p className="text-gray-400">
                  Manage your bookings, saved warehouses, and activity from one place
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={loadAllData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => navigate('/warehouses')}>
                  <Search className="h-4 w-4 mr-2" />
                  Find Warehouses
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pendingBookings}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Approved</p>
                  <p className="text-2xl font-bold text-green-400">{stats.approvedBookings}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Cancelled</p>
                  <p className="text-2xl font-bold text-red-400">{stats.cancelledBookings}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Saved</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.savedWarehouses}</p>
                </div>
                <Heart className="h-8 w-8 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Total Spent</p>
                  <p className="text-xl font-bold text-green-400">
                    ₹{stats.totalSpent > 0 ? (stats.totalSpent / 1000).toFixed(0) + 'K' : '0'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-slate-900/60 border border-slate-700/60">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
              {stats.pendingBookings > 0 && (
                <Badge className="ml-1 bg-yellow-500 text-xs">{stats.pendingBookings}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
              {stats.savedWarehouses > 0 && (
                <Badge className="ml-1 bg-purple-500 text-xs">{stats.savedWarehouses}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Recent Bookings
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('bookings')}>
                      View All <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-gray-600 mb-3" />
                      <p className="text-gray-400">No bookings yet</p>
                      <Button variant="outline" className="mt-3" onClick={() => navigate('/warehouses')}>
                        Browse Warehouses
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.slice(0, 3).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{booking.warehouse_name}</p>
                            <p className="text-sm text-gray-400">
                              {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                            </p>
                          </div>
                          <div className="ml-3">
                            {getStatusBadge(booking)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Saved Warehouses Preview */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Saved Warehouses
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('saved')}>
                      View All <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {savedWarehouses.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 mx-auto text-gray-600 mb-3" />
                      <p className="text-gray-400">No saved warehouses</p>
                      <Button variant="outline" className="mt-3" onClick={() => navigate('/warehouses')}>
                        Browse & Save
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedWarehouses.slice(0, 3).map((saved) => (
                        <div key={saved.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{saved.warehouse?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-400">
                              {saved.warehouse?.city}, {saved.warehouse?.state}
                            </p>
                          </div>
                          <div className="ml-3 text-right">
                            <p className="font-medium text-green-400">₹{saved.warehouse?.price_per_sqft}/sq ft</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/warehouses')}>
                    <Search className="h-6 w-6 mb-2" />
                    Find Warehouses
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/ml-recommendations')}>
                    <TrendingUp className="h-6 w-6 mb-2" />
                    AI Recommendations
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/seeker-profile')}>
                    <Building2 className="h-6 w-6 mb-2" />
                    My Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            {/* Filters */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder="Search bookings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-gray-800/50"
                    />
                  </div>
                  <Select value={bookingFilter} onValueChange={setBookingFilter}>
                    <SelectTrigger className="w-[180px] bg-gray-800/50">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Bookings</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Booking Count Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className={`cursor-pointer transition-all ${bookingFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setBookingFilter('all')}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  <p className="text-xs text-gray-400">All</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all ${bookingFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
                onClick={() => setBookingFilter('pending')}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{stats.pendingBookings}</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all ${bookingFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => setBookingFilter('approved')}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.approvedBookings}</p>
                  <p className="text-xs text-gray-400">Approved</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all ${bookingFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
                onClick={() => setBookingFilter('rejected')}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-300">{stats.rejectedBookings}</p>
                  <p className="text-xs text-gray-400">Rejected</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all ${bookingFilter === 'completed' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setBookingFilter('completed')}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{stats.completedBookings}</p>
                  <p className="text-xs text-gray-400">Completed</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all ${bookingFilter === 'cancelled' ? 'ring-2 ring-red-500' : ''}`}
                onClick={() => setBookingFilter('cancelled')}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.cancelledBookings}</p>
                  <p className="text-xs text-gray-400">Cancelled</p>
                </CardContent>
              </Card>
            </div>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="text-center py-16">
                  <Package className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Bookings Found</h3>
                  <p className="text-gray-400 mb-6">
                    {bookingFilter !== 'all' 
                      ? `No ${bookingFilter} bookings at the moment.`
                      : "You haven't made any bookings yet. Start by exploring warehouses!"}
                  </p>
                  <Button onClick={() => navigate('/warehouses')}>
                    <Search className="h-4 w-4 mr-2" />
                    Browse Warehouses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <Card key={booking.id} className="glass-card">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{booking.warehouse_name}</h3>
                            {getStatusBadge(booking)}
                          </div>
                          <p className="text-gray-400 text-sm flex items-center mb-3">
                            <MapPin className="h-4 w-4 mr-1" />
                            {booking.warehouse_location}
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Check-in</p>
                              <p className="font-medium">{formatDate(booking.start_date)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Check-out</p>
                              <p className="font-medium">{formatDate(booking.end_date)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Area</p>
                              <p className="font-medium">{booking.area_sqft?.toLocaleString() || 'N/A'} sq ft</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Amount</p>
                              <p className="font-medium text-green-400">₹{booking.total_amount?.toLocaleString() || 'N/A'}</p>
                            </div>
                          </div>
                          
                          {booking.admin_note && (
                            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <p className="text-sm text-blue-400">
                                <span className="font-medium">Admin Note:</span> {booking.admin_note}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/warehouses/${booking.warehouse_id}`)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {booking.admin_status === 'approved' && (
                            <Button variant="outline" size="sm" onClick={() => navigate(`/invoice/${booking.id}`)}>
                              <Download className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          )}
                          {booking.admin_status === 'pending' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this booking request? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCancelBooking(booking.id)}>
                                    Yes, Cancel
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="space-y-6">
            {savedWarehouses.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="text-center py-16">
                  <Heart className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Saved Warehouses</h3>
                  <p className="text-gray-400 mb-6">
                    Save warehouses you're interested in for quick access later!
                  </p>
                  <Button onClick={() => navigate('/warehouses')}>
                    <Search className="h-4 w-4 mr-2" />
                    Browse Warehouses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedWarehouses.map((saved) => {
                  const warehouse = saved.warehouse;
                  if (!warehouse) return null;
                  
                  return (
                    <Card key={saved.id} className="glass-card overflow-hidden">
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={warehouse.images?.[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400'}
                          alt={warehouse.name}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          title="Remove saved warehouse"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                          onClick={() => handleRemoveSaved(warehouse.id)}
                        >
                          <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{warehouse.name}</h3>
                        <p className="text-sm text-gray-400 flex items-center mb-3">
                          <MapPin className="h-4 w-4 mr-1" />
                          {warehouse.city}, {warehouse.state}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xl font-bold text-green-400">
                            ₹{warehouse.price_per_sqft}/sq ft
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{warehouse.rating || 4.5}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => navigate(`/warehouses/${warehouse.wh_id || warehouse.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            className="flex-1"
                            onClick={() => navigate(`/warehouses/${warehouse.wh_id || warehouse.id}`)}
                          >
                            Book Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent interactions and activity on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length === 0 && bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
                    <p className="text-gray-400 mb-6">
                      Start exploring warehouses to see your activity here!
                    </p>
                    <Button onClick={() => navigate('/warehouses')}>
                      <Search className="h-4 w-4 mr-2" />
                      Explore Warehouses
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Show bookings as activity items */}
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
                        <div className="p-2 rounded-full bg-green-500/20">
                          <Package className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            Booking for {booking.warehouse_name}
                            {booking.blocks_booked > 0 && ` - ${booking.blocks_booked} blocks`}
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatDate(booking.start_date)} to {formatDate(booking.end_date)}
                          </p>
                          <div className="mt-2">
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          {formatDate(booking.created_at)}
                        </div>
                      </div>
                    ))}
                    
                    {/* Show other activities */}
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'inquiry' ? 'bg-blue-500/20' :
                          activity.type === 'saved' ? 'bg-purple-500/20' : 'bg-gray-500/20'
                        }`}>
                          {activity.type === 'inquiry' ? (
                            <MessageSquare className="h-5 w-5 text-blue-400" />
                          ) : activity.type === 'saved' ? (
                            <Heart className="h-5 w-5 text-purple-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          {formatDate(activity.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
