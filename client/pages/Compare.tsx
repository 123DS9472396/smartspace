import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Building2, MapPin, Star, ArrowLeft, Plus, X, CircleCheck as CheckCircle, Circle as XCircle, Calendar, Phone, MessageSquare, Truck, Shield, Wifi, Thermometer, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

interface ComparisonWarehouse {
  id: number;
  name: string;
  location: string;
  city: string;
  totalArea: number;
  availableArea: number;
  pricePerSqFt: number;
  rating: number;
  reviews: number;
  type: string;
  image: string;
  amenities: string[];
  specifications: {
    floorType: string;
    ceilingHeight: string;
    loadingDocks: number;
    powerSupply: string;
    fireSafety: string;
    security: string;
  };
  pricing: {
    securityDeposit: number;
    minimumLease: string;
    utilityCharges: string;
  };
  connectivity: {
    highway: string;
    railway: string;
    port: string;
    airport: string;
  };
  features: {
    climateControl: boolean;
    security24x7: boolean;
    loadingDock: boolean;
    officeSpace: boolean;
    wifi: boolean;
    parking: boolean;
    fireSystem: boolean;
    cctv: boolean;
  };
}

export default function Compare() {
  const [selectedWarehouses, setSelectedWarehouses] = useState<ComparisonWarehouse[]>([]);
  const [maxComparisons] = useState(3);

  // Mock warehouse data
  const availableWarehouses: ComparisonWarehouse[] = [
    {
      id: 1,
      name: "Prime Industrial Hub",
      location: "Bhiwandi, Mumbai",
      city: "Mumbai",
      totalArea: 50000,
      availableArea: 12000,
      pricePerSqFt: 25,
      rating: 4.8,
      reviews: 24,
      type: "Industrial",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80",
      amenities: ["24/7 Security", "Loading Dock", "Climate Control", "Office Space", "WiFi", "CCTV"],
      specifications: {
        floorType: "RCC with Anti-Skid",
        ceilingHeight: "12 meters",
        loadingDocks: 6,
        powerSupply: "500 KVA",
        fireSafety: "Sprinkler System",
        security: "24/7 Guards + CCTV"
      },
      pricing: {
        securityDeposit: 75000,
        minimumLease: "6 months",
        utilityCharges: "Actual consumption"
      },
      connectivity: {
        highway: "NH-3 (2 km)",
        railway: "Bhiwandi Station (3 km)",
        port: "JNPT Port (45 km)",
        airport: "Mumbai Airport (35 km)"
      },
      features: {
        climateControl: true,
        security24x7: true,
        loadingDock: true,
        officeSpace: true,
        wifi: true,
        parking: true,
        fireSystem: true,
        cctv: true
      }
    },
    {
      id: 2,
      name: "Metro Logistics Center",
      location: "Gurgaon, Delhi NCR",
      city: "Gurgaon",
      totalArea: 75000,
      availableArea: 25000,
      pricePerSqFt: 30,
      rating: 4.9,
      reviews: 31,
      type: "Logistics",
      image: "https://images.unsplash.com/photo-1601980169411-4c0d37967c2e?w=400&q=80",
      amenities: ["Rail Access", "Cold Storage", "Office Space", "24/7 Security", "Parking"],
      specifications: {
        floorType: "Industrial Grade",
        ceilingHeight: "15 meters",
        loadingDocks: 8,
        powerSupply: "750 KVA",
        fireSafety: "FM200 System",
        security: "Biometric + RFID"
      },
      pricing: {
        securityDeposit: 90000,
        minimumLease: "12 months",
        utilityCharges: "Included in rent"
      },
      connectivity: {
        highway: "NH-8 (1 km)",
        railway: "Gurgaon Station (5 km)",
        port: "Delhi Port (120 km)",
        airport: "IGI Airport (25 km)"
      },
      features: {
        climateControl: true,
        security24x7: true,
        loadingDock: true,
        officeSpace: true,
        wifi: false,
        parking: true,
        fireSystem: true,
        cctv: true
      }
    },
    {
      id: 3,
      name: "Gateway Storage Solutions",
      location: "Pune, Maharashtra",
      city: "Pune",
      totalArea: 35000,
      availableArea: 8500,
      pricePerSqFt: 22,
      rating: 4.7,
      reviews: 18,
      type: "Storage",
      image: "https://images.unsplash.com/photo-1553864250-05b20249ee6c?w=400&q=80",
      amenities: ["High Ceiling", "Truck Access", "Flexible Terms", "Fire Safety"],
      specifications: {
        floorType: "Concrete Flooring",
        ceilingHeight: "10 meters",
        loadingDocks: 4,
        powerSupply: "300 KVA",
        fireSafety: "Foam System",
        security: "24/7 Patrol"
      },
      pricing: {
        securityDeposit: 50000,
        minimumLease: "3 months",
        utilityCharges: "Metered billing"
      },
      connectivity: {
        highway: "Mumbai-Pune Expressway (8 km)",
        railway: "Pune Station (15 km)",
        port: "JNPT Port (150 km)",
        airport: "Pune Airport (20 km)"
      },
      features: {
        climateControl: false,
        security24x7: true,
        loadingDock: true,
        officeSpace: false,
        wifi: false,
        parking: true,
        fireSystem: true,
        cctv: false
      }
    }
  ];

  const addWarehouse = (warehouse: ComparisonWarehouse) => {
    if (selectedWarehouses.length < maxComparisons && !selectedWarehouses.find(w => w.id === warehouse.id)) {
      setSelectedWarehouses([...selectedWarehouses, warehouse]);
    }
  };

  const removeWarehouse = (id: number) => {
    setSelectedWarehouses(selectedWarehouses.filter(w => w.id !== id));
  };

  const getFeatureIcon = (feature: keyof ComparisonWarehouse['features']) => {
    const icons = {
      climateControl: Thermometer,
      security24x7: Shield,
      loadingDock: Truck,
      officeSpace: Building2,
      wifi: Wifi,
      parking: Car,
      fireSystem: Zap,
      cctv: Eye
    };
    return icons[feature] || CheckCircle;
  };

  const Car = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M3 12h18m-9 9a3 3 0 100-6 3 3 0 000 6zm8-3a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  );

  const Eye = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">SmartSpace</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/warehouses" className="text-gray-600 hover:text-gray-900 font-medium">Find Warehouses</Link>
            <Link to="/list-property" className="text-gray-600 hover:text-gray-900 font-medium">List Your Property</Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900 font-medium">About</Link>
            <Link to="/contact" className="text-gray-600 hover:text-gray-900 font-medium">Contact</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link to="/warehouses" className="hover:text-blue-600">Warehouses</Link>
          <span>/</span>
          <span className="text-gray-900">Compare</span>
        </div>

        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Compare Warehouses</h1>
            <p className="text-gray-600">Compare up to {maxComparisons} warehouses side by side to make the best decision</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/warehouses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Link>
          </Button>
        </div>

        {/* Warehouse Selection */}
        {selectedWarehouses.length < maxComparisons && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add Warehouses to Compare</CardTitle>
              <CardDescription>
                You can compare up to {maxComparisons} warehouses. Currently selected: {selectedWarehouses.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableWarehouses
                  .filter(w => !selectedWarehouses.find(sw => sw.id === w.id))
                  .map((warehouse) => (
                    <div key={warehouse.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex space-x-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                          <img src={warehouse.image} alt={warehouse.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm mb-1">{warehouse.name}</h3>
                          <p className="text-xs text-gray-500 flex items-center mb-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            {warehouse.location}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-600">₹{warehouse.pricePerSqFt}/sq ft</span>
                            <Button size="sm" onClick={() => addWarehouse(warehouse)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Table */}
        {selectedWarehouses.length > 0 ? (
          <div className="space-y-6">
            {/* Basic Info Cards */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedWarehouses.length}, 1fr)` }}>
              {selectedWarehouses.map((warehouse) => (
                <Card key={warehouse.id} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWarehouse(warehouse.id)}
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <CardHeader className="pb-4">
                    <div className="aspect-video rounded-lg overflow-hidden mb-4">
                      <img src={warehouse.image} alt={warehouse.name} className="w-full h-full object-cover" />
                    </div>
                    <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {warehouse.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">₹{warehouse.pricePerSqFt}</div>
                      <div className="text-sm text-gray-500">per sq ft/month</div>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{warehouse.rating}</span>
                      <span className="text-gray-500">({warehouse.reviews})</span>
                    </div>
                    <Badge className="w-full justify-center">{warehouse.type}</Badge>
                    <div className="space-y-2 text-sm">
                      <Button className="w-full" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Contact Owner
                      </Button>
                      <Button variant="outline" className="w-full" size="sm" asChild>
                        <Link to={`/warehouses/${warehouse.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Basic Details */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
                    <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedWarehouses.length}, 1fr)` }}>
                      <div className="font-medium text-gray-600">Total Area</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-total`} className="text-center">{w.totalArea.toLocaleString()} sq ft</div>
                      ))}
                      
                      <div className="font-medium text-gray-600">Available Area</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-available`} className="text-center font-medium text-green-600">
                          {w.availableArea.toLocaleString()} sq ft
                        </div>
                      ))}
                      
                      <div className="font-medium text-gray-600">Security Deposit</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-deposit`} className="text-center">₹{w.pricing.securityDeposit.toLocaleString()}</div>
                      ))}
                      
                      <div className="font-medium text-gray-600">Minimum Lease</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-lease`} className="text-center">{w.pricing.minimumLease}</div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Specifications */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Technical Specifications</h3>
                    <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedWarehouses.length}, 1fr)` }}>
                      <div className="font-medium text-gray-600">Floor Type</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-floor`} className="text-center text-sm">{w.specifications.floorType}</div>
                      ))}
                      
                      <div className="font-medium text-gray-600">Ceiling Height</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-ceiling`} className="text-center">{w.specifications.ceilingHeight}</div>
                      ))}
                      
                      <div className="font-medium text-gray-600">Loading Docks</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-docks`} className="text-center">{w.specifications.loadingDocks}</div>
                      ))}
                      
                      <div className="font-medium text-gray-600">Power Supply</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-power`} className="text-center text-sm">{w.specifications.powerSupply}</div>
                      ))}
                      
                      <div className="font-medium text-gray-600">Fire Safety</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-fire`} className="text-center text-sm">{w.specifications.fireSafety}</div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Features */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Features & Amenities</h3>
                    <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedWarehouses.length}, 1fr)` }}>
                      {Object.keys(selectedWarehouses[0].features).map((feature) => (
                        <>
                          <div key={feature} className="font-medium text-gray-600 flex items-center">
                            {getFeatureIcon(feature as keyof ComparisonWarehouse['features'])({ className: "h-4 w-4 mr-2" })}
                            {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </div>
                          {selectedWarehouses.map((w) => (
                            <div key={`${w.id}-${feature}`} className="text-center">
                              {w.features[feature as keyof typeof w.features] ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                              )}
                            </div>
                          ))}
                        </>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Connectivity */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Transport Connectivity</h3>
                    <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedWarehouses.length}, 1fr)` }}>
                      <div className="font-medium text-gray-600">Highway Access</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-highway`} className="text-center text-sm">{w.connectivity.highway}</div>
                      ))}
                      
                      <div className="font-medium text-gray-600">Railway Station</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-railway`} className="text-center text-sm">{w.connectivity.railway}</div>
                      ))}
                      
                      <div className="font-medium text-gray-600">Port Access</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-port`} className="text-center text-sm">{w.connectivity.port}</div>
                      ))}
                      
                      <div className="font-medium text-gray-600">Airport</div>
                      {selectedWarehouses.map((w) => (
                        <div key={`${w.id}-airport`} className="text-center text-sm">{w.connectivity.airport}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button size="lg">
                <MessageSquare className="mr-2 h-5 w-5" />
                Request Quotes for All
              </Button>
              <Button variant="outline" size="lg">
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Visits
              </Button>
            </div>
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Warehouses Selected</h3>
              <p className="text-gray-600 mb-6">Add warehouses from the selection above to start comparing</p>
              <Button asChild>
                <Link to="/warehouses">Browse Warehouses</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
