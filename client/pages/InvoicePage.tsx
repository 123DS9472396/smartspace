import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Building, 
  MapPin, 
  Calendar, 
  User, 
  Mail, 
  Phone,
  FileText,
  CheckCircle,
  Clock,
  CreditCard
} from 'lucide-react';

interface InvoiceData {
  invoice_id: string;
  booking_id: string;
  invoice_date: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  warehouse: {
    name: string;
    location: string;
    address: string;
  };
  booking: {
    start_date: string;
    end_date: string;
    duration_days: number;
    area_sqft: number;
    booking_type: string;
    goods_type?: string;
  };
  pricing: {
    base_amount: number;
    tax: number;
    tax_rate: string;
    insurance?: number;
    insurance_rate?: string;
    total_amount: number;
    currency: string;
    payment_method: string;
  };
  status: string;
  created_at: string;
  approved_at?: string;
}

export default function InvoicePage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvoice();
  }, [bookingId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/invoice/${bookingId}`);
      const data = await response.json();
      
      if (data.success && data.invoice) {
        setInvoice(data.invoice);
      } else {
        setError('Invoice not found');
      }
    } catch (err) {
      setError('Failed to load invoice');
      console.error('Error fetching invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from) {
      navigate(from);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/admin/bookings');
  };

  const handleDownload = () => {
    if (!invoice) return;
    
    const content = `
INVOICE
=====================================
Invoice #: ${invoice.invoice_id}
Date: ${formatDate(invoice.invoice_date)}
Status: ${invoice.status.toUpperCase()}

CUSTOMER DETAILS
-------------------------------------
Name: ${invoice.customer.name}
Email: ${invoice.customer.email}
Phone: ${invoice.customer.phone}

WAREHOUSE DETAILS
-------------------------------------
Name: ${invoice.warehouse.name}
Location: ${invoice.warehouse.location}
Address: ${invoice.warehouse.address}

BOOKING DETAILS
-------------------------------------
Start Date: ${formatDate(invoice.booking.start_date)}
End Date: ${formatDate(invoice.booking.end_date)}
Duration: ${invoice.booking.duration_days} days
Area: ${invoice.booking.area_sqft} sq ft
Type: ${invoice.booking.booking_type}
Goods: ${invoice.booking.goods_type || 'General Goods'}

PRICING
-------------------------------------
Base Amount: ₹${invoice.pricing.base_amount.toLocaleString()}
Tax (${invoice.pricing.tax_rate}): ₹${invoice.pricing.tax.toLocaleString()}
Insurance (${invoice.pricing.insurance_rate || '2% Insurance'}): ₹${(invoice.pricing.insurance || 0).toLocaleString()}
-------------------------------------
TOTAL: ₹${invoice.pricing.total_amount.toLocaleString()}
-------------------------------------
Payment Method: ${invoice.pricing.payment_method}

=====================================
Thank you for choosing SmartSpace!
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoice.invoice_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Invoice Not Found</h2>
            <p className="text-gray-400 mb-4">{error || 'The requested invoice could not be found.'}</p>
            <Button onClick={handleBack} variant="outline" className="border-gray-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Action Buttons - Hide on print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Invoice Card */}
        <Card ref={printRef} className="bg-white text-gray-900 border-0 shadow-2xl print:shadow-none printable">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 print:bg-blue-600">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">INVOICE</h1>
                <p className="text-blue-100 mt-1">SmartSpace Warehouse Platform</p>
              </div>
              <div className="text-right">
                <Badge className={`text-lg px-4 py-1 ${
                  invoice.status === 'paid' 
                    ? 'bg-green-500' 
                    : 'bg-yellow-500'
                }`}>
                  {invoice.status === 'paid' ? (
                    <><CheckCircle className="h-4 w-4 mr-1" /> PAID</>
                  ) : (
                    <><Clock className="h-4 w-4 mr-1" /> PENDING</>
                  )}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {/* Invoice Info */}
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">Invoice Number</p>
                <p className="font-mono font-bold text-lg">{invoice.invoice_id}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm">Invoice Date</p>
                <p className="font-semibold">{formatDate(invoice.invoice_date)}</p>
              </div>
            </div>

            <Separator />

            {/* Customer & Warehouse */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Bill To
                </h3>
                <p className="font-semibold">{invoice.customer.name}</p>
                <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                  <Mail className="h-3 w-3" />
                  {invoice.customer.email}
                </p>
                <p className="text-gray-600 text-sm flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {invoice.customer.phone}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Warehouse
                </h3>
                <p className="font-semibold">{invoice.warehouse.name}</p>
                <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {invoice.warehouse.location}
                </p>
                <p className="text-gray-600 text-sm">{invoice.warehouse.address}</p>
              </div>
            </div>

            <Separator />

            {/* Booking Details */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Booking Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs">Start Date</p>
                    <p className="font-semibold">{formatDate(invoice.booking.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">End Date</p>
                    <p className="font-semibold">{formatDate(invoice.booking.end_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Duration</p>
                    <p className="font-semibold">{invoice.booking.duration_days} days</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Area</p>
                    <p className="font-semibold">{invoice.booking.area_sqft.toLocaleString()} sq ft</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Goods Type</p>
                    <p className="font-semibold">{invoice.booking.goods_type || 'General Goods'}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount</span>
                  <span className="font-medium">₹{invoice.pricing.base_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({invoice.pricing.tax_rate})</span>
                  <span className="font-medium">₹{invoice.pricing.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Insurance ({invoice.pricing.insurance_rate || '2% Insurance'})</span>
                  <span className="font-medium">₹{(invoice.pricing.insurance || 0).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total Amount</span>
                  <span className="font-bold text-blue-600">₹{invoice.pricing.total_amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Payment Method:</span> {invoice.pricing.payment_method.charAt(0).toUpperCase() + invoice.pricing.payment_method.slice(1)}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t text-center text-gray-500 text-sm">
              <p>Thank you for choosing SmartSpace!</p>
              <p className="mt-1">For any queries, contact support@smartspace.com</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .printable, .printable * {
            visibility: visible;
          }
          .printable {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
          }
          #root {
            background: white !important;
          }
          .printable .bg-gradient-to-r,
          .printable .bg-blue-600,
          .printable .bg-indigo-600 {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
