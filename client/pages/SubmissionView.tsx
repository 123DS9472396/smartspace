import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface WarehouseSubmission {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_area: number;
  price_per_sqft: number;
  amenities: string[];
  features: string[];
  images: string[];
  documents: any;
  warehouse_type?: string;
  allowed_goods_types?: string[];
  status: "pending" | "approved" | "rejected";
  admin_notes?: string;
  rejection_reason?: string;
  submitted_at: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export default function SubmissionView() {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<WarehouseSubmission | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubmission();
  }, [id]);

  const loadSubmission = async () => {
    if (!id) {
      setError("No submission ID provided");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("warehouse_submissions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (!data) {
        setError("Submission not found");
        return;
      }

      setSubmission(data);
    } catch (err) {
      console.error("Error loading submission:", err);
      setError("Failed to load submission details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                Loading submission details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Submission Not Found
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {submission.name}
              </h1>
              <p className="text-gray-600 flex items-center mt-2">
                <MapPin className="h-4 w-4 mr-1" />
                {submission.address}, {submission.city}, {submission.state}{" "}
                {submission.pincode}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(submission.status)}
              <Badge variant={getStatusVariant(submission.status)}>
                {submission.status.charAt(0).toUpperCase() +
                  submission.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            {submission.images && submission.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {submission.images.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-video rounded-lg overflow-hidden bg-gray-200"
                      >
                        <img
                          src={image}
                          alt={`${submission.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {submission.description || "No description provided."}
                </p>
              </CardContent>
            </Card>

            {(submission.warehouse_type ||
              (submission.allowed_goods_types &&
                submission.allowed_goods_types.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle>Warehouse Type & Goods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {submission.warehouse_type && (
                    <div>
                      <p className="text-sm text-gray-500">Warehouse Type</p>
                      <p className="font-medium text-gray-900">
                        {submission.warehouse_type}
                      </p>
                    </div>
                  )}
                  {submission.allowed_goods_types &&
                    submission.allowed_goods_types.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">
                          Allowed Goods Types
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {submission.allowed_goods_types.map((g) => (
                            <Badge key={g} variant="outline">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Amenities & Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {submission.amenities && submission.amenities.length > 0 ? (
                      submission.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline">
                          {amenity}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No amenities listed
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {submission.features && submission.features.length > 0 ? (
                      submission.features.map((feature, index) => (
                        <Badge key={index} variant="outline">
                          {feature}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No features listed
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Feedback */}
            {submission.status === "rejected" &&
              submission.rejection_reason && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800 flex items-center">
                      <XCircle className="h-5 w-5 mr-2" />
                      Rejection Reason
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-700">
                      {submission.rejection_reason}
                    </p>
                  </CardContent>
                </Card>
              )}

            {submission.admin_notes && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800">Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-700">{submission.admin_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Total Area
                  </span>
                  <span className="font-semibold">
                    {submission.total_area.toLocaleString()} sq ft
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Price per sq ft
                  </span>
                  <span className="font-semibold">
                    ₹{submission.price_per_sqft}/sq ft
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Submitted
                  </span>
                  <span className="font-semibold">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </span>
                </div>
                {submission.reviewed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Reviewed
                    </span>
                    <span className="font-semibold">
                      {new Date(submission.reviewed_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(submission.status)}
                    <span className="font-semibold">
                      {submission.status.charAt(0).toUpperCase() +
                        submission.status.slice(1)}
                    </span>
                  </div>

                  {submission.status === "pending" && (
                    <p className="text-sm text-gray-600">
                      Your submission is under review. You'll be notified once
                      an admin reviews it.
                    </p>
                  )}

                  {submission.status === "approved" && (
                    <div className="space-y-2">
                      <p className="text-sm text-green-600">
                        Congratulations! Your warehouse has been approved and is
                        now visible to seekers.
                      </p>
                      <Button asChild className="w-full">
                        <Link to={`/warehouses/${submission.id}`}>
                          View Live Listing
                        </Link>
                      </Button>
                    </div>
                  )}

                  {submission.status === "rejected" && (
                    <div className="space-y-2">
                      <p className="text-sm text-red-600">
                        Your submission was rejected. Please review the feedback
                        and submit again.
                      </p>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/list-property">Submit New Property</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
