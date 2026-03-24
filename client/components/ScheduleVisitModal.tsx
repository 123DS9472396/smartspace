import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, Phone, Mail, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseName: string;
  warehouseId: string;
  warehouseLocation?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerId?: string;
  seekerId?: string;
}

export default function ScheduleVisitModal({
  isOpen,
  onClose,
  warehouseName,
  warehouseId,
  warehouseLocation = "Not specified",
  ownerName = "Warehouse Owner",
  ownerPhone = "+91 98765 43210",
  ownerEmail = "owner@smartspace.com",
  ownerId,
  seekerId
}: ScheduleVisitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    visitDate: "",
    visitTime: "",
    purpose: "inspection",
    notes: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get max date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.visitDate || !formData.visitTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create visit request
      const visitData = {
        warehouseId,
        warehouseName,
        warehouseLocation,
        ownerId,
        seekerId,
        visitorDetails: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company
        },
        visitDate: formData.visitDate,
        visitTime: formData.visitTime,
        purpose: formData.purpose,
        notes: formData.notes,
        status: 'pending'
      };

      // Send to API
      const response = await fetch('/api/schedule-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Visit Scheduled! ✓",
          description: `Your visit request for ${formData.visitDate} at ${formData.visitTime} has been sent to ${ownerName}. You'll receive a confirmation soon.`,
        });
        
        // Reset form and close
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          visitDate: "",
          visitTime: "",
          purpose: "inspection",
          notes: ""
        });
        onClose();
      } else {
        throw new Error(result.error || 'Failed to schedule visit');
      }
    } catch (error) {
      console.error('Schedule visit error:', error);
      toast({
        title: "Scheduling Failed",
        description: "There was an error scheduling your visit. Please try again or contact the owner directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = [
    { value: "09:00", label: "9:00 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "11:00", label: "11:00 AM" },
    { value: "12:00", label: "12:00 PM" },
    { value: "14:00", label: "2:00 PM" },
    { value: "15:00", label: "3:00 PM" },
    { value: "16:00", label: "4:00 PM" },
    { value: "17:00", label: "5:00 PM" },
  ];

  const visitPurposes = [
    { value: "inspection", label: "Property Inspection" },
    { value: "measurement", label: "Measurement & Planning" },
    { value: "negotiation", label: "Price Negotiation" },
    { value: "final_check", label: "Final Check Before Booking" },
    { value: "other", label: "Other Purpose" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader className="border-b border-gray-700 pb-4">
          <DialogTitle className="flex items-center space-x-2 text-white">
            <Calendar className="h-5 w-5 text-blue-400" />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Schedule Site Visit</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Book a visit to inspect the warehouse in person
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-4">
          {/* Warehouse Info */}
          <Card className="bg-gray-800/80 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-white">{warehouseName}</h3>
                  <p className="text-sm text-gray-400">{warehouseLocation}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visitDate" className="text-gray-300 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Visit Date *
              </Label>
              <Input
                id="visitDate"
                type="date"
                value={formData.visitDate}
                onChange={(e) => handleInputChange("visitDate", e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                required
              />
            </div>
            <div>
              <Label htmlFor="visitTime" className="text-gray-300 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Time Slot *
              </Label>
              <select
                id="visitTime"
                value={formData.visitTime}
                onChange={(e) => handleInputChange("visitTime", e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-gray-800 border border-gray-600 text-white focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Select time</option>
                {timeSlots.map(slot => (
                  <option key={slot.value} value={slot.value}>{slot.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Visit Purpose */}
          <div>
            <Label htmlFor="purpose" className="text-gray-300">Visit Purpose</Label>
            <select
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange("purpose", e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-gray-800 border border-gray-600 text-white focus:border-blue-500 focus:outline-none"
            >
              {visitPurposes.map(purpose => (
                <option key={purpose.value} value={purpose.value}>{purpose.label}</option>
              ))}
            </select>
          </div>

          {/* Visitor Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" /> Your Details
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name" className="text-gray-400 text-xs">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Your name"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-gray-400 text-xs">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email" className="text-gray-400 text-xs">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your@email.com"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="company" className="text-gray-400 text-xs">Company (Optional)</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="Company name"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-gray-400 text-xs">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any specific requirements or questions for the visit..."
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Owner Contact Info */}
          <Card className="bg-blue-900/20 border-blue-800/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{ownerName}</p>
                    <p className="text-xs text-gray-400">Will confirm your visit</p>
                  </div>
                </div>
                <Badge className="bg-green-900/50 text-green-400 border-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" /> Verified
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name || !formData.email || !formData.phone || !formData.visitDate || !formData.visitTime}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-5 shadow-lg shadow-blue-900/30"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Visit
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            The warehouse owner will receive your visit request and confirm within 24 hours.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
