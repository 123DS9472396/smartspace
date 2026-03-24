import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Package, DollarSign, Heart, Calendar, Clock, Search, TrendingUp, Download, Eye, Circle as XCircle, Star, Bell, History } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  activeBookings: number;
  completedBookings: number;
  totalSpent: number;
  savedWarehouses: number;
}

interface Booking {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  total_sqft: number;
  total_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
  booking_reference: string;
}

export default function SeekerDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    savedWarehouses: 0
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedWarehouses, setSavedWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !profile || profile.user_type !== 'seeker') {
        navigate('/login?redirect=/dashboard');
      } else {
        loadDashboardData();
      }
    }
  }, [user, profile, authLoading, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Check if this is a demo user
      const isDemoUser = user!.id.startsWith('demo-');
      
      if (isDemoUser) {
        // For demo users, fetch real bookings from API instead of using mock data
        console.log('Demo user detected - fetching real data from API');
        
        try {
          // Fetch bookings from API
          const bookingsResponse = await fetch(`/api/bookings?seeker_id=${user!.id}`);
          const bookingsData = await bookingsResponse.json();
          
          // Fetch saved warehouses count from API
          const savedResponse = await fetch(`/api/saved/${user!.id}`);
          const savedData = await savedResponse.json();
          
          if (bookingsData.success && bookingsData.bookings) {
            const mappedBookings = bookingsData.bookings.map((b: any) => ({
              id: b.id,
              warehouse_id: b.warehouse_id,
              warehouse_name: b.warehouse_name || 'N/A',
              total_sqft: b.area_sqft || b.total_sqft,
              total_amount: b.total_amount,
              start_date: b.start_date,
              end_date: b.end_date,
              status: b.status,
              payment_status: b.payment_status || 'pending',
              booking_reference: b.booking_reference
            }));
            
            setBookings(mappedBookings);
            
            const active = mappedBookings.filter((b: Booking) => 
              b.status === 'active' || b.status === 'confirmed' || b.status === 'approved' || b.status === 'pending'
            ).length;
            const completed = mappedBookings.filter((b: Booking) => b.status === 'completed').length;
            const spent = mappedBookings
              .filter((b: Booking) => b.payment_status === 'paid')
              .reduce((sum: number, b: Booking) => sum + parseFloat(String(b.total_amount) || '0'), 0);
            
            const savedCount = savedData.success ? (savedData.saved?.length || 0) : 0;
            
            setStats({
              activeBookings: active,
              completedBookings: completed,
              totalSpent: spent,
              savedWarehouses: savedCount
            });
          } else {
            // No bookings found, set zeros
            setStats({
              activeBookings: 0,
              completedBookings: 0,
              totalSpent: 0,
              savedWarehouses: savedData.success ? (savedData.saved?.length || 0) : 0
            });
            setBookings([]);
          }
          
          if (savedData.success && savedData.saved) {
            setSavedWarehouses(savedData.saved);
          } else {
            setSavedWarehouses([]);
          }
        } catch (error) {
          console.error('Error fetching demo user data:', error);
          // Fallback to zeros on error
          setStats({
            activeBookings: 0,
            completedBookings: 0,
            totalSpent: 0,
            savedWarehouses: 0
          });
          setBookings([]);
          setSavedWarehouses([]);
        }
        
        setLoading(false);
        return;
      }

      let seekerId = null;

      try {
        const { data: seekerProfile } = await supabase
          .from('seeker_profiles')
          .select('id')
          .eq('user_id', user!.id)
          .maybeSingle();

        if (!seekerProfile) {
          const { data: newProfile, error: createError } = await supabase
            .from('seeker_profiles')
            .insert({ user_id: user!.id })
            .select()
            .single();

          if (createError) {
            console.log('Seeker profile not available (demo mode)');
          } else {
            seekerId = newProfile?.id;
          }
        } else {
          seekerId = seekerProfile.id;
        }
      } catch (error) {
        console.log('Using demo mode without seeker profile');
      }

      if (seekerId) {
        const [bookingsResult, savedResult] = await Promise.all([
          supabase
            .from('bookings')
            .select(`
              *,
              warehouses (
                name,
                city
              )
            `)
            .eq('seeker_id', seekerId)
            .order('created_at', { ascending: false }),
          supabase
            .from('saved_warehouses')
            .select(`
              *,
              warehouses (
                id,
                wh_id,
                name,
                city,
                state,
                price_per_sqft,
                total_area,
                rating,
                images
              )
            `)
            .eq('seeker_id', seekerId)
        ]);

        if (bookingsResult.data) {
          const mappedBookings = bookingsResult.data.map((b: any) => ({
            id: b.id,
            warehouse_id: b.warehouse_id,
            warehouse_name: b.warehouses?.name || 'N/A',
            total_sqft: b.total_sqft,
            total_amount: b.total_amount,
            start_date: b.start_date,
            end_date: b.end_date,
            status: b.status,
            payment_status: b.payment_status,
            booking_reference: b.booking_reference
          }));

          setBookings(mappedBookings);

          const active = mappedBookings.filter((b: Booking) => b.status === 'active' || b.status === 'confirmed').length;
          const completed = mappedBookings.filter((b: Booking) => b.status === 'completed').length;
          const spent = mappedBookings
            .filter((b: Booking) => b.payment_status === 'paid')
            .reduce((sum: number, b: Booking) => sum + parseFloat(String(b.total_amount)), 0);

          setStats({
            activeBookings: active,
            completedBookings: completed,
            totalSpent: spent,
            savedWarehouses: savedResult.data?.length || 0
          });
        }

        if (savedResult.data) {
          setSavedWarehouses(savedResult.data);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      active: { variant: "default", className: "bg-green-600" },
      confirmed: { variant: "default", className: "bg-blue-600" },
      completed: { variant: "secondary", className: "bg-gray-600" },
      cancelled: { variant: "destructive" },
      pending: { variant: "outline" }
    };

    return variants[status] || variants.pending;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {profile?.name || 'Seeker'}! Manage your warehouse bookings and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Bookings
              </CardTitle>
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeBookings}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Completed
              </CardTitle>
              <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.completedBookings}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Past bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Spent
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{stats.totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Saved
              </CardTitle>
              <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.savedWarehouses}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Favorites
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500"
            onClick={() => navigate('/warehouses')}
          >
            <Search className="h-6 w-6 text-blue-600" />
            <span>Browse Warehouses</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500"
            onClick={() => navigate('/saved')}
          >
            <Heart className="h-6 w-6 text-red-600" />
            <span>Saved Warehouses</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-500"
            onClick={() => navigate('/activity')}
          >
            <History className="h-6 w-6 text-purple-600" />
            <span>Activity Timeline</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-500"
            onClick={() => navigate('/ml-recommendations')}
          >
            <TrendingUp className="h-6 w-6 text-green-600" />
            <span>ML Recommendations</span>
          </Button>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">
              <Package className="h-4 w-4 mr-2" />
              My Bookings
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Heart className="h-4 w-4 mr-2" />
              Saved Warehouses
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Search History
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <TrendingUp className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Bookings Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    Start exploring warehouses and make your first booking
                  </p>
                  <Button onClick={() => navigate('/warehouses')}>
                    Browse Warehouses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">
                          {booking.warehouse_name}
                        </CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <span className="font-mono text-sm">{booking.booking_reference}</span>
                        </CardDescription>
                      </div>
                      <Badge {...getStatusBadge(booking.status)}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Area</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {booking.total_sqft.toLocaleString()} sq ft
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ₹{booking.total_amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {new Date(booking.start_date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {new Date(booking.end_date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download Invoice
                      </Button>
                      {booking.status === 'active' && (
                        <Button size="sm" variant="outline">
                          <Clock className="mr-2 h-4 w-4" />
                          Extend Booking
                        </Button>
                      )}
                      {booking.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <Star className="mr-2 h-4 w-4" />
                          Write Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {savedWarehouses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Heart className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Saved Warehouses
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    Save warehouses you like to access them quickly later
                  </p>
                  <Button onClick={() => navigate('/warehouses')}>
                    Browse Warehouses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedWarehouses.map((saved: any) => (
                  <Card key={saved.id} className="overflow-hidden">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-800">
                      <img
                        src={saved.warehouses?.images?.[0] || "/placeholder.svg"}
                        alt={saved.warehouses?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        {saved.warehouses?.name}
                      </CardTitle>
                      <CardDescription>
                        {saved.warehouses?.city}, {saved.warehouses?.state}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ₹{saved.warehouses?.price_per_sqft}/sq ft
                        </span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {saved.warehouses?.rating?.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/warehouses/${saved.warehouses?.wh_id || saved.warehouses?.id}`)}
                        >
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Search History
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Your recent searches will appear here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Personalized Recommendations
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  Based on your search history and bookings
                </p>
                <Button onClick={() => navigate('/ml-recommendations')}>
                  View ML Recommendations
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
