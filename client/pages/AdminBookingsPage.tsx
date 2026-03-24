import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Building,
  RefreshCw,
  Search,
  Filter,
  Eye,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Loader2,
  Receipt
} from 'lucide-react';

interface Booking {
  id: string;
  seeker_name: string;
  seeker_email: string;
  seeker_phone?: string;
  warehouse_id: string;
  warehouse_name: string;
  warehouse_location: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  area_sqft: number;
  blocks_booked?: number[];
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  booking_notes?: string;
  admin_notes?: string;
}

interface BookingStats {
  total_bookings: number;
  pending_bookings: number;
  approved_bookings: number;
  rejected_bookings: number;
  total_revenue: number;
  new_bookings_24h: number;
}

export default function AdminBookingsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/bookings');
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        console.error('Failed to fetch bookings:', data.error);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/bookings/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.seeker_name?.toLowerCase().includes(term) ||
        b.warehouse_name?.toLowerCase().includes(term) ||
        b.seeker_email?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  const handleStatusUpdate = async (bookingId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(bookingId);
      
      const response = await fetch('/api/admin/bookings/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          status,
          adminNotes
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: status === 'approved' ? 'Booking Approved ✓' : 'Booking Rejected',
          description: `Booking has been ${status}. ${status === 'approved' ? 'Owner has been notified.' : ''}`,
        });
        
        // Refresh bookings
        await fetchBookings();
        await fetchStats();
        setSelectedBooking(null);
        setAdminNotes('');
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update booking status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-900/50 text-green-400 border-green-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-900/50 text-red-400 border-red-700"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (profile?.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">Only administrators can access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-400" />
              Booking Management
            </h1>
            <p className="text-slate-400 mt-1">Review and manage warehouse booking requests</p>
          </div>
          <Button onClick={() => { fetchBookings(); fetchStats(); }} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm">Total Bookings</p>
                    <p className="text-2xl font-bold text-white">{stats.total_bookings}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/40 to-yellow-950/40 border-yellow-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-300 text-sm">Pending Approval</p>
                    <p className="text-2xl font-bold text-white">{stats.pending_bookings}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/40 to-green-950/40 border-green-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm">Approved</p>
                    <p className="text-2xl font-bold text-white">{stats.approved_bookings}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.total_revenue)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, warehouse, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={statusFilter === status ? 'bg-blue-600' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Bookings Found</h3>
              <p className="text-gray-400">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Booking requests will appear here when seekers make reservations'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <Card key={booking.id} className={`bg-gray-800/80 border-gray-700 hover:border-gray-600 transition-colors ${selectedBooking?.id === booking.id ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Booking Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">{booking.warehouse_name}</h3>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{booking.seeker_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{booking.seeker_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{booking.warehouse_location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-gray-400">Area: <span className="text-white font-medium">{booking.area_sqft?.toLocaleString()} sq ft</span></span>
                        {booking.blocks_booked && booking.blocks_booked.length > 0 && (
                          <span className="text-gray-400">Blocks: <span className="text-white font-medium">{booking.blocks_booked.length}</span></span>
                        )}
                        <span className="text-gray-400">Payment: <span className="text-white font-medium capitalize">{booking.payment_method}</span></span>
                        <span className="text-gray-400">Submitted: <span className="text-white font-medium">{formatDate(booking.created_at)}</span></span>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Total Amount</p>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(booking.total_amount)}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {selectedBooking?.id === booking.id ? 'Close' : 'Details'}
                        </Button>

                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, 'approved')}
                              disabled={processingId === booking.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {processingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                              disabled={processingId === booking.id}
                            >
                              {processingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                              Reject
                            </Button>
                          </>
                        )}

                        {booking.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
                            onClick={() => navigate(`/invoice/${booking.id}`, { state: { from: '/admin/bookings' } })}
                          >
                            <Receipt className="w-4 h-4 mr-1" />
                            Invoice
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedBooking?.id === booking.id && (
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Booking Notes</h4>
                          <p className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg">
                            {booking.booking_notes || 'No notes provided'}
                          </p>
                        </div>

                        {booking.status === 'pending' && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Admin Notes (Optional)</h4>
                            <textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add notes for this booking..."
                              className="w-full h-20 bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                          </div>
                        )}

                        {booking.admin_notes && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Admin Notes</h4>
                            <p className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg">
                              {booking.admin_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
