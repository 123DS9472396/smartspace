import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, MapPin, Package, DollarSign, X, Clock, Building2, FileText, Download } from 'lucide-react';
import BookingReceipt from './BookingReceipt';

interface BookingDetails {
    id: string;
    warehouseName: string;
    warehouseLocation: string;
    startDate: string;
    endDate: string;
    area: number;
    totalAmount: number;
    blocksBooked?: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerPhone?: string;
}

interface BookingConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: BookingDetails;
    onViewBookings: () => void;
}

const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
    isOpen,
    onClose,
    booking,
    onViewBookings
}) => {
    const [showReceipt, setShowReceipt] = useState(false);
    
    if (!isOpen) return null;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getDuration = () => {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 animate-in zoom-in-95 duration-300">
                <Card className="border-slate-600/50 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center border-b border-slate-600/50 pb-6">
                        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border-2 border-green-500/30 animate-pulse">
                            <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                        <CardTitle className="text-2xl text-white">Booking Submitted!</CardTitle>
                        <p className="text-slate-400 mt-2">Your booking request has been sent for admin approval</p>
                    </CardHeader>

                    <CardContent className="p-6 space-y-4">
                        {/* Status Badge */}
                        <div className="flex justify-center">
                            <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-4 py-1">
                                <Clock className="h-3 w-3 mr-2" />
                                Pending Approval
                            </Badge>
                        </div>

                        {/* Booking Details */}
                        <div className="bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-600/30">
                            <div className="flex items-start gap-3">
                                <Building2 className="h-5 w-5 text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-slate-400">Warehouse</p>
                                    <p className="text-white font-semibold">{booking.warehouseName}</p>
                                    <p className="text-slate-400 text-sm">{booking.warehouseLocation}</p>
                                </div>
                            </div>

                            <div className="h-px bg-slate-600/50" />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-indigo-400" />
                                    <div>
                                        <p className="text-xs text-slate-400">From</p>
                                        <p className="text-white text-sm">{formatDate(booking.startDate)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-indigo-400" />
                                    <div>
                                        <p className="text-xs text-slate-400">To</p>
                                        <p className="text-white text-sm">{formatDate(booking.endDate)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-600/50" />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-purple-400" />
                                    <div>
                                        <p className="text-xs text-slate-400">Area</p>
                                        <p className="text-white text-sm">{booking.area.toLocaleString()} sq ft</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-amber-400" />
                                    <div>
                                        <p className="text-xs text-slate-400">Duration</p>
                                        <p className="text-white text-sm">{getDuration()} days</p>
                                    </div>
                                </div>
                            </div>

                            {booking.blocksBooked && (
                                <>
                                    <div className="h-px bg-slate-600/50" />
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-cyan-400" />
                                        <div>
                                            <p className="text-xs text-slate-400">Blocks Booked</p>
                                            <p className="text-white text-sm">{booking.blocksBooked} blocks</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Total Amount */}
                        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-500/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-400" />
                                    <span className="text-slate-300">Total Amount</span>
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                    ₹{booking.totalAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Booking ID */}
                        <div className="text-center">
                            <p className="text-xs text-slate-500">Booking Reference</p>
                            <p className="text-slate-400 font-mono text-sm">{booking.id.substring(0, 8).toUpperCase()}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Close
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 border-green-600 text-green-400 hover:bg-green-900/30"
                                onClick={() => setShowReceipt(true)}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                View Receipt
                            </Button>
                        </div>
                        <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            onClick={onViewBookings}
                        >
                            View My Bookings
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Receipt Modal */}
            {showReceipt && (
                <BookingReceipt
                    isOpen={showReceipt}
                    onClose={() => setShowReceipt(false)}
                    type="seeker"
                    booking={{
                        id: booking.id,
                        warehouse_name: booking.warehouseName,
                        warehouse_location: booking.warehouseLocation,
                        seeker_name: booking.customerName || 'Customer',
                        seeker_email: booking.customerEmail || '',
                        seeker_phone: booking.customerPhone || '',
                        start_date: booking.startDate,
                        end_date: booking.endDate,
                        area_sqft: booking.area,
                        blocks_booked: booking.blocksBooked ? Array.from({ length: booking.blocksBooked }, (_, i) => i + 1) : [],
                        total_amount: booking.totalAmount,
                        payment_method: 'Online Payment',
                        status: booking.status,
                        created_at: booking.createdAt
                    }}
                />
            )}
        </div>
    );
};

export default BookingConfirmationModal;
