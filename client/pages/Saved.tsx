import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
  SavedWarehousesResponse,
  SavedWarehouse,
  SavedWarehouseRequest,
  SavedWarehouseResponse
} from '@shared/api';
import {
  Heart,
  MapPin,
  Star,
  Package,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Building2,
  TrendingUp,
  Calendar,
  X,
  ArrowUpDown,
  ArrowLeft,
  Loader2,
  Eye
} from 'lucide-react';

type SortOption = 'saved_date' | 'name' | 'price' | 'rating' | 'area';
type SortOrder = 'asc' | 'desc';

export default function Saved() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [savedWarehouses, setSavedWarehouses] = useState<SavedWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('saved_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Get seeker ID from auth context
  const currentSeekerId = user?.id || "demo-seeker";

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchSavedWarehouses();
  }, [user]);

  // Fetch saved warehouses
  const fetchSavedWarehouses = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (cityFilter && cityFilter !== 'all') params.append('city', cityFilter);
      if (priceFilter && priceFilter !== 'all') params.append('price_range', priceFilter);
      if (sortBy) params.append('sort_by', sortBy);
      if (sortOrder) params.append('sort_order', sortOrder);

      const response = await fetch(`/api/saved/${currentSeekerId}?${params}`);
      const data: SavedWarehousesResponse = await response.json();

      if (data.success) {
        setSavedWarehouses(data.warehouses);
        
        // Extract unique cities for filter
        const cities = [...new Set(
          data.warehouses
            .map(sw => sw.warehouse?.city)
            .filter(Boolean)
        )] as string[];
        setAvailableCities(cities);
      } else {
        // Set empty array on error
        setSavedWarehouses([]);
      }
    } catch (error) {
      console.error('Error fetching saved warehouses:', error);
      toast({
        title: "Info",
        description: "No saved warehouses found. Start browsing to save your favorites!",
      });
      setSavedWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  // Remove from saved
  const removeSavedWarehouse = async (warehouseId: string) => {
    try {
      const request: SavedWarehouseRequest = {
        seekerId: currentSeekerId,
        warehouseId
      };

      const response = await fetch('/api/saved/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: SavedWarehouseResponse = await response.json();
      
      if (data.success && !data.saved) {
        // Optimistically remove from list
        setSavedWarehouses(prev => prev.filter(sw => sw.warehouse_id !== warehouseId));
        toast({
          title: "Warehouse Removed",
          description: "Warehouse removed from your saved list.",
        });
      } else {
        throw new Error('Failed to remove warehouse');
      }
    } catch (error) {
      console.error('Error removing saved warehouse:', error);
      toast({
        title: "Error",
        description: "Failed to remove warehouse. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter warehouses based on search term
  const filteredWarehouses = savedWarehouses.filter(sw => {
    if (!searchTerm) return true;
    const warehouse = sw.warehouse;
    if (!warehouse) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      warehouse.name.toLowerCase().includes(searchLower) ||
      warehouse.address.toLowerCase().includes(searchLower) ||
      warehouse.city.toLowerCase().includes(searchLower) ||
      warehouse.state.toLowerCase().includes(searchLower)
    );
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setCityFilter('all');
    setPriceFilter('all');
    setSortBy('saved_date');
    setSortOrder('desc');
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  useEffect(() => {
    if (user) {
      fetchSavedWarehouses();
    }
  }, [cityFilter, priceFilter, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-400">Loading your saved warehouses...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Heart className="h-8 w-8 mr-3 text-red-500 fill-red-500" />
            Saved Warehouses
          </h1>
          <p className="text-gray-400">
            Manage your favorite warehouse locations
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters & Search
              </span>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search warehouses by name, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* City Filter */}
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700">
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {availableCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Filter */}
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700">
                  <SelectValue placeholder="Filter by price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-5">₹0 - ₹5/sq ft</SelectItem>
                  <SelectItem value="5-10">₹5 - ₹10/sq ft</SelectItem>
                  <SelectItem value="10-15">₹10 - ₹15/sq ft</SelectItem>
                  <SelectItem value="15+">₹15+/sq ft</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saved_date">Date Saved</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Button
                variant="outline"
                onClick={toggleSortOrder}
                className="justify-start"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4 mr-2" />
                ) : (
                  <SortDesc className="h-4 w-4 mr-2" />
                )}
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredWarehouses.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold mb-2">No Saved Warehouses</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || (cityFilter && cityFilter !== 'all') || (priceFilter && priceFilter !== 'all')
                  ? "No warehouses match your current filters."
                  : "Start exploring warehouses and save your favorites!"
                }
              </p>
              <div className="space-x-4">
                {(searchTerm || (cityFilter && cityFilter !== 'all') || (priceFilter && priceFilter !== 'all')) && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
                <Button onClick={() => navigate('/warehouses')}>
                  <Search className="h-4 w-4 mr-2" />
                  Browse Warehouses
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-400">
                {filteredWarehouses.length} warehouse{filteredWarehouses.length !== 1 ? 's' : ''} saved
              </p>
            </div>

            {/* Warehouse Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWarehouses.map((savedWarehouse) => {
                const warehouse = savedWarehouse.warehouse;
                if (!warehouse) return null;

                return (
                  <Card key={savedWarehouse.id} className="glass-card hover:border-gray-600 transition-colors overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-1">{warehouse.name}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {warehouse.city}, {warehouse.state}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSavedWarehouse(warehouse.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Price</span>
                          <div className="font-medium text-green-400">₹{warehouse.price_per_sqft}/sq ft</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Area</span>
                          <div className="font-medium">{warehouse.total_area_sqft?.toLocaleString() || 'N/A'} sq ft</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Rating</span>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="font-medium">{warehouse.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Availability</span>
                          <div className="font-medium text-blue-400">
                            {warehouse.occupancy_percentage 
                              ? `${(100 - warehouse.occupancy_percentage).toFixed(0)}% free`
                              : 'N/A'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Occupancy Progress */}
                      {warehouse.occupancy_percentage !== undefined && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Occupancy</span>
                            <span>{warehouse.occupancy_percentage?.toFixed(0) || 0}%</span>
                          </div>
                          <Progress value={warehouse.occupancy_percentage || 0} className="h-2" />
                        </div>
                      )}

                      <Separator className="bg-gray-700" />

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Saved {new Date(savedWarehouse.created_at).toLocaleDateString()}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {warehouse.type}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => navigate(`/warehouses/${warehouse.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
