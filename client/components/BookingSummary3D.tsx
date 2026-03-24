import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CalendarIcon, ClockIcon, CreditCardIcon, PackageIcon, MapPinIcon, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BookingSummary3DProps {
  warehouseId: string;
  warehouseName: string;
  warehouseLocation: string;
  goodsTypeOptions: string[];
  selectedBlocks: number[];
  blockPrice: number;
  onBookingConfirm: (bookingData: BookingData) => Promise<void>;
  onClearSelection: () => void;
  isLoading?: boolean;
  seekerId?: string;
}

export interface BookingData {
  selectedBlocks: number[];
  startDate: string;
  endDate: string;
  paymentMethod: 'razorpay' | 'stripe' | 'online';
  totalAmount: number;
  goodsType: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
}

export default function BookingSummary3D({
  warehouseId,
  warehouseName,
  warehouseLocation,
  goodsTypeOptions,
  selectedBlocks,
  blockPrice,
  onBookingConfirm,
  onClearSelection,
  isLoading = false,
  seekerId
}: BookingSummary3DProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'stripe' | 'online'>('online');
  const [goodsType, setGoodsType] = useState('');
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Calculate pricing
  const selectedBlocksCount = selectedBlocks.length;
  const blockAreaSqFt = 100; // Each block = 100 sq ft
  const totalAreaSqFt = selectedBlocksCount * blockAreaSqFt;
  const basePrice = totalAreaSqFt * blockPrice;
  const gstRate = 0.18; // 18% GST
  const gstAmount = basePrice * gstRate;
  const totalAmount = basePrice + gstAmount;

  // Calculate duration in days
  const getDurationInDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const duration = getDurationInDays();
  // For monthly pricing, calculate months (round to nearest month, min 1)
  // 1-45 days = 1 month, 46-75 days = 2 months, etc.
  const months = Math.max(Math.round(duration / 30), 1);
  const finalAmount = totalAmount * months;

  // Set minimum date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!startDate) setStartDate(today);
  }, []);

  // Update end date when start date changes
  useEffect(() => {
    if (startDate && !endDate) {
      const nextMonth = new Date(startDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setEndDate(nextMonth.toISOString().split('T')[0]);
    }
  }, [startDate]);

  useEffect(() => {
    if (!goodsType && goodsTypeOptions.length > 0) {
      setGoodsType(goodsTypeOptions[0]);
    }
  }, [goodsType, goodsTypeOptions]);

  const handleConfirmBooking = async () => {
    try {
      setIsConfirming(true);
      
      const bookingData: BookingData = {
        selectedBlocks,
        startDate,
        endDate,
        paymentMethod,
        totalAmount: finalAmount,
        goodsType,
        customerDetails
      };

      await onBookingConfirm(bookingData);
      setShowConfirmDialog(false);
      
      // Reset form
      setCustomerDetails({ name: '', email: '', phone: '', company: '' });
      
    } catch (error) {
      console.error('Booking failed:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const isFormValid = () => {
    return (
      selectedBlocksCount > 0 &&
      startDate &&
      endDate &&
      goodsType &&
      customerDetails.name &&
      customerDetails.email &&
      customerDetails.phone &&
      new Date(endDate) > new Date(startDate)
    );
  };

  if (selectedBlocksCount === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <PackageIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Select Warehouse Blocks
          </h3>
          <p className="text-gray-400 text-sm">
            Click "Start Selection" and then click on available blocks in the 3D grid to start building your booking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 shadow-xl shadow-blue-500/10">
      <CardHeader className="pb-3 border-b border-gray-700">
        <CardTitle className="text-xl text-white flex items-center space-x-2">
          <PackageIcon className="w-5 h-5 text-blue-400" />
          <span>Booking Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Warehouse Info */}
        <div className="flex items-center space-x-2 text-gray-300">
          <MapPinIcon className="w-4 h-4 text-blue-400" />
          <div>
            <span className="font-medium">{warehouseName}</span>
            <p className="text-xs text-gray-400">{warehouseLocation}</p>
          </div>
        </div>

        {/* Selected Blocks */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Blocks ({selectedBlocksCount})</h4>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {selectedBlocks.slice(0, 15).map(blockNumber => (
              <Badge key={blockNumber} variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500 text-xs">
                #{blockNumber}
              </Badge>
            ))}
            {selectedBlocks.length > 15 && (
              <Badge variant="outline" className="bg-gray-500/20 text-gray-300 border-gray-500 text-xs">
                +{selectedBlocks.length - 15} more
              </Badge>
            )}
          </div>
        </div>

        {/* Area Info */}
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Area</span>
            <span className="font-medium text-green-400">{totalAreaSqFt.toLocaleString()} sq ft</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Rate</span>
            <span className="font-medium text-white">₹{blockPrice}/sq ft</span>
          </div>
        </div>

        {/* Goods Type Selection */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Goods Type *</label>
          <select
            value={goodsType}
            onChange={(e) => setGoodsType(e.target.value)}
            aria-label="Goods type"
            title="Goods type"
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select goods type</option>
            {goodsTypeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500">Choose the type of goods you will store in this warehouse.</p>
        </div>

        {/* Booking Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                aria-label="Start date"
                title="Start date"
                className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">End Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                aria-label="End date"
                title="End date"
                className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Duration Display */}
        {duration > 0 && (
          <div className="flex items-center space-x-2 text-gray-300 text-sm">
            <ClockIcon className="w-4 h-4 text-blue-400" />
            <span>{duration} days ({months} month{months !== 1 ? 's' : ''})</span>
          </div>
        )}

        <Separator className="bg-gray-700" />

        {/* Pricing Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>{totalAreaSqFt.toLocaleString()} sq ft × ₹{blockPrice}</span>
            <span>₹{basePrice.toLocaleString()}</span>
          </div>
          {months > 1 && (
            <div className="flex justify-between text-gray-300">
              <span>Duration ({months} months)</span>
              <span>× {months}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-300">
            <span>GST (18%)</span>
            <span>₹{(gstAmount * months).toLocaleString()}</span>
          </div>
          <Separator className="bg-gray-700" />
          <div className="flex justify-between text-lg font-bold">
            <span className="text-white">Total Amount</span>
            <span className="text-green-400">₹{finalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            onClick={onClearSelection}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 text-sm"
            disabled={isLoading}
          >
            Clear
          </Button>
          
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogTrigger asChild>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm"
                disabled={selectedBlocksCount === 0 || !startDate || !endDate || isLoading}
              >
                <CreditCardIcon className="w-4 h-4 mr-1" />
                Book Now
              </Button>
            </DialogTrigger>
            
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Confirm Booking
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Customer Details Form */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-300 text-sm">Customer Details</h4>
                  
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                    aria-label="Full name"
                    title="Full name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                  
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                    aria-label="Email address"
                    title="Email address"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                  
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                    aria-label="Phone number"
                    title="Phone number"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                  
                  <input
                    type="text"
                    placeholder="Company Name (Optional)"
                    value={customerDetails.company}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, company: e.target.value }))}
                    aria-label="Company name"
                    title="Company name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <h4 className="font-medium text-gray-300 mb-2 text-sm">Payment Method</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'online')}
                        className="text-blue-500"
                      />
                      <span>Online Payment (UPI, Cards, Net Banking)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'razorpay')}
                        className="text-blue-500"
                      />
                      <span>Razorpay</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        name="payment"
                        value="stripe"
                        checked={paymentMethod === 'stripe'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}
                        className="text-blue-500"
                      />
                      <span>Stripe (International Cards)</span>
                    </label>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="bg-gray-700/50 p-3 rounded-lg text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400">Blocks:</span>
                      <span className="ml-1 font-medium">{selectedBlocksCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Area:</span>
                      <span className="ml-1 font-medium">{totalAreaSqFt.toLocaleString()} sq ft</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <span className="ml-1 font-medium">{months} month{months !== 1 ? 's' : ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <Badge className="ml-1 bg-yellow-500/20 text-yellow-300 text-xs">Pending Approval</Badge>
                    </div>
                  </div>
                  <Separator className="my-2 bg-gray-600" />
                  <div className="flex justify-between font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-400">₹{finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Note about approval */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200">
                  <p>📋 Your booking will be sent for admin approval. Once approved, the warehouse owner will receive your booking details and you'll get a confirmation email.</p>
                </div>

                {/* Confirm Button */}
                <Button
                  onClick={handleConfirmBooking}
                  disabled={!isFormValid() || isConfirming}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3"
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Submit Booking Request - ₹{finalAmount.toLocaleString()}</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
