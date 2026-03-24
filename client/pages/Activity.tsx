import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
  ActivityTimelineResponse,
  ActivityLog,
  ActivityStatsResponse,
  ActivityStats,
  SeekerInquiriesResponse,
  Inquiry
} from '@shared/api';
import {
  Activity,
  Calendar,
  MessageSquare,
  Package,
  CreditCard,
  XCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Filter,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Building2,
  Heart
} from 'lucide-react';

type ActivityType = 'all' | 'booking' | 'inquiry' | 'payment' | 'cancellation';

interface BookingActivity {
  id: string;
  warehouse_name: string;
  warehouse_location: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  created_at: string;
  area_sqft?: number;
  blocks_booked?: number | Array<{ block_number: number }>;
  selected_blocks?: number[];
}

// Helper to get block count from booking
const getBlockCount = (booking: BookingActivity): number => {
  if (Array.isArray(booking.blocks_booked)) {
    return booking.blocks_booked.length;
  }
  if (typeof booking.blocks_booked === 'number') {
    return booking.blocks_booked;
  }
  if (Array.isArray(booking.selected_blocks)) {
    return booking.selected_blocks.length;
  }
  return 0;
};

export default function ActivityPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [bookings, setBookings] = useState<BookingActivity[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityType>('all');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Get seeker ID from auth context
  const currentSeekerId = user?.id || "demo-seeker";

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    refreshData();
  }, [user]);

  // Fetch activity stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/activity/${currentSeekerId}/stats`);
      const data: ActivityStatsResponse = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      // Set default stats on error
      setStats({
        activities: { total: 0, bookings: 0, inquiries: 0, payments: 0, cancellations: 0 },
        inquiries: { total: 0, open: 0, responded: 0, closed: 0 },
        savedWarehouses: 0
      });
    }
  };

  // Fetch real bookings from the bookings endpoint
  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/bookings?seeker_id=${currentSeekerId}`);
      const data = await response.json();
      
      if (data.success && data.bookings) {
        setBookings(data.bookings);
        
        // Update stats with real booking count
        setStats(prev => prev ? {
          ...prev,
          activities: {
            ...prev.activities,
            total: data.bookings.length,
            bookings: data.bookings.length
          }
        } : {
          activities: { total: data.bookings.length, bookings: data.bookings.length, inquiries: 0, payments: 0, cancellations: 0 },
          inquiries: { total: 0, open: 0, responded: 0, closed: 0 },
          savedWarehouses: 0
        });
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Fetch activity timeline
  const fetchActivities = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.append('limit', '20');
      params.append('offset', reset ? '0' : offset.toString());
      if (activityFilter !== 'all') {
        params.append('type', activityFilter);
      }

      const response = await fetch(`/api/activity/${currentSeekerId}?${params}`);
      const data: ActivityTimelineResponse = await response.json();

      if (data.success) {
        if (reset) {
          setActivities(data.activities);
          setOffset(20);
        } else {
          setActivities(prev => [...prev, ...data.activities]);
          setOffset(prev => prev + 20);
        }
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activities. Please try again.",
        variant: "destructive",
      });
      // Set empty activities on error
      setActivities([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch inquiries
  const fetchInquiries = async () => {
    try {
      const response = await fetch(`/api/inquiries/${currentSeekerId}`);
      const data: SeekerInquiriesResponse = await response.json();
      
      if (data.success) {
        setInquiries(data.inquiries);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      setInquiries([]);
    }
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Package className="h-4 w-4" />;
      case 'inquiry':
        return <MessageSquare className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'cancellation':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Get activity color
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'text-green-400 bg-green-500/20';
      case 'inquiry':
        return 'text-blue-400 bg-blue-500/20';
      case 'payment':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'cancellation':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  // Get inquiry status icon
  const getInquiryStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'responded':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-400" />;
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchBookings(),
      fetchActivities(true),
      fetchInquiries()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchActivities(true);
    }
  }, [activityFilter]);

  if (loading && activities.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-400">Loading your activity...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/seeker-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Activity Dashboard</h1>
            <p className="text-gray-400">
              Track your warehouse activities and communications
            </p>
          </div>
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Total Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activities.total || 0}</div>
              <div className="flex items-center mt-2 text-sm text-gray-400">
                <TrendingUp className="h-4 w-4 mr-1" />
                All time activities
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats?.activities.bookings || 0}</div>
              <div className="flex items-center mt-2 text-sm text-gray-400">
                <Package className="h-4 w-4 mr-1" />
                Successful bookings
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Inquiries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats?.inquiries.total || 0}</div>
              <div className="flex items-center mt-2 text-sm text-gray-400">
                <MessageSquare className="h-4 w-4 mr-1" />
                {stats?.inquiries.open || 0} open, {stats?.inquiries.responded || 0} responded
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Saved Warehouses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{stats?.savedWarehouses || 0}</div>
              <div className="flex items-center mt-2 text-sm text-gray-400">
                <Heart className="h-4 w-4 mr-1" />
                In your wishlist
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
            <TabsTrigger value="inquiries">My Inquiries</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6">
            {/* Activity Filter */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filter Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={activityFilter} onValueChange={(value: ActivityType) => setActivityFilter(value)}>
                  <SelectTrigger className="w-48 bg-gray-800/50 border-gray-700">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="booking">Bookings</SelectItem>
                    <SelectItem value="inquiry">Inquiries</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                    <SelectItem value="cancellation">Cancellations</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            {activities.length === 0 && bookings.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="text-center py-16">
                  <div className="mx-auto max-w-md">
                    <Activity className="h-20 w-20 mx-auto mb-6 text-gray-600" />
                    <h3 className="text-2xl font-semibold mb-3">No Activities Yet</h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                      Your activity timeline will appear here as you interact with warehouses. 
                      Start by browsing warehouses, saving favorites, or sending inquiries.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        onClick={() => navigate('/warehouses')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Browse Warehouses
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/ml-recommendations')}
                      >
                        Get ML Recommendations
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Show real bookings first */}
                {bookings.map((booking) => (
                  <Card key={`booking-${booking.id}`} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className="p-2 rounded-full text-green-400 bg-green-500/20">
                          <Package className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-semibold text-lg">
                                  {getBlockCount(booking) > 0 
                                    ? `Block booking for ${booking.warehouse_name} - ${getBlockCount(booking)} blocks (${booking.area_sqft?.toLocaleString() || 0} sq ft)`
                                    : `Booking for ${booking.warehouse_name}`
                                  }
                                </p>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    booking.status === 'active' || booking.status === 'confirmed' || booking.status === 'approved'
                                      ? 'border-green-500 text-green-400'
                                      : booking.status === 'pending'
                                      ? 'border-yellow-500 text-yellow-400'
                                      : booking.status === 'completed'
                                      ? 'border-blue-500 text-blue-400'
                                      : 'border-gray-500 text-gray-400'
                                  }`}
                                >
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center mt-2 text-sm text-gray-400">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatRelativeTime(booking.created_at)}
                                <span className="mx-2">•</span>
                                <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Booking Details */}
                          <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Start Date</span>
                                <span className="text-sm font-medium mt-1">{booking.start_date}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">End Date</span>
                                <span className="text-sm font-medium mt-1">{booking.end_date}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Amount</span>
                                <span className="text-sm font-medium mt-1 text-green-400">₹{booking.total_amount?.toLocaleString() || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status indicator */}
                          <div className="mt-3 flex items-center space-x-2">
                            <div className={`flex items-center text-sm ${
                              booking.status === 'active' || booking.status === 'confirmed' || booking.status === 'approved'
                                ? 'text-green-400'
                                : booking.status === 'pending'
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                            }`}>
                              {booking.status === 'pending' ? (
                                <>
                                  <Clock className="h-4 w-4 mr-1" />
                                  Awaiting Approval
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Booking Confirmed
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Show activity logs - filter out booking type activities to avoid duplicates */}
                {activities.filter(a => a.type !== 'booking').map((activity) => (
                  <Card key={`activity-${activity.id}`} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-semibold text-lg">{activity.description}</p>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    activity.type === 'booking' ? 'border-green-500 text-green-400' :
                                    activity.type === 'inquiry' ? 'border-blue-500 text-blue-400' :
                                    activity.type === 'payment' ? 'border-yellow-500 text-yellow-400' :
                                    activity.type === 'cancellation' ? 'border-red-500 text-red-400' :
                                    'border-gray-500 text-gray-400'
                                  }`}
                                >
                                  {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center mt-2 text-sm text-gray-400">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatRelativeTime(activity.created_at)}
                                <span className="mx-2">•</span>
                                <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Metadata Display */}
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(activity.metadata).slice(0, 4).map(([key, value]) => {
                                  const formatKey = (k: string) => {
                                    return k.replace(/_/g, ' ')
                                      .split(' ')
                                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                      .join(' ');
                                  };

                                  const formatValue = (v: any) => {
                                    if (typeof v === 'string' && v.includes('-') && v.length > 30) {
                                      return `${v.slice(0, 8)}...`;
                                    }
                                    if (Array.isArray(v)) {
                                      return v.join(', ');
                                    }
                                    return String(v);
                                  };

                                  return (
                                    <div key={key} className="flex flex-col">
                                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        {formatKey(key)}
                                      </span>
                                      <span className="text-sm font-medium mt-1">
                                        {formatValue(value)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Status indicator */}
                          <div className="mt-3 flex items-center space-x-2">
                            {activity.type === 'booking' && (
                              <div className="flex items-center text-sm text-green-400">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Booking Confirmed
                              </div>
                            )}
                            {activity.type === 'inquiry' && (
                              <div className="flex items-center text-sm text-blue-400">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Inquiry Sent
                              </div>
                            )}
                            {activity.type === 'payment' && (
                              <div className="flex items-center text-sm text-yellow-400">
                                <CreditCard className="h-4 w-4 mr-1" />
                                Payment Processed
                              </div>
                            )}
                            {activity.type === 'cancellation' && (
                              <div className="flex items-center text-sm text-red-400">
                                <XCircle className="h-4 w-4 mr-1" />
                                Booking Cancelled
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => fetchActivities(false)}
                      disabled={loadingMore}
                    >
                      {loadingMore && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Load More Activities
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-6">
            {/* Inquiries */}
            {inquiries.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="text-center py-16">
                  <div className="mx-auto max-w-md">
                    <MessageSquare className="h-20 w-20 mx-auto mb-6 text-gray-600" />
                    <h3 className="text-2xl font-semibold mb-3">No Inquiries Yet</h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                      When you send inquiries to warehouse owners, they'll appear here. 
                      You can track their status and view responses.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        onClick={() => navigate('/warehouses')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Find Warehouses
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/seeker-dashboard')}
                      >
                        Back to Dashboard
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <Card key={inquiry.id} className="glass-card hover:border-gray-600 transition-colors">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-semibold mb-2">
                            {inquiry.warehouses?.name || 'Warehouse Inquiry'}
                          </CardTitle>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 mr-1" />
                              {inquiry.warehouses?.city}, {inquiry.warehouses?.state}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(inquiry.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getInquiryStatusIcon(inquiry.status)}
                          <Badge 
                            variant="outline" 
                            className={`font-medium ${
                              inquiry.status === 'open' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10' :
                              inquiry.status === 'responded' ? 'border-green-500 text-green-400 bg-green-500/10' :
                              'border-gray-500 text-gray-400 bg-gray-500/10'
                            }`}
                          >
                            {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Your Message */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Your Inquiry Message</h4>
                          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-sm leading-relaxed">{inquiry.message}</p>
                          </div>
                        </div>
                        
                        <Separator className="bg-gray-700" />
                        
                        {/* Footer Info */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center space-x-4">
                            <span>Inquiry ID: {inquiry.id.slice(0, 8)}...</span>
                            <span>•</span>
                            <span>{formatRelativeTime(inquiry.created_at)}</span>
                          </div>
                          {inquiry.status === 'open' && (
                            <div className="flex items-center text-yellow-400">
                              <Clock className="h-3 w-3 mr-1" />
                              Awaiting Response
                            </div>
                          )}
                          {inquiry.status === 'responded' && (
                            <div className="flex items-center text-green-400">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Response Received
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
