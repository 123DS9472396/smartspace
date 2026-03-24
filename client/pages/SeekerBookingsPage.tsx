import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import showSimpleNotification from '@/utils/simpleNotification';
import {
    Building2, Calendar, Package, DollarSign, Clock, CheckCircle,
    XCircle, AlertCircle, MapPin, FileText, Download, RefreshCw,
    Eye, Trash2, ArrowLeft
} from 'lucide-react';

interface Booking {
    id: string;
    warehouse_id: string;
    warehouse_name: string;
    warehouse_location: string;
    warehouse_address: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    area_sqft: number;
    blocks_booked?: any[];
    status: 'active' | 'upcoming' | 'completed' | 'cancelled';
    admin_status: string;
    created_at: string;
    booking_type: string;
    admin_notes?: string;
}

export default function SeekerBookingsPage() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchBookings();
    }, [user]);

    const fetchBookings = async () => {
        if (!user) return;

        try {
            setRefreshing(true);
            const response = await fetch(`/api/bookings?seeker_id=${user.id}`);
            const data = await response.json();

            if (data.success) {
                setBookings(data.bookings);
            } else {
                console.error('Failed to fetch bookings:', data.error);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            showSimpleNotification('error', 'Error', 'Failed to load bookings');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            const response = await fetch('/api/bookings/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: bookingId,
                    seeker_id: user?.id,
                    cancellation_reason: 'Cancelled by user'
                })
            });

            const data = await response.json();
            if (data.success) {
                showSimpleNotification('success', 'Booking Cancelled', 'Your booking has been cancelled successfully');
                fetchBookings(); // Refresh
            } else {
                showSimpleNotification('error', 'Error', data.error || 'Failed to cancel booking');
            }
        } catch (error) {
            console.error('Cancel error:', error);
            showSimpleNotification('error', 'Error', 'Failed to cancel booking');
        }
    };

    const handleDownloadInvoice = async (bookingId: string) => {
        // Navigate to the visual invoice page
        navigate(`/invoice/${bookingId}`);
    };

    const getStatusBadge = (booking: Booking) => {
        const adminStatus = booking.admin_status;

        if (adminStatus === 'pending') {
            return (
                <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Approval
                </Badge>
            );
        }
        if (adminStatus === 'approved' || booking.status === 'active') {
            return (
                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                </Badge>
            );
        }
        if (adminStatus === 'rejected' || booking.status === 'cancelled') {
            return (
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                    <XCircle className="h-3 w-3 mr-1" />
                    {adminStatus === 'rejected' ? 'Rejected' : 'Cancelled'}
                </Badge>
            );
        }
        if (booking.status === 'upcoming') {
            return (
                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Calendar className="h-3 w-3 mr-1" />
                    Upcoming
                </Badge>
            );
        }
        if (booking.status === 'completed') {
            return (
                <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                </Badge>
            );
        }
        return null;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const filterBookings = (tab: string) => {
        if (tab === 'all') return bookings;
        if (tab === 'pending') return bookings.filter(b => b.admin_status === 'pending');
        if (tab === 'approved') return bookings.filter(b => b.admin_status === 'approved');
        if (tab === 'cancelled') return bookings.filter(b => b.status === 'cancelled' || b.admin_status === 'rejected');
        return bookings;
    };

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.admin_status === 'pending').length,
        approved: bookings.filter(b => b.admin_status === 'approved').length,
        cancelled: bookings.filter(b => b.status === 'cancelled' || b.admin_status === 'rejected').length
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900">
                <Navbar />
                <div className="container mx-auto px-4 py-16 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-slate-300">Loading your bookings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/dashboard')}
                                className="text-slate-400 hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Dashboard
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold text-white">My Bookings</h1>
                        <p className="text-slate-400 mt-1">Track and manage your warehouse bookings</p>
                    </div>
                    <Button
                        onClick={fetchBookings}
                        disabled={refreshing}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-slate-800/50 border-slate-600/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Package className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                                    <p className="text-xs text-slate-400">Total Bookings</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-600/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/20 rounded-lg">
                                    <Clock className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                                    <p className="text-xs text-slate-400">Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-600/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.approved}</p>
                                    <p className="text-xs text-slate-400">Approved</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-600/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <XCircle className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
                                    <p className="text-xs text-slate-400">Cancelled</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bookings Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-slate-800/50 border border-slate-600/50 mb-6">
                        <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">
                            All ({stats.total})
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-600">
                            Pending ({stats.pending})
                        </TabsTrigger>
                        <TabsTrigger value="approved" className="data-[state=active]:bg-green-600">
                            Approved ({stats.approved})
                        </TabsTrigger>
                        <TabsTrigger value="cancelled" className="data-[state=active]:bg-red-600">
                            Cancelled ({stats.cancelled})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab}>
                        {filterBookings(activeTab).length === 0 ? (
                            <Card className="bg-slate-800/50 border-slate-600/50">
                                <CardContent className="p-12 text-center">
                                    <Package className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                                    <h3 className="text-xl font-semibold text-white mb-2">No bookings found</h3>
                                    <p className="text-slate-400 mb-6">
                                        {activeTab === 'all'
                                            ? "You haven't made any bookings yet."
                                            : `No ${activeTab} bookings.`}
                                    </p>
                                    <Button onClick={() => navigate('/warehouses')} className="bg-blue-600 hover:bg-blue-700">
                                        Browse Warehouses
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filterBookings(activeTab).map((booking) => (
                                    <Card key={booking.id} className="bg-slate-800/50 border-slate-600/50 hover:border-blue-500/30 transition-colors">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                {/* Left Section - Warehouse Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-white">{booking.warehouse_name}</h3>
                                                        {getStatusBadge(booking)}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                                                        <MapPin className="h-4 w-4" />
                                                        {booking.warehouse_location}
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-slate-400">Check-in</p>
                                                            <p className="text-white font-medium">{formatDate(booking.start_date)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-400">Check-out</p>
                                                            <p className="text-white font-medium">{formatDate(booking.end_date)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-400">Area</p>
                                                            <p className="text-white font-medium">{booking.area_sqft?.toLocaleString() || 'N/A'} sq ft</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-400">Amount</p>
                                                            <p className="text-green-400 font-bold">₹{booking.total_amount?.toLocaleString() || 'N/A'}</p>
                                                        </div>
                                                    </div>

                                                    {booking.admin_notes && (
                                                        <div className="mt-3 p-2 bg-slate-700/50 rounded text-sm">
                                                            <span className="text-slate-400">Admin Note: </span>
                                                            <span className="text-slate-300">{booking.admin_notes}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Section - Actions */}
                                                <div className="flex flex-row md:flex-col gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                                        onClick={() => navigate(`/warehouses/${booking.warehouse_id}`)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </Button>

                                                    {booking.admin_status === 'approved' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-green-600 text-green-400 hover:bg-green-900/30"
                                                            onClick={() => handleDownloadInvoice(booking.id)}
                                                        >
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Invoice
                                                        </Button>
                                                    )}

                                                    {booking.admin_status === 'pending' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-red-600 text-red-400 hover:bg-red-900/30"
                                                            onClick={() => handleCancelBooking(booking.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
