import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CalendarIcon, ClockIcon, CreditCardIcon, PackageIcon, MapPinIcon, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BookingSummaryProps {
  warehouseId: string;
  warehouseName: string;
  selectedBlocks: number[];
  blockPrice: number;
  onBookingConfirm: (bookingData: BookingData) => Promise<void>;
  onClearSelection: () => void;
  isLoading?: boolean;
}

interface BookingData {
  selectedBlocks: number[];
  startDate: string;
  endDate: string;
  paymentMethod: 'razorpay' | 'stripe';
  totalAmount: number;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
}

export default function BookingSummary({
  warehouseId,
  warehouseName,
  selectedBlocks,
  blockPrice,
  onBookingConfirm,
  onClearSelection,
  isLoading = false
}: BookingSummaryProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'stripe'>('razorpay');
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
  const basePrice = selectedBlocksCount * blockPrice;
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
  const finalAmount = totalAmount * Math.max(duration, 1);

  // Set minimum date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!startDate) setStartDate(today);
  }, []);

  // Update end date when start date changes
  useEffect(() => {
    if (startDate && !endDate) {
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(nextDay.toISOString().split('T')[0]);
    }
  }, [startDate]);

  const handleConfirmBooking = async () => {
    try {
      setIsConfirming(true);
      
      const bookingData: BookingData = {
        selectedBlocks,
        startDate,
        endDate,
        paymentMethod,
        totalAmount: finalAmount,
        customerDetails
      };

      await onBookingConfirm(bookingData);
      setShowConfirmDialog(false);
      
      // Reset form
      setCustomerDetails({ name: '', email: '', phone: '', company: '' });
      
      toast({
        title: "🎉 Booking Confirmed!",
        description: `Successfully booked ${selectedBlocksCount} blocks for ${duration} days.`,
      });
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
      customerDetails.name &&
      customerDetails.email &&
      customerDetails.phone &&
      new Date(endDate) > new Date(startDate)
    );
  };

  if (selectedBlocksCount === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <PackageIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Select Warehouse Blocks
          </h3>
          <p className="text-gray-400">
            Click on available blocks in the grid to start building your booking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center space-x-2">
          <PackageIcon className="w-5 h-5" />
          <span>Booking Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warehouse Info */}
        <div className="flex items-center space-x-2 text-gray-300">
          <MapPinIcon className="w-4 h-4" />
          <span className="font-medium">{warehouseName}</span>
        </div>

        {/* Selected Blocks */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Blocks</h4>
          <div className="flex flex-wrap gap-1">
            {selectedBlocks.slice(0, 10).map(blockNumber => (
              <Badge key={blockNumber} variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500">
                Block {blockNumber}
              </Badge>
            ))}
            {selectedBlocks.length > 10 && (
              <Badge variant="outline" className="bg-gray-500/20 text-gray-300 border-gray-500">
                +{selectedBlocks.length - 10} more
              </Badge>
            )}
          </div>
        </div>

        {/* Booking Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Duration Display */}
        {duration > 0 && (
          <div className="flex items-center space-x-2 text-gray-300">
            <ClockIcon className="w-4 h-4" />
            <span>{duration} day{duration !== 1 ? 's' : ''}</span>
          </div>
        )}

        <Separator className="bg-gray-700" />

        {/* Pricing Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-gray-300">
            <span>{selectedBlocksCount} blocks × ₹{blockPrice.toLocaleString()}</span>
            <span>₹{basePrice.toLocaleString()}</span>
          </div>
          {duration > 1 && (
            <div className="flex justify-between text-gray-300">
              <span>Duration ({duration} days)</span>
              <span>× {duration}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-300">
            <span>GST (18%)</span>
            <span>₹{(gstAmount * Math.max(duration, 1)).toLocaleString()}</span>
          </div>
          <Separator className="bg-gray-700" />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Amount</span>
            <span className="text-green-400">₹{finalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onClearSelection}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            disabled={isLoading}
          >
            Clear Selection
          </Button>
          
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogTrigger asChild>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={selectedBlocksCount === 0 || !startDate || !endDate || isLoading}
              >
                <CreditCardIcon className="w-4 h-4 mr-2" />
                Book Now
              </Button>
            </DialogTrigger>
            
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                  Confirm Booking
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Customer Details Form */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-300">Customer Details</h4>
                  
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  
                  <input
                    type="text"
                    placeholder="Company Name (Optional)"
                    value={customerDetails.company}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Payment Method</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'razorpay')}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <span>Razorpay (UPI, Cards, Net Banking)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value="stripe"
                        checked={paymentMethod === 'stripe'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <span>Stripe (International Cards)</span>
                    </label>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span>Blocks: {selectedBlocksCount}</span>
                    <span>Duration: {duration} days</span>
                  </div>
                  <div className="flex justify-between font-semibold mt-2">
                    <span>Total Amount:</span>
                    <span className="text-green-400">₹{finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Confirm Button */}
                <Button
                  onClick={handleConfirmBooking}
                  disabled={!isFormValid() || isConfirming}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      Pay ₹{finalAmount.toLocaleString()}
                    </>
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

export type { BookingData, BookingSummaryProps };
