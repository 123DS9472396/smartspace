import React, { useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Receipt, 
  Building, 
  MapPin, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  Download, 
  Printer,
  CheckCircle,
  Hash
} from 'lucide-react';

interface BookingReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    warehouse_name: string;
    warehouse_location: string;
    warehouse_address?: string;
    seeker_name: string;
    seeker_email: string;
    seeker_phone?: string;
    company_name?: string;
    start_date: string;
    end_date: string;
    area_sqft: number;
    blocks_booked?: number[];
    total_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
    approved_at?: string;
  };
  type: 'seeker' | 'owner';
}

export default function BookingReceipt({ 
  isOpen, 
  onClose, 
  booking, 
  type 
}: BookingReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const generateReceiptNumber = () => {
    const prefix = type === 'seeker' ? 'SR' : 'OR';
    return `${prefix}-${booking.id.substring(0, 8).toUpperCase()}`;
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const printWindow = window.open('', '_blank', 'width=720,height=960,scrollbars=yes');
    if (!printWindow) { window.print(); return; }

    const receiptNum = generateReceiptNumber();
    const durationDays = getDurationDays();
    const blocks = booking.blocks_booked || [];
    const blockBadges = blocks.map(b => `<span class="block-badge">#${b}</span>`).join('');

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>SmartSpace Receipt ${receiptNum}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; font-size: 13px; line-height: 1.5; }
    .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 12px; }
    .brand { font-size: 22px; font-weight: 800; color: #3b82f6; letter-spacing: -0.5px; }
    .subtitle { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .status-badge { display: inline-block; background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; border-radius: 999px; padding: 3px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 8px; }
    .receipt-meta { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .label { color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
    .mono { font-family: monospace; font-weight: 700; font-size: 14px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 7px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 7px; padding: 10px 12px; margin-bottom: 10px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
    .field-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
    .field-value { font-size: 13px; font-weight: 500; color: #111827; }
    .block-badge { display: inline-block; border: 1px solid #aaa; color: #374151; border-radius: 4px; padding: 1px 7px; font-size: 11px; margin: 2px 2px 2px 0; }
    .payment-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 7px; padding: 12px; margin-bottom: 10px; }
    .payment-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 6px; }
    .total-line { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #bfdbfe; padding-top: 10px; margin-top: 8px; }
    .total-amount { font-size: 21px; font-weight: 800; color: #1d4ed8; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 10px 0; }
    .info-row { font-size: 12px; color: #374151; margin-bottom: 4px; }
    .footer { text-align: center; color: #9ca3af; font-size: 10.5px; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 8px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">SmartSpace</div>
    <div class="subtitle">Warehouse Booking Platform</div>
    <div><span class="status-badge">&#10003; ${booking.status.toUpperCase()}</span></div>
  </div>
  <div class="receipt-meta">
    <div><div class="label">Receipt No.</div><div class="mono">${receiptNum}</div></div>
    <div style="text-align:right"><div class="label">Date</div><div style="font-weight:500">${formatDate(new Date().toISOString())}</div></div>
  </div>
  <hr class="divider"/>
  <div class="section-title">Warehouse Details</div>
  <div class="card">
    <div style="font-size:14px;font-weight:700;margin-bottom:4px">${booking.warehouse_name}</div>
    <div style="color:#6b7280;font-size:12px">${booking.warehouse_location}${booking.warehouse_address ? ' &mdash; ' + booking.warehouse_address : ''}</div>
  </div>
  <div class="section-title">Booking Details</div>
  <div class="grid-2">
    <div class="card"><div class="field-label">Start Date</div><div class="field-value">${formatDate(booking.start_date)}</div></div>
    <div class="card"><div class="field-label">End Date</div><div class="field-value">${formatDate(booking.end_date)}</div></div>
    <div class="card"><div class="field-label">Duration</div><div class="field-value">${durationDays} days</div></div>
    <div class="card"><div class="field-label">Area</div><div class="field-value">${booking.area_sqft.toLocaleString('en-IN')} sq ft</div></div>
  </div>
  ${blocks.length > 0 ? `<div class="card" style="margin-bottom:10px"><div class="field-label" style="margin-bottom:5px">Blocks Booked</div><div>${blockBadges}</div></div>` : ''}
  <div class="section-title">${type === 'owner' ? 'Customer Details' : 'Booked By'}</div>
  <div class="card">
    <div class="info-row"><strong>${booking.seeker_name}</strong></div>
    <div class="info-row">${booking.seeker_email}</div>
    ${booking.seeker_phone ? `<div class="info-row">${booking.seeker_phone}</div>` : ''}
    ${booking.company_name ? `<div class="info-row">${booking.company_name}</div>` : ''}
  </div>
  <hr class="divider"/>
  <div class="section-title">Payment Summary</div>
  <div class="payment-box">
    <div class="payment-row"><span style="color:#374151">Payment Method</span><span style="font-weight:500;text-transform:capitalize">${booking.payment_method}</span></div>
    <div class="total-line"><span style="font-size:14px;font-weight:700">Total Amount</span><span class="total-amount">&#8377;${booking.total_amount.toLocaleString('en-IN')}</span></div>
  </div>
  <div class="footer">
    <p>Thank you for choosing SmartSpace!</p>
    <p style="margin-top:3px">For support, contact: support@smartspace.com</p>
    <p style="margin-top:3px;font-family:monospace;font-size:10px;color:#bbb">ID: ${booking.id}</p>
  </div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 600);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Create a simple text receipt for download
    const receiptText = `
SMARTSPACE WAREHOUSE BOOKING RECEIPT
====================================

Receipt No: ${generateReceiptNumber()}
Date: ${formatDate(new Date().toISOString())}
Status: ${booking.status.toUpperCase()}

WAREHOUSE DETAILS
-----------------
Name: ${booking.warehouse_name}
Location: ${booking.warehouse_location}
${booking.warehouse_address ? `Address: ${booking.warehouse_address}` : ''}

BOOKING DETAILS
---------------
Start Date: ${formatDate(booking.start_date)}
End Date: ${formatDate(booking.end_date)}
Area: ${booking.area_sqft.toLocaleString()} sq ft
${booking.blocks_booked ? `Blocks: ${booking.blocks_booked.join(', ')}` : ''}

${type === 'owner' ? 'CUSTOMER' : 'BOOKED BY'}
---------
Name: ${booking.seeker_name}
Email: ${booking.seeker_email}
${booking.seeker_phone ? `Phone: ${booking.seeker_phone}` : ''}
${booking.company_name ? `Company: ${booking.company_name}` : ''}

PAYMENT DETAILS
---------------
Payment Method: ${booking.payment_method}
Total Amount: ${formatCurrency(booking.total_amount)}

====================================
Thank you for using SmartSpace!
For support: support@smartspace.com
    `.trim();

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${generateReceiptNumber()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Calculate duration
  const getDurationDays = () => {
    if (!booking.start_date || !booking.end_date) return 0;
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 text-slate-100 border border-slate-700 print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <Receipt className="w-5 h-5 text-blue-400" />
            Booking Receipt
          </DialogTitle>
        </DialogHeader>

        {/* Printable Receipt Content */}
        <div ref={receiptRef} className="space-y-4 p-2">
          {/* Header */}
          <div className="text-center border-b border-slate-700 pb-4">
            <h1 className="text-2xl font-bold text-blue-400">SmartSpace</h1>
            <p className="text-sm text-slate-400">Warehouse Booking Platform</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/40">
                <CheckCircle className="w-3 h-3 mr-1" />
                {booking.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Receipt Info */}
          <div className="flex justify-between items-start text-sm">
            <div>
              <p className="text-slate-400">Receipt No.</p>
              <p className="font-mono font-bold">{generateReceiptNumber()}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Date</p>
              <p className="font-medium">{formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          <Separator />

          {/* Warehouse Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Warehouse Details</h3>
            <Card className="bg-slate-800/70 border-slate-700">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold">{booking.warehouse_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="w-4 h-4" />
                  <span>{booking.warehouse_location}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Booking Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-xs">Start Date</p>
                <p className="font-medium">{formatDate(booking.start_date)}</p>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-xs">End Date</p>
                <p className="font-medium">{formatDate(booking.end_date)}</p>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-xs">Duration</p>
                <p className="font-medium">{getDurationDays()} days</p>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-xs">Area</p>
                <p className="font-medium">{booking.area_sqft.toLocaleString()} sq ft</p>
              </div>
            </div>
            {booking.blocks_booked && booking.blocks_booked.length > 0 && (
              <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-xs mb-1">Blocks Booked</p>
                <div className="flex flex-wrap gap-1">
                  {booking.blocks_booked.map(block => (
                    <Badge key={block} variant="outline" className="text-xs border-slate-600 text-slate-200">
                      #{block}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              {type === 'owner' ? 'Customer Details' : 'Booked By'}
            </h3>
            <Card className="bg-slate-800/70 border-slate-700">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{booking.seeker_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Mail className="w-4 h-4" />
                  <span>{booking.seeker_email}</span>
                </div>
                {booking.seeker_phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Phone className="w-4 h-4" />
                    <span>{booking.seeker_phone}</span>
                  </div>
                )}
                {booking.company_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Building className="w-4 h-4" />
                    <span>{booking.company_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Payment Summary</h3>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-slate-300">Payment Method</span>
                <span className="font-medium capitalize">{booking.payment_method}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-100">Total Amount</span>
                <span className="text-2xl font-bold text-blue-400">{formatCurrency(booking.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-700">
            <p>Thank you for choosing SmartSpace!</p>
            <p className="mt-1">For support, contact: support@smartspace.com</p>
            <p className="mt-1 font-mono text-slate-500">ID: {booking.id}</p>
          </div>
        </div>

        {/* Action Buttons (hidden when printing) */}
        <div className="flex gap-3 mt-4 print:hidden">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-800"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
