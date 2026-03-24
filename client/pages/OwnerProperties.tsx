import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import {
  warehouseService,
  type SupabaseWarehouse,
} from "@/services/warehouseService";
import {
  Building2,
  MapPin,
  Star,
  ArrowLeft,
  Loader2,
  DollarSign,
  Package,
} from "lucide-react";

export default function OwnerProperties() {
  const { ownerId } = useParams();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<SupabaseWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState<string>("Facility Manager");

  useEffect(() => {
    const fetchOwnerProperties = async () => {
      if (!ownerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } =
          await warehouseService.getWarehousesByOwner(ownerId);

        if (error) {
          console.error("Error fetching owner properties:", error);
        } else if (data) {
          setWarehouses(data);
          // Get owner name from first warehouse if available
          if (data.length > 0 && (data[0] as any).owner) {
            setOwnerName((data[0] as any).owner.name || "Facility Manager");
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerProperties();
  }, [ownerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Properties by {ownerName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {warehouses.length}{" "}
            {warehouses.length === 1 ? "property" : "properties"} managed by
            this owner
          </p>
        </div>

        {warehouses.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No properties found for this owner
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map((warehouse) => (
              <Card
                key={warehouse.id}
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/warehouses/${warehouse.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 dark:text-white mb-2">
                        {warehouse.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {warehouse.city}, {warehouse.state}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        warehouse.status === "active" ? "default" : "secondary"
                      }
                      className="ml-2"
                    >
                      {warehouse.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {warehouse.rating?.toFixed(1) || "4.0"}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({warehouse.reviews_count || 0} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Package className="h-4 w-4" />
                        <span>Total Area</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {warehouse.total_area?.toLocaleString()} sq ft
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <DollarSign className="h-4 w-4" />
                        <span>Price</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        ₹{warehouse.price_per_sqft}/sq ft
                      </p>
                    </div>
                  </div>

                  {warehouse.occupancy !== undefined && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          Occupancy
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {(warehouse.occupancy * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${warehouse.occupancy * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
