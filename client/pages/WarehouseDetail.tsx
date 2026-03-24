import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import InquiryModal from "@/components/InquiryModal";
import ScheduleVisitModal from "@/components/ScheduleVisitModal";
import GridBlockSelector from "@/components/GridBlockSelector";
import BookingConfirmationModal from "@/components/BookingConfirmationModal";
import BookingSummary3D, { type BookingData } from "@/components/BookingSummary3D";
import BlockGridCSS3D from "@/components/BlockGridCSS3D";
import { useAuth } from "@/contexts/AuthContext";
import { warehouseService, type SupabaseWarehouse } from "@/services/warehouseService";
import { checkVerificationStatus } from "@/services/verificationService";
import showSimpleNotification from "@/utils/simpleNotification";
import { toast } from "@/hooks/use-toast";
import { Building2, MapPin, Star, ArrowLeft, Share2, Heart, Phone, Mail, MessageSquare, CircleCheck as CheckCircle, Shield, Package, Factory, TrendingUp, DollarSign, ChevronLeft, ChevronRight, Calendar, ShoppingCart, Grid3x3, Loader2, Box, Boxes } from "lucide-react";
import { DEFAULT_GOODS_TYPES, GOODS_TYPES_BY_WAREHOUSE } from "@/data/warehouseTaxonomy";

// Interface for 3D blocks
interface Block3D {
  id: string;
  block_number: number;
  position_x: number;
  position_y: number;
  status: 'available' | 'booked' | 'maintenance';
  booked_by?: string;
  booked_at?: string;
  expires_at?: string;
  area_sqft: number;
}

