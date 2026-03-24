import { useState, useEffect } from "react";
import { warehouseService } from "@/services/warehouseService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Building2, Users, Star, ArrowRight, CircleCheck as CheckCircle, TrendingUp, Shield, Clock, Bot } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import AuthGateModal from "@/components/AuthGateModal";

export default function Index() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [searchLocation, setSearchLocation] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingWarehouseId, setPendingWarehouseId] = useState<string | null>(null);
  const [featuredWarehouses, setFeaturedWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalWarehouses: 0,
    totalArea: 0,
    averagePrice: 0,
    averageOccupancy: 0,
    citiesCount: 0,
    averageRating: 0
  });

  useEffect(() => {
    const loadHomePageData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🏠 Loading homepage data from Supabase...');

        // Fetch stats
        const statsData = await warehouseService.getWarehouseStats();
        console.log('✅ Stats loaded:', statsData);
        setStats(statsData);

        // Fetch featured warehouses
        const { data: warehouses } = await warehouseService.getWarehouses({
          limit: 6,
          status: 'active'
        });
        console.log('✅ Featured warehouses loaded:', warehouses?.length || 0);
        setFeaturedWarehouses(warehouses || []);

      } catch (error: any) {
        console.error('❌ Error loading homepage data:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadHomePageData();
  }, []);

  const handleViewDetails = (warehouseId: number | string) => {
    if (!user || !profile || profile.user_type !== 'seeker') {
      setPendingWarehouseId(String(warehouseId));
      setShowAuthModal(true);
    } else {
      navigate(`/warehouses/${warehouseId}`);
    }
  };

  // Removed hardcoded warehouses - now fetched from Supabase
  const hardcodedExamples = [
    {
      id: 1,
      name: "Prime Industrial Hub",
      location: "Bhiwandi, Mumbai",
      totalArea: "50,000 sq ft",
      availableArea: "12,000 sq ft",
      pricePerSqFt: "₹85",
      rating: 4.8,
      reviews: 142,
      verified: true,
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80"
    },
    {
      id: 2,
      name: "Smart Logistics Center",
      location: "Hinjewadi, Pune",
      totalArea: "75,000 sq ft",
      availableArea: "25,000 sq ft",
      pricePerSqFt: "₹78",
      rating: 4.6,
      reviews: 89,
      verified: true,
      image: "https://images.unsplash.com/photo-1565630571891-1e24be14b2c8?w=800&q=80"
    },
    {
      id: 3,
      name: "Eco Storage Facility",
      location: "Nashik Road, Nashik",
      totalArea: "30,000 sq ft",
      availableArea: "18,000 sq ft",
      pricePerSqFt: "₹58",
      rating: 4.4,
      reviews: 67,
      verified: false,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80"
    }
  ];

  const displayStats = [
    { value: stats.totalWarehouses > 0 ? `${stats.totalWarehouses.toLocaleString()}+` : "Loading...", label: "Verified Warehouses", icon: Building2 },
    { value: stats.totalArea > 0 ? `${(stats.totalArea / 1000000).toFixed(1)}M+` : "Loading...", label: "Sq Ft Available", icon: TrendingUp },
    { value: stats.citiesCount > 0 ? `${stats.citiesCount}+` : "Loading...", label: "Cities Covered", icon: MapPin },
    { value: stats.averageRating > 0 ? `${stats.averageRating}/5` : "Loading...", label: "Customer Rating", icon: Star }
  ];

  const benefits = [
    {
      title: "AI-Powered Matching",
      description: "Find the perfect warehouse using advanced machine learning algorithms",
      icon: Bot
    },
    {
      title: "Real-time Availability",
      description: "Get instant updates on space availability and pricing",
      icon: TrendingUp
    },
    {
      title: "Verified Partners",
      description: "All warehouse providers are thoroughly vetted and verified",
      icon: Shield
    },
    {
      title: "Quick Onboarding",
      description: "Get started in minutes with our streamlined verification process",
      icon: Clock
    }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="text-center space-y-8 py-20 relative">
        {/* Animated background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 dark:bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x drop-shadow-2xl">
            Find Perfect Warehouses
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed drop-shadow-lg">
            Discover {stats.totalWarehouses > 0 ? `${stats.totalWarehouses.toLocaleString()}+` : 'verified'} warehouse spaces across Maharashtra with AI-powered recommendations
          </p>
        </div>

        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {/* Search Bar */}
              <div className="bg-white/95 dark:bg-gray-800/95 p-8 rounded-2xl shadow-2xl border dark:border-gray-700 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Enter city or location"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="pl-10 h-12 border-2 focus:border-blue-500 transition-all duration-300"
                    />
                  </div>
                  <Button size="lg" className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                    <Link to="/warehouses">
                      <Search className="mr-2 h-5 w-5" />
                      Search Warehouses
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-6">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Popular:</span>
                  {["Mumbai", "Pune", "Nashik", "Aurangabad", "Thane"].map((city) => (
                    <Button
                      key={city}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors duration-200"
                      onClick={() => setSearchLocation(city)}
                    >
                      {city}
                    </Button>
                  ))}
                  <div className="ml-auto flex items-center">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium mr-2 animate-pulse">✨ New</span>
                    <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900 shadow-md hover:shadow-lg transition-all duration-300" asChild>
                      <Link to="/ai-recommendations">
                        ML Recommendations
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {displayStats.map((stat, index) => (
                  <div key={index} className="text-center p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                    <stat.icon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80"
                  alt="Modern warehouse facility"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live Inventory Updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Warehouses */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Warehouse Spaces
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover premium warehouse spaces available for immediate occupancy
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading warehouses from database...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">\u26a0\ufe0f Database Error</h3>
              <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Please run the quick-test-import.sql script in Supabase SQL Editor to add test data.
              </p>
            </div>
          ) : featuredWarehouses.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-2">\ud83d\udce5 No Warehouses Found</h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                The database is empty. Please import warehouse data to continue.
              </p>
              <code className="block bg-gray-800 text-gray-100 p-3 rounded text-sm">
                Run: scripts/quick-test-import.sql in Supabase
              </code>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredWarehouses.map((warehouse) => (
                <Card key={warehouse.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <div className="relative">
                    <img
                      src={warehouse.images?.[0] || '/placeholder.svg'}
                      alt={warehouse.name}
                      className="w-full h-48 object-cover"
                    />
                    {warehouse.ownership_certificate === 'Verified' && (
                      <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{warehouse.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      {warehouse.city}, {warehouse.district}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Total Area:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{warehouse.total_area?.toLocaleString()} sq ft</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Capacity:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{warehouse.capacity?.toLocaleString()} MT</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Price:</span>
                        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">₹{warehouse.price_per_sqft}/sq ft</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">{warehouse.rating}</span>
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({warehouse.reviews_count} reviews)</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                        onClick={() => handleViewDetails(warehouse.wh_id || warehouse.id)}
                      >
                        View Details
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose SmartSpace?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience the future of warehouse management with our cutting-edge platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                  <benefit.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Customers Say
            </h2>
            <div className="flex items-center justify-center mb-8">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="ml-2 text-lg font-medium">4.8/5 from 10,000+ reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Ready to Find Your Perfect Warehouse?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses who trust SmartSpace for their storage needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg" asChild>
                <Link to="/warehouses">Browse Warehouses</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg" asChild>
                <Link to="/ai-recommendations">Try ML Recommendations</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SmartSpace</h3>
              <p className="text-gray-300 mb-4">
                Maharashtra's leading warehouse marketplace connecting businesses with premium storage solutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/warehouses" className="hover:text-white transition-colors">Browse Warehouses</Link></li>
                <li><Link to="/ai-recommendations" className="hover:text-white transition-colors">ML Recommendations</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="tel:+91-XXXX-XXXXXX" className="hover:text-white transition-colors">+91-XXXX-XXXXXX</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SmartSpace Warehouse. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <AuthGateModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingWarehouseId(null);
        }}
        message="Login as Storage Seeker to view warehouse details"
        redirectPath={pendingWarehouseId ? `/warehouses/${pendingWarehouseId}` : undefined}
      />
    </div>
  );
}