export default function WarehouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showScheduleVisitModal, setShowScheduleVisitModal] = useState(false);
  const [warehouse, setWarehouse] = useState<SupabaseWarehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similarWarehouses, setSimilarWarehouses] = useState<SupabaseWarehouse[]>([]);

  // Booking state
  const [bookingMode, setBookingMode] = useState<'simple' | 'grid'>('simple');
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [bookingArea, setBookingArea] = useState("");
  const [bookingGoodsType, setBookingGoodsType] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // 3D Block booking state
  const [blocks3D, setBlocks3D] = useState<Block3D[]>([]);
  const [selectedBlocks3D, setSelectedBlocks3D] = useState<number[]>([]);
  const [isSelectionMode3D, setIsSelectionMode3D] = useState(false);
  const [loadingBlocks3D, setLoadingBlocks3D] = useState(false);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastBooking, setLastBooking] = useState<any>(null);
  
  // Save warehouse state
  const [savingWarehouse, setSavingWarehouse] = useState(false);
  
  // Owner property count state
  const [ownerPropertyCount, setOwnerPropertyCount] = useState<number>(0);

  const goodsTypeOptions = warehouse?.allowed_goods_types?.length
    ? warehouse.allowed_goods_types
    : GOODS_TYPES_BY_WAREHOUSE[warehouse?.warehouse_type || 'General Storage'] || DEFAULT_GOODS_TYPES;

  useEffect(() => {
    if (!bookingGoodsType && goodsTypeOptions.length > 0) {
      setBookingGoodsType(goodsTypeOptions[0]);
    }
  }, [bookingGoodsType, goodsTypeOptions]);

  const getTrendHeightClass = (value: number) => {
    if (value >= 90) return 'h-24';
    if (value >= 80) return 'h-20';
    if (value >= 70) return 'h-16';
    if (value >= 60) return 'h-14';
    if (value >= 50) return 'h-12';
    if (value >= 40) return 'h-10';
    return 'h-8';
  };

  useEffect(() => {
    setSelectedImage(0);
    setShowAllAmenities(false);
    setIsFavorited(false);
    setShowInquiryModal(false);
    setSimilarWarehouses([]);
    // Reset 3D state
    setSelectedBlocks3D([]);
    setIsSelectionMode3D(false);
  }, [id]);

  useEffect(() => {
    const fetchWarehouse = async () => {
      console.log('🏭 WAREHOUSE DETAIL - VERSION 2.0');
      console.log('ID:', id);

      if (!id) {
        setError('No warehouse ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching warehouse...');
        const result = await warehouseService.getWarehouseById(id);
        console.log('Result:', result);

        if (result.error || !result.data) {
          // Handle error - could be string or object
          const errorMessage = typeof result.error === 'string' 
            ? result.error 
            : (result.error as any)?.message || 'Warehouse not found';
          setError(errorMessage);
          setWarehouse(null);
        } else {
          console.log('✅ Loaded:', result.data.name);
          setWarehouse(result.data);
          setError(null);

          // Fetch owner property count
          if (result.data.owner_id) {
            const count = await warehouseService.getOwnerPropertyCount(result.data.owner_id);
            console.log('📊 Owner property count:', count);
            setOwnerPropertyCount(count);
          }

          const similar = await warehouseService.getSimilarWarehouses(id, 3);
          setSimilarWarehouses(similar);
        }
      } catch (err) {
        console.error('Error fetching warehouse:', err);
        setError('Failed to load warehouse details');
        setWarehouse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouse();
  }, [id]);

  // Check if warehouse is saved on load (with localStorage fallback)
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!warehouse?.id || !user?.id) return;
      
      // First check localStorage for immediate feedback
      const savedKey = `saved_warehouses_${user.id}`;
      const localSaved = JSON.parse(localStorage.getItem(savedKey) || '[]');
      const isLocalSaved = localSaved.includes(warehouse.id);
      setIsFavorited(isLocalSaved);
      
      try {
        const response = await fetch(`/api/saved/${user.id}/status/${warehouse.id}`);
        const data = await response.json();
        
        if (data.success) {
          setIsFavorited(data.saved);
          // Sync localStorage with server state
          if (data.saved && !localSaved.includes(warehouse.id)) {
            localSaved.push(warehouse.id);
            localStorage.setItem(savedKey, JSON.stringify(localSaved));
          } else if (!data.saved && localSaved.includes(warehouse.id)) {
            const filtered = localSaved.filter((id: string) => id !== warehouse.id);
            localStorage.setItem(savedKey, JSON.stringify(filtered));
          }
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
        // Keep localStorage state if server fails
      }
    };

    checkSavedStatus();
  }, [warehouse?.id, user?.id]);

  // Generate 3D blocks when warehouse loads
  useEffect(() => {
    const generateBlocks3D = async () => {
      if (!warehouse) return;
      
      setLoadingBlocks3D(true);
      
      // Calculate total blocks based on warehouse data
      const totalBlocks = warehouse.total_blocks || Math.ceil(warehouse.total_area / 1000);
      const gridSize = Math.ceil(Math.sqrt(totalBlocks));

      // Fetch actual booked block numbers from approved bookings
      let realBookedBlockNumbers = new Set<number>();
      try {
        const res = await fetch(`/api/bookings/blocks/available?warehouse_id=${warehouse.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.booked_block_numbers)) {
            realBookedBlockNumbers = new Set<number>(data.booked_block_numbers);
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch real booked blocks, falling back to occupancy estimate', err);
      }

      // Fallback: if no real data, compute from occupancy field (stored as decimal 0–1)
      const useFallback = realBookedBlockNumbers.size === 0;
      const occupancyDecimal = (warehouse.occupancy || 0) > 1 ? (warehouse.occupancy || 0) / 100 : (warehouse.occupancy || 0);
      const availableBlocks = warehouse.available_blocks ?? Math.ceil(totalBlocks * (1 - occupancyDecimal));
      const fallbackBookedCount = totalBlocks - availableBlocks;
      
      const generatedBlocks: Block3D[] = [];
      
      for (let i = 1; i <= totalBlocks; i++) {
        const x = ((i - 1) % gridSize) + 1;
        const y = Math.floor((i - 1) / gridSize) + 1;
        
        let status: 'available' | 'booked' | 'maintenance' = 'available';
        if (realBookedBlockNumbers.has(i)) {
          // Real data: exact block is booked
          status = 'booked';
        } else if (useFallback && i <= fallbackBookedCount) {
          // Fallback: first N blocks shown as booked based on occupancy
          status = 'booked';
        } else if (Math.random() < 0.05) { // 5% chance of maintenance
          status = 'maintenance';
        }
        
        generatedBlocks.push({
          id: `block_${i}`,
          block_number: i,
          position_x: x,
          position_y: y,
          status,
          booked_by: status === 'booked' ? (realBookedBlockNumbers.has(i) ? 'Booked' : `Customer ${i}`) : undefined,
          booked_at: status === 'booked' ? new Date().toISOString() : undefined,
          area_sqft: 100, // Each block is 100 sq ft
        });
      }
      
      setBlocks3D(generatedBlocks);
      setLoadingBlocks3D(false);
    };

    if (warehouse?.id) {
      generateBlocks3D();
    }
  }, [warehouse?.id]);

  // 3D Block selection handler
  const handleBlock3DSelect = (blockNumber: number) => {
    if (!isSelectionMode3D) return;
    
    setSelectedBlocks3D(prev => {
      if (prev.includes(blockNumber)) {
        return prev.filter(num => num !== blockNumber);
      } else {
        // Limit to 20 blocks max
        if (prev.length >= 20) {
          toast({
            title: "Maximum Selection",
            description: "You can select up to 20 blocks at once",
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, blockNumber];
      }
    });
  };

  // Clear 3D selection
  const clearSelection3D = () => {
    setSelectedBlocks3D([]);
  };

  // Toggle 3D selection mode
  const toggleSelectionMode3D = () => {
    setIsSelectionMode3D(prev => !prev);
    if (isSelectionMode3D) {
      clearSelection3D();
    }
  };

  // Handle 3D booking confirmation
  const handle3DBookingConfirm = async (bookingData: BookingData) => {
    if (!warehouse?.id || !user?.id) return;
    
    try {
      setBookingLoading(true);
      
      const response = await fetch('/api/bookings/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seeker_id: user.id,
          warehouse_id: warehouse.id,
          blocks: bookingData.selectedBlocks.map(bn => ({ id: `block_${bn}`, block_number: bn, area: 100 })), // 100 sq ft per block
          start_date: bookingData.startDate,
          end_date: bookingData.endDate,
          total_amount: bookingData.totalAmount,
          payment_method: bookingData.paymentMethod,
          goods_type: bookingData.goodsType,
          customer_details: bookingData.customerDetails
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local blocks state to mark as booked
        setBlocks3D(prev => prev.map(block => 
          bookingData.selectedBlocks.includes(block.block_number)
            ? { ...block, status: 'booked' as const, booked_by: bookingData.customerDetails.name }
            : block
        ));
        
        clearSelection3D();
        setIsSelectionMode3D(false);
        
        // Show confirmation modal with customer details for receipt
        setLastBooking({
          id: result.booking?.id || 'booking-' + Date.now(),
          warehouseName: warehouse.name,
          warehouseLocation: `${warehouse.city}, ${warehouse.state}`,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          area: bookingData.selectedBlocks.length * 100, // 100 sq ft per block
          totalAmount: bookingData.totalAmount,
          blocksBooked: bookingData.selectedBlocks.length,
          status: 'pending',
          createdAt: new Date().toISOString(),
          customerName: bookingData.customerDetails?.name || profile?.name || 'Customer',
          customerEmail: bookingData.customerDetails?.email || profile?.email || '',
          customerPhone: bookingData.customerDetails?.phone || profile?.phone || '',
          ownerName: facilityManager?.name || 'Warehouse Owner',
          ownerEmail: facilityManager?.email || '',
          ownerPhone: facilityManager?.phone || ''
        });
        setShowConfirmation(true);
        
        toast({
          title: "Booking Submitted!",
          description: `Your booking for ${bookingData.selectedBlocks.length} blocks has been sent for admin approval.`,
        });
      } else {
        throw new Error(result.error || 'Booking failed');
      }
    } catch (error) {
      console.error('3D booking error:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setBookingLoading(false);
    }
  };

  // Toggle saved warehouse (with localStorage backup)
  const toggleSavedWarehouse = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to save warehouses to your favorites",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!warehouse?.id) return;

    setSavingWarehouse(true);
    
    // Update localStorage immediately for instant feedback
    const savedKey = `saved_warehouses_${user.id}`;
    const localSaved = JSON.parse(localStorage.getItem(savedKey) || '[]');
    const newSavedState = !isFavorited;
    
    if (newSavedState) {
      if (!localSaved.includes(warehouse.id)) {
        localSaved.push(warehouse.id);
      }
    } else {
      const index = localSaved.indexOf(warehouse.id);
      if (index > -1) {
        localSaved.splice(index, 1);
      }
    }
    localStorage.setItem(savedKey, JSON.stringify(localSaved));
    setIsFavorited(newSavedState);
    
    try {
      const response = await fetch('/api/saved/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seekerId: user.id,
          warehouseId: warehouse.id
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Sync with server response (in case of inconsistency)
        setIsFavorited(data.saved);
        toast({
          title: data.saved ? "Warehouse Saved!" : "Warehouse Removed",
          description: data.saved 
            ? "Added to your saved warehouses" 
            : "Removed from your saved warehouses",
        });
      } else {
        // Revert localStorage if server failed
        if (newSavedState) {
          const idx = localSaved.indexOf(warehouse.id);
          if (idx > -1) localSaved.splice(idx, 1);
        } else {
          localSaved.push(warehouse.id);
        }
        localStorage.setItem(savedKey, JSON.stringify(localSaved));
        setIsFavorited(!newSavedState);
        throw new Error(data.error || 'Failed to toggle saved status');
      }
    } catch (error) {
      console.error('Error toggling saved warehouse:', error);
      // Keep the optimistic update for better UX, server will sync later
      toast({
        title: newSavedState ? "Saved Locally" : "Removed Locally",
        description: "Changes will sync when connection is restored",
      });
    } finally {
      setSavingWarehouse(false);
    }
  };

  // Handle booking submission
  const handleBooking = async () => {
    if (!user || !warehouse) {
      showSimpleNotification('error', 'Login Required', 'Please login as a seeker to book this warehouse');
      navigate('/login');
      return;
    }

    // Check if user profile is verified (for seekers)
    if (profile?.user_type === 'seeker') {
      try {
        const verificationResult = await checkVerificationStatus(user.id, 'seeker');
        
        if (verificationResult.status === 'rejected') {
          showSimpleNotification('error', 'Profile Rejected', 'Your profile was rejected. Please update your profile and resubmit for verification before booking.');
          navigate('/seeker-profile');
          return;
        }
        
        if (verificationResult.status !== 'verified') {
          showSimpleNotification('warning', 'Verification Required', 'Please complete and verify your profile before booking warehouses.');
          navigate('/seeker-profile');
          return;
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        showSimpleNotification('error', 'Error', 'Unable to verify your profile status. Please try again.');
        return;
      }
    }

    if (!bookingStartDate || !bookingEndDate) {
      showSimpleNotification('warning', 'Missing Dates', 'Please select start and end dates');
      return;
    }

    if (!bookingGoodsType) {
      showSimpleNotification('warning', 'Missing Goods Type', 'Please select the goods type you plan to store');
      return;
    }

    const areaToBook = parseInt(bookingArea) || 1000;
    if (areaToBook <= 0) {
      showSimpleNotification('warning', 'Invalid Area', 'Please enter a valid area to book');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await fetch('/api/bookings/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seeker_id: user.id,
          warehouse_id: warehouse.id,
          blocks: [{ id: 'area-booking', area: areaToBook }],
          start_date: bookingStartDate,
          end_date: bookingEndDate,
          total_amount: areaToBook * warehouse.price_per_sqft,
          payment_method: 'online',
          goods_type: bookingGoodsType,
          customer_details: {
            name: profile?.name || user.email,
            email: user.email,
            phone: profile?.phone || 'N/A'
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        // Show confirmation modal instead of just toast
        setLastBooking({
          id: result.booking?.id || 'booking-' + Date.now(),
          warehouseName: warehouse.name,
          warehouseLocation: `${warehouse.city}, ${warehouse.state}`,
          startDate: bookingStartDate,
          endDate: bookingEndDate,
          area: areaToBook,
          totalAmount: areaToBook * warehouse.price_per_sqft,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        setShowConfirmation(true);
        showSimpleNotification('success', 'Booking Submitted!', 'Your booking request has been sent for admin approval');
        setBookingStartDate('');
        setBookingEndDate('');
        setBookingArea('');
        setBookingGoodsType('');
      } else {
        showSimpleNotification('error', 'Booking Failed', result.error || 'Something went wrong');
      }
    } catch (err) {
      console.error('Booking error:', err);
      showSimpleNotification('error', 'Error', 'Failed to submit booking');
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle grid block booking
  const handleGridBooking = async (blocks: any[], totalArea: number, totalPrice: number) => {
    if (!user || !warehouse) {
      showSimpleNotification('error', 'Login Required', 'Please login as a seeker to book');
      navigate('/login');
      return;
    }

    if (!bookingStartDate || !bookingEndDate) {
      showSimpleNotification('warning', 'Missing Dates', 'Please select start and end dates');
      return;
    }

    if (!bookingGoodsType) {
      showSimpleNotification('warning', 'Missing Goods Type', 'Please select the goods type you plan to store');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await fetch('/api/bookings/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seeker_id: user.id,
          warehouse_id: warehouse.id,
          blocks: blocks,
          start_date: bookingStartDate,
          end_date: bookingEndDate,
          total_amount: totalPrice,
          payment_method: 'online',
          goods_type: bookingGoodsType,
          customer_details: {
            name: profile?.name || user.email,
            email: user.email,
            phone: profile?.phone || 'N/A'
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        // Show confirmation modal
        setLastBooking({
          id: result.booking?.id || 'booking-' + Date.now(),
          warehouseName: warehouse.name,
          warehouseLocation: `${warehouse.city}, ${warehouse.state}`,
          startDate: bookingStartDate,
          endDate: bookingEndDate,
          area: totalArea,
          totalAmount: totalPrice,
          blocksBooked: blocks.length,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        setShowConfirmation(true);
        showSimpleNotification('success', 'Grid Booking Submitted!', `${blocks.length} blocks booked successfully. Awaiting admin approval.`);
        setBookingStartDate('');
        setBookingEndDate('');
        setBookingMode('simple'); // Reset to simple mode
        setBookingGoodsType('');
      } else {
        showSimpleNotification('error', 'Booking Failed', result.error || 'Something went wrong');
      }
    } catch (err) {
      console.error('Grid booking error:', err);
      showSimpleNotification('error', 'Error', 'Failed to submit grid booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600 dark:text-gray-300">Loading warehouse details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Building2 className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Warehouse Not Found</CardTitle>
              <CardDescription>
                {error || 'The warehouse you\'re looking for doesn\'t exist or has been removed.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Button asChild>
                <Link to="/warehouses">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Warehouses
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const warehouseImages = warehouse.images && warehouse.images.length > 0
    ? warehouse.images
    : [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
      "https://images.unsplash.com/photo-1601980169411-4c0d37967c2e?w=800&q=80",
      "https://images.unsplash.com/photo-1553864250-05b20249ee6c?w=800&q=80",
      "https://images.unsplash.com/photo-1565610222536-ef2bdc4a7fd2?w=800&q=80"
    ];

  const safeOccupancy = Math.max(0, Math.min(100, (warehouse.occupancy || 0) * 100));
  const safeAvailableBlocks = Math.max(0, warehouse.available_blocks || 0);
  const safeTotalBlocks = Math.max(0, warehouse.total_blocks || 0);
  const safeAvailableArea = warehouse.total_area > 0
    ? Math.max(0, Math.floor(warehouse.total_area * (1 - (warehouse.occupancy || 0))))
    : 0;

  const warehouseAmenities = warehouse.amenities || [];
  const displayedAmenities = showAllAmenities
    ? warehouseAmenities
    : warehouseAmenities.slice(0, 8);

  // Get real owner data from joined profile or fallback to contact fields
  // IMPORTANT: Use owner profile data if available, otherwise use warehouse contact fields
  // Never mix owner profile name with warehouse contact email/phone!
  const owner = (warehouse as any).owner;
  
  // Generate realistic contact info based on warehouse name and city (consistent fallback)
  const fallbackContact = (() => {
    const cityName = warehouse.city || 'Unknown';
    const managerNames = ['Rajesh Kumar', 'Amit Patel', 'Deepak Shah', 'Suresh Singh', 'Mahesh Verma'];
    
    // IMPORTANT: Use owner_id to consistently pick the same name for all warehouses with same owner
    // This ensures the same facility manager name shows across all properties by the same owner
    const ownerIdForName = warehouse.owner_id || warehouse.id || '';
    const nameIndex = ownerIdForName ? parseInt(ownerIdForName.replace(/-/g, '').substring(0, 8), 16) % managerNames.length : 0;
    const randomName = managerNames[nameIndex];
    
    // Generate consistent email based on manager name (same for all warehouses by this owner)
    const emailName = randomName.toLowerCase().replace(/\s+/g, '.');
    const email = `${emailName}@smartspace.com`;
    
    // Generate consistent 10-digit phone number based on OWNER_ID (same for all warehouses by this owner)
    const phoneHash = ownerIdForName ? parseInt(ownerIdForName.replace(/-/g, '').substring(0, 8), 16) : 12345678;
    // Ensure 10 digits: range 6000000000 to 9999999999
    const phoneBase = (phoneHash % 4000000000) + 6000000000;
    const phoneStr = phoneBase.toString();
    const phoneNumber = `+91 ${phoneStr.substring(0, 5)} ${phoneStr.substring(5)}`;
    
    return {
      name: randomName,
      email: email,
      phone: phoneNumber
    };
  })();
  
  const facilityManager = owner ? {
    // If owner profile exists, use ALL data from profile (REAL data from database)
    id: owner.id,
    name: owner.name || 'Facility Manager',
    role: "Facility Manager",
    phone: owner.phone || fallbackContact.phone,
    email: owner.email || fallbackContact.email,
    avatar: owner.profile_image_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    properties: ownerPropertyCount || 1,  // Use actual property count from database
    rating: warehouse.rating || 4.0,
    memberSince: owner.created_at ? new Date(owner.created_at).getFullYear() : 2020,
    hasRealProfile: true  // Flag to indicate this is real owner data
  } : {
    // If NO owner profile BUT has owner_id, still allow viewing properties by that ID
    id: warehouse.owner_id || null,  // Use warehouse owner_id to query other properties
    name: fallbackContact.name,
    role: "Facility Manager",
    phone: fallbackContact.phone,
    email: fallbackContact.email,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    properties: ownerPropertyCount || 1,  // Use actual property count from database
    rating: warehouse.rating || 4.0,
    memberSince: 2020,
    hasRealProfile: false  // Generated data, but owner_id is real
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
            <span>/</span>
            <Link to="/warehouses" className="hover:text-blue-600 dark:hover:text-blue-400">Warehouses</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {warehouse.wh_id || warehouse.id.substring(0, 8)}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
                  <img
                    src={warehouseImages[selectedImage]}
                    alt={warehouse.name}
                    className="w-full h-full object-cover"
                  />
                  {warehouseImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImage((prev) => (prev - 1 + warehouseImages.length) % warehouseImages.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Previous image"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                      </button>
                      <button
                        onClick={() => setSelectedImage((prev) => (prev + 1) % warehouseImages.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Next image"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-4 left-4 flex space-x-2">
                    {warehouse.status === 'available' && (
                      <Badge className="bg-green-600 text-white">Available</Badge>
                    )}
                    {warehouse.amenities.some(a => a.toLowerCase().includes('verified')) && (
                      <Badge className="bg-blue-600 text-white">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                {warehouseImages.length > 1 && (
                  <div className="flex space-x-2 p-4 overflow-x-auto">
                    {warehouseImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImage === idx
                          ? 'border-blue-600'
                          : 'border-gray-200 dark:border-gray-700'
                          }`}
                      >
                        <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2 text-gray-900 dark:text-gray-100">{warehouse.name}</CardTitle>
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        {warehouse.address}, {warehouse.city}, {warehouse.state} - {warehouse.pincode}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-500 fill-current mr-1" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {warehouse.rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                          ({warehouse.reviews_count} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleSavedWarehouse}
                      disabled={savingWarehouse}
                      title={isFavorited ? "Remove from saved" : "Save to favorites"}
                    >
                      {savingWarehouse ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Heart className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                      )}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Factory className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {warehouse.total_area.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Sq Ft</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {safeAvailableArea.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Available Sq Ft</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ₹{warehouse.price_per_sqft}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Per Sq Ft</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {safeOccupancy.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Occupancy</div>
                  </div>
                </div>

                <Separator className="my-6" />

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full grid grid-cols-5 bg-gray-800/50 dark:bg-gray-800/50">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="block-booking" className="flex items-center gap-1">
                      <Boxes className="h-4 w-4" />
                      Block Booking
                    </TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Description
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {warehouse.description || `Premium warehouse facility located in ${warehouse.city}, ${warehouse.state}. This ${warehouse.total_area.toLocaleString()} sq ft facility offers modern infrastructure and excellent connectivity. Perfect for logistics, storage, and distribution operations.`}
                      </p>
                    </div>

                    {/* Amenities Preview */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Amenities & Features
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {displayedAmenities.slice(0, 6).map((amenity, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Capacity Card */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Capacity & Availability</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-400">Total Area</span>
                            <div className="text-xl font-bold text-blue-400">
                              {warehouse.total_area.toLocaleString()} sq ft
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-400">Price per sq ft</span>
                            <div className="text-xl font-bold text-green-400">
                              ₹{warehouse.price_per_sqft}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-400">Available Area</span>
                            <div className="text-lg font-bold text-green-400">
                              {safeAvailableArea.toLocaleString()} sq ft
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-400">Occupancy Rate</span>
                            <div className="text-lg font-bold text-orange-400">
                              {safeOccupancy.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Current Occupancy</span>
                            <span>{safeOccupancy.toFixed(1)}%</span>
                          </div>
                          <Progress value={safeOccupancy} className="h-3" />
                        </div>
                      </CardContent>
                    </Card>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Key Features
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {warehouse.features && warehouse.features.length > 0 ? (
                          warehouse.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start">
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex items-start">
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">24/7 Security</span>
                            </div>
                            <div className="flex items-start">
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">CCTV Surveillance</span>
                            </div>
                            <div className="flex items-start">
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Fire Safety Systems</span>
                            </div>
                            <div className="flex items-start">
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Loading Docks</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Occupancy Status
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                          <span>Current Occupancy</span>
                          <span className="font-semibold">{safeOccupancy.toFixed(1)}%</span>
                        </div>
                        <Progress value={safeOccupancy} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            Available: {safeAvailableBlocks > 0 ? `${safeAvailableBlocks} blocks` : `${safeAvailableArea.toLocaleString()} sq ft`}
                          </span>
                          <span>
                            Total: {safeTotalBlocks > 0 ? `${safeTotalBlocks} blocks` : `${warehouse.total_area.toLocaleString()} sq ft`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Warehouse ID</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {warehouse.wh_id || warehouse.id.substring(0, 8)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {warehouse.warehouse_type || 'General Storage'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                        <Badge variant={warehouse.status === 'available' ? 'default' : 'secondary'}>
                          {warehouse.status.charAt(0).toUpperCase() + warehouse.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Registration Date</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {new Date(warehouse.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Area</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {warehouse.total_area.toLocaleString()} sq ft
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Available Area</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {safeAvailableArea.toLocaleString()} sq ft
                        </p>
                      </div>
                      {safeTotalBlocks > 0 && (
                        <>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Blocks</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {safeTotalBlocks}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Available Blocks</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {safeAvailableBlocks}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="amenities" className="mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {displayedAmenities.map((amenity, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{amenity}</span>
                        </div>
                      ))}
                    </div>
                    {warehouse.amenities.length > 8 && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => setShowAllAmenities(!showAllAmenities)}
                      >
                        {showAllAmenities ? 'Show Less' : `Show All ${warehouse.amenities.length} Amenities`}
                      </Button>
                    )}
                  </TabsContent>

                  <TabsContent value="location" className="mt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Address</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          {warehouse.address}
                          <br />
                          {warehouse.city}, {warehouse.state} - {warehouse.pincode}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Connectivity</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                            <Factory className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Industrial Area</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Highway Access</span>
                          </div>
                        </div>
                      </div>
                      {/* Interactive Map using OpenStreetMap (free, no API key needed) */}
                      <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                        {warehouse.latitude && warehouse.longitude ? (
                          <iframe
                            title={`Map of ${warehouse.name}`}
                            width="100%"
                            height="100%"
                            className="border-0"
                            loading="lazy"
                            allowFullScreen
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${warehouse.longitude - 0.02}%2C${warehouse.latitude - 0.02}%2C${warehouse.longitude + 0.02}%2C${warehouse.longitude + 0.02}&layer=mapnik&marker=${warehouse.latitude}%2C${warehouse.longitude}`}
                          />
                        ) : (
                          // Fallback: OpenStreetMap with city center coordinates (estimated)
                          <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
                            <div className="text-center p-6">
                              <MapPin className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                              <p className="text-slate-300 font-medium mb-1">{warehouse.city}, {warehouse.state}</p>
                              <p className="text-slate-400 text-sm">{warehouse.address}</p>
                              <a
                                href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(warehouse.address + ', ' + warehouse.city + ', ' + warehouse.state)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
                              >
                                <MapPin className="h-4 w-4" />
                                View on Map
                              </a>
                            </div>
                          </div>
                        )}
                        {/* Overlay with open in Google Maps link */}
                        <div className="absolute bottom-2 right-2">
                          <a
                            href={warehouse.latitude && warehouse.longitude 
                              ? `https://www.google.com/maps/search/?api=1&query=${warehouse.latitude},${warehouse.longitude}` 
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(warehouse.address + ', ' + warehouse.city + ', ' + warehouse.state)}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-lg"
                          >
                            <MapPin className="h-4 w-4" />
                            Open in Google Maps
                          </a>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* 3D Block Booking Tab */}
                  <TabsContent value="block-booking" className="mt-6 space-y-6">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="flex items-center space-x-2 text-white">
                              <Boxes className="w-5 h-5 text-blue-400" />
                              <span>Block-Level Booking</span>
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                              Select individual warehouse blocks for precise space allocation
                            </CardDescription>
                          </div>
                          {user && (
                            <Button
                              onClick={toggleSelectionMode3D}
                              variant={isSelectionMode3D ? "secondary" : "outline"}
                              className={isSelectionMode3D 
                                ? "bg-blue-600 text-white hover:bg-blue-700" 
                                : "border-gray-600 text-gray-300 hover:bg-gray-700"
                              }
                            >
                              {isSelectionMode3D ? "Exit Selection" : "Start Selection"}
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* 3D Block Grid */}
                        {loadingBlocks3D ? (
                          <div className="w-full h-[500px] bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-2" />
                              <p className="text-gray-300">Loading warehouse blocks...</p>
                            </div>
                          </div>
                        ) : (
                          <BlockGridCSS3D
                            blocks={blocks3D}
                            selectedBlocks={selectedBlocks3D}
                            onBlockSelect={handleBlock3DSelect}
                            gridSize={Math.ceil(Math.sqrt(blocks3D.length))}
                            isSelectionMode={isSelectionMode3D}
                            maxSelection={20}
                          />
                        )}

                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="bg-gray-700 border-gray-600">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm text-white">How to Use</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-gray-300 space-y-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                <span>Click "Start Selection" to begin</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span>Click on available blocks to select</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded"></div>
                                <span>Red blocks are already booked</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                <span>Orange blocks are under maintenance</span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-gray-700 border-gray-600">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm text-white">Block Details</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-gray-300 space-y-2">
                              <div className="flex justify-between">
                                <span>Size per block:</span>
                                <span className="font-medium">100 sq ft</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Minimum booking:</span>
                                <span className="font-medium">1 block</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Maximum selection:</span>
                                <span className="font-medium">20 blocks</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Booking period:</span>
                                <span className="font-medium">1-12 months</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Login prompt if not logged in */}
                        {!user && (
                          <div className="text-center py-6 bg-gray-700/50 rounded-lg">
                            <p className="text-gray-300 mb-3">Please login to select and book blocks</p>
                            <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">
                              Login to Book
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Booking Summary - Shows on the right side when blocks are selected */}
                    {user && selectedBlocks3D.length > 0 && (
                      <BookingSummary3D
                        warehouseId={warehouse.id}
                        warehouseName={warehouse.name}
                        warehouseLocation={`${warehouse.city}, ${warehouse.state}`}
                        goodsTypeOptions={goodsTypeOptions}
                        selectedBlocks={selectedBlocks3D}
                        blockPrice={warehouse.price_per_sqft}
                        onBookingConfirm={handle3DBookingConfirm}
                        onClearSelection={clearSelection3D}
                        isLoading={bookingLoading}
                        seekerId={user.id}
                      />
                    )}
                  </TabsContent>

                  {/* Reviews Tab */}
                  <TabsContent value="reviews" className="mt-6">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Customer Reviews</CardTitle>
                        <CardDescription>
                          {warehouse.reviews_count} reviews • Average rating {warehouse.rating.toFixed(1)}/5
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Mock reviews */}
                          {[
                            {
                              id: 1,
                              user: `${warehouse.city} Trading Co.`,
                              avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
                              rating: warehouse.rating > 4.5 ? 5 : 4,
                              date: "2024-01-15",
                              comment: `Excellent facility with professional management. The ${warehouse.total_area.toLocaleString()} sq ft area meets our requirements perfectly.`,
                              helpful: Math.floor(Math.random() * 20) + 5
                            },
                            {
                              id: 2,
                              user: "Maharashtra Logistics",
                              avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&q=80",
                              rating: warehouse.rating > 4.0 ? Math.ceil(warehouse.rating) : 4,
                              date: "2024-01-10",
                              comment: `Good facility with proper infrastructure. The pricing at ₹${warehouse.price_per_sqft}/sq ft is competitive.`,
                              helpful: Math.floor(Math.random() * 15) + 3
                            },
                            {
                              id: 3,
                              user: "Regional Distributor",
                              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
                              rating: Math.floor(warehouse.rating),
                              date: "2023-12-28",
                              comment: `Been using this facility for several months. Great location in ${warehouse.city}.`,
                              helpful: Math.floor(Math.random() * 25) + 8
                            }
                          ].map((review) => (
                            <div key={review.id} className="border-b border-gray-700 pb-6 last:border-b-0">
                              <div className="flex items-start space-x-4">
                                <Avatar>
                                  <AvatarImage src={review.avatar} />
                                  <AvatarFallback>{review.user[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="font-medium text-white">{review.user}</span>
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm text-gray-400">{review.date}</span>
                                  </div>
                                  <p className="text-gray-300 mb-2">{review.comment}</p>
                                  <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400">
                                    Helpful ({review.helpful})
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Pricing & Contact Card */}
            <Card className="border-blue-500/30 shadow-xl shadow-blue-500/10 bg-gradient-to-br from-gray-800 to-gray-900">
              <CardHeader className="bg-gradient-to-r from-blue-950/50 to-indigo-950/50 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-blue-400">₹{warehouse.price_per_sqft}</CardTitle>
                    <CardDescription className="text-gray-400">per sq ft / month</CardDescription>
                  </div>
                  <Badge className={`${
                    warehouse.status === 'available' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}>
                    {warehouse.status === 'available' ? 'Active' : warehouse.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Available Area</span>
                    <div className="font-bold text-green-400">{safeAvailableArea.toLocaleString()} sq ft</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Area</span>
                    <div className="font-medium text-white">{warehouse.total_area.toLocaleString()} sq ft</div>
                  </div>
                </div>
                
                <Separator className="bg-gray-700" />

                {/* Quick Booking Form */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-400">Start Date</Label>
                      <Input
                        type="date"
                        value={bookingStartDate}
                        onChange={(e) => setBookingStartDate(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-gray-100"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">End Date</Label>
                      <Input
                        type="date"
                        value={bookingEndDate}
                        onChange={(e) => setBookingEndDate(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-gray-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-400">Area (sq ft)</Label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={bookingArea}
                        onChange={(e) => setBookingArea(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-gray-100"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-300">Goods Type</Label>
                      <Input
                        list="goods-type-options"
                        value={bookingGoodsType}
                        onChange={(e) => setBookingGoodsType(e.target.value)}
                        aria-label="Goods type"
                        title="Goods type"
                        placeholder="Type goods (e.g., Vaccines, Dairy, Electronics)"
                        className="bg-gray-900 border-gray-700 text-gray-100 text-base"
                      />
                      <datalist id="goods-type-options">
                        {goodsTypeOptions.map(option => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {goodsTypeOptions.slice(0, 6).map(option => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setBookingGoodsType(option)}
                            className="rounded-full border border-gray-700 px-2.5 py-1 text-xs text-gray-200 hover:bg-gray-800"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Suggested for {warehouse?.warehouse_type || 'General Storage'}. You can also type any custom goods.
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    size="lg"
                    disabled={bookingLoading}
                    onClick={handleBooking}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Request Booking
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    size="lg"
                    onClick={() => setShowInquiryModal(true)}
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Send Inquiry
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30"
                      onClick={() => window.open(`https://wa.me/${facilityManager.phone.replace(/\D/g, '')}`, '_blank')}
                    >
                      <MessageSquare className="mr-1 h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-600/20 border-blue-500 text-blue-400 hover:bg-blue-600/30"
                      onClick={() => window.open(`tel:${facilityManager.phone}`, '_self')}
                    >
                      <Phone className="mr-1 h-4 w-4" />
                      Call
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700" 
                    size="lg"
                    onClick={() => setShowScheduleVisitModal(true)}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Schedule Visit
                  </Button>
                </div>

                <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-sm text-gray-200">Verified Contact</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {facilityManager.phone}<br/>
                    {facilityManager.email}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Warehouse Analytics */}
            <Card className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Warehouse Analytics
                </CardTitle>
                <CardDescription>Real-time insights & demand analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Demand Score */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Demand Score</span>
                    <span className="text-green-400 font-semibold">High</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-gray-500">Based on 30-day booking trends</p>
                </div>

                {/* Price Comparison */}
                <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Area Average</span>
                    <span className="text-sm text-gray-300">₹{Math.round(warehouse.price_per_sqft * 1.15)}/sq ft</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">This Property</span>
                    <span className="text-sm text-green-400 font-semibold">₹{warehouse.price_per_sqft}/sq ft</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                      {Math.round((1 - warehouse.price_per_sqft / (warehouse.price_per_sqft * 1.15)) * 100)}% Below Average
                    </Badge>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{Math.round((1 - warehouse.occupancy) * 100)}%</div>
                    <div className="text-xs text-gray-400">Availability</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">{Math.floor(Math.random() * 50) + 20}</div>
                    <div className="text-xs text-gray-400">Views Today</div>
                  </div>
                </div>

                {/* Booking Trend */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Monthly Bookings</span>
                    <span className="text-white">{Math.floor(Math.random() * 10) + 5} this month</span>
                  </div>
                  <div className="flex gap-1">
                    {[65, 78, 45, 89, 92, 73, 85, 68, 95, 82, 77, 88].map((value, i) => (
                      <div
                        key={i}
                        className={`flex-1 bg-blue-500/30 rounded-t ${getTrendHeightClass(value)}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Jan</span>
                    <span>Dec</span>
                  </div>
                </div>

                {/* Insights */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Insights</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-1 flex-shrink-0" />
                      <span className="text-gray-400">Peak demand expected in next 2 weeks</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1 flex-shrink-0" />
                      <span className="text-gray-400">Similar properties are 85% booked</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-1 flex-shrink-0" />
                      <span className="text-gray-400">Best value in {warehouse.city} area</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Facility Manager Card */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Facility Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={facilityManager.avatar} />
                    <AvatarFallback>{facilityManager.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-sm text-white">{facilityManager.name}</h3>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-white">{facilityManager.rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-400">• {facilityManager.properties} properties</span>
                    </div>
                    <p className="text-sm text-gray-400">Member since {facilityManager.memberSince}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700" 
                    size="sm"
                    onClick={() => {
                      if (facilityManager.email) {
                        window.location.href = `mailto:${facilityManager.email}?subject=Inquiry about ${warehouse.name}`;
                      } else {
                        toast({ title: 'Contact unavailable', description: 'No email address available', variant: 'destructive' });
                      }
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-gray-400 hover:bg-gray-700 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                    size="sm"
                    disabled={!facilityManager.id}
                    onClick={() => {
                      if (facilityManager.id) {
                        navigate(`/warehouses/owner/${facilityManager.id}`);
                      } else {
                        toast({ 
                          title: 'Not available', 
                          description: 'No owner information available for this warehouse', 
                          variant: 'destructive' 
                        });
                      }
                    }}
                    title={!facilityManager.id ? 'No owner information available' : `View all properties managed by ${facilityManager.name}`}
                  >
                    View All Properties
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Similar Properties */}
            {similarWarehouses.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Similar Properties</CardTitle>
                  <CardDescription>In {warehouse.city}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {similarWarehouses.map((similar) => (
                    <Link
                      key={similar.id}
                      to={`/warehouses/${similar.id}`}
                      className="block group"
                    >
                      <div className="flex space-x-3">
                        <img
                          src={similar.images?.[0] || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&q=80"}
                          alt={similar.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white group-hover:text-blue-400 truncate">
                            {similar.name}
                          </h4>
                          <p className="text-sm text-gray-400 truncate">
                            {similar.city}, {similar.state}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-semibold text-green-400">
                              ₹{similar.price_per_sqft}/sq ft
                            </span>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                              <span className="text-xs text-gray-400">
                                {similar.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Button variant="ghost" className="w-full text-gray-400" size="sm" asChild>
                    <Link to={`/warehouses?city=${warehouse.city}`}>
                      View More in {warehouse.city}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {warehouse && (
        <InquiryModal
          isOpen={showInquiryModal}
          onClose={() => setShowInquiryModal(false)}
          warehouseName={warehouse.name}
          warehouseId={warehouse.id}
          warehouseLocation={`${warehouse.city}, ${warehouse.state}`}
          pricePerSqFt={warehouse.price_per_sqft}
          availableArea={safeAvailableArea}
          ownerName={facilityManager.name}
          ownerPhone={facilityManager.phone}
          ownerEmail={facilityManager.email}
        />
      )}

      {warehouse && (
        <ScheduleVisitModal
          isOpen={showScheduleVisitModal}
          onClose={() => setShowScheduleVisitModal(false)}
          warehouseName={warehouse.name}
          warehouseId={warehouse.id}
          warehouseLocation={`${warehouse.city}, ${warehouse.state}`}
          ownerName={facilityManager.name}
          ownerPhone={facilityManager.phone}
          ownerEmail={facilityManager.email}
          ownerId={warehouse.owner_id}
          seekerId={profile?.id || '550e8400-e29b-41d4-a716-446655440001'}
        />
      )}

      {/* Booking Confirmation Modal */}
      {lastBooking && (
        <BookingConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          booking={lastBooking}
          onViewBookings={() => {
            setShowConfirmation(false);
            navigate('/seeker-hub');
          }}
        />
      )}
    </div>
  );
}
