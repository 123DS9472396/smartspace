import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Phone, Mail, Send, MapPin, Clock, Calculator } from "lucide-react";

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseName: string;
  warehouseId: string;
  warehouseLocation?: string;
  pricePerSqFt?: number;
  availableArea?: number;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerWhatsapp?: string;
}

export default function InquiryModal({ 
  isOpen, 
  onClose, 
  warehouseName,
  warehouseId,
  warehouseLocation = "Not specified",
  pricePerSqFt = 0,
  availableArea = 0,
  ownerName = "Warehouse Owner",
  ownerPhone = "+91 98765 43210",
  ownerEmail = "owner@smartspace.com",
  ownerWhatsapp
}: InquiryModalProps) {
  const [inquiryType, setInquiryType] = useState<"general" | "booking" | "partnership">("general");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    requiredSpace: "",
    duration: "",
    startDate: "",
    message: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateWhatsAppMessage = () => {
    const baseMessage = `Hi! I'm interested in your warehouse listed on SmartWarehouse:

📍 Location: ${warehouseLocation}
🏢 Property: ${warehouseName}
💰 Price: ₹${pricePerSqFt}/sq ft

`;

    switch (inquiryType) {
      case "general":
        return `${baseMessage}I would like to know more details about this warehouse. Could you please share more information?

Contact Details:
👤 Name: ${formData.name}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone}${formData.company ? `\n🏢 Company: ${formData.company}` : ''}

${formData.message ? `\nAdditional Notes:\n${formData.message}` : ''}

Thank you!`;

      case "booking":
        const totalCost = formData.requiredSpace && formData.duration 
          ? parseInt(formData.requiredSpace) * pricePerSqFt * parseInt(formData.duration)
          : 0;
        
        return `${baseMessage}I want to book your warehouse on SmartWarehouse:

📋 Booking Details:
📐 Required: ${formData.requiredSpace} sq ft
⏱️ Duration: ${formData.duration} month(s)
📅 Start Date: ${formData.startDate}
💵 Estimated Cost: ₹${totalCost.toLocaleString()}

Contact Details:
👤 Name: ${formData.name}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone}${formData.company ? `\n🏢 Company: ${formData.company}` : ''}

${formData.message ? `\nSpecial Requirements:\n${formData.message}` : ''}

Please confirm availability and share the next steps.`;

      case "partnership":
        return `${baseMessage}Partnership Inquiry:

We're expanding our operations and need:
📍 Location: ${warehouseLocation}
📐 Space: ${formData.requiredSpace || 'To be discussed'} sq ft
🤝 Partnership Type: Long-term business collaboration

Company Details:
🏢 Company: ${formData.company}
👤 Contact Person: ${formData.name}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone}

${formData.message ? `\nPartnership Details:\n${formData.message}` : ''}

Looking forward to discussing this opportunity.`;

      default:
        return baseMessage;
    }
  };

  const handleWhatsAppContact = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = ownerWhatsapp || ownerPhone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailContact = () => {
    const subject = `Inquiry for ${warehouseName} - ${warehouseLocation}`;
    const body = generateWhatsAppMessage();
    const emailUrl = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
  };

  const handlePhoneContact = () => {
    window.open(`tel:${ownerPhone}`, '_self');
  };

  const InquiryTypeCard = ({ type, title, description, icon: Icon, isSelected, onClick }: {
    type: string;
    title: string;
    description: string;
    icon: any;
    isSelected: boolean;
    onClick: () => void;
  }) => (
    <Card 
      className={`cursor-pointer transition-all border-gray-600 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-900/30 border-blue-500' : 'bg-gray-800/50 hover:bg-gray-700/50 hover:border-gray-500'}`}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        <Icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
        <h3 className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-200'}`}>{title}</h3>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader className="border-b border-gray-700 pb-4">
          <DialogTitle className="flex items-center space-x-2 text-white">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Send Inquiry to Warehouse Owner</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose your inquiry type and contact the owner directly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Warehouse Info */}
          <Card className="bg-gray-800/80 border-gray-700">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-white">{warehouseName}</h3>
                  <p className="text-gray-400 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {warehouseLocation}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-blue-400 font-semibold">₹{pricePerSqFt}/sq ft</span>
                    <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-700">{availableArea.toLocaleString()} sq ft available</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inquiry Type Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block text-gray-200">Select Inquiry Type</Label>
            <div className="grid grid-cols-3 gap-3">
              <InquiryTypeCard
                type="general"
                title="General Inquiry"
                description="Get more information"
                icon={MessageSquare}
                isSelected={inquiryType === "general"}
                onClick={() => setInquiryType("general")}
              />
              <InquiryTypeCard
                type="booking"
                title="Instant Booking"
                description="Reserve space now"
                icon={Clock}
                isSelected={inquiryType === "booking"}
                onClick={() => setInquiryType("booking")}
              />
              <InquiryTypeCard
                type="partnership"
                title="Business Partnership"
                description="Long-term collaboration"
                icon={Calculator}
                isSelected={inquiryType === "partnership"}
                onClick={() => setInquiryType("partnership")}
              />
            </div>
          </div>

          {/* Contact Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">Your Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@company.com"
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-gray-300">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="company" className="text-gray-300">Company Name</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="Your company name"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {inquiryType === "booking" && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="requiredSpace" className="text-gray-300">Required Space (sq ft) *</Label>
                  <Input
                    id="requiredSpace"
                    type="number"
                    value={formData.requiredSpace}
                    onChange={(e) => handleInputChange("requiredSpace", e.target.value)}
                    placeholder="1000"
                    required
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="duration" className="text-gray-300">Duration (months) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    placeholder="6"
                    required
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate" className="text-gray-300">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {inquiryType === "partnership" && (
              <div>
                <Label htmlFor="requiredSpace" className="text-gray-300">Required Space (sq ft)</Label>
                <Input
                  id="requiredSpace"
                  type="number"
                  value={formData.requiredSpace}
                  onChange={(e) => handleInputChange("requiredSpace", e.target.value)}
                  placeholder="5000"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <Label htmlFor="message" className="text-gray-300">
                {inquiryType === "partnership" ? "Partnership Details" : "Additional Message"}
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                placeholder={
                  inquiryType === "general" 
                    ? "Any specific requirements or questions..."
                    : inquiryType === "booking"
                    ? "Special requirements, access needs, etc..."
                    : "Partnership type, business model, requirements..."
                }
                rows={4}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Contact Options */}
          <div className="border-t border-gray-700 pt-6">
            <Label className="text-base font-semibold mb-4 block text-gray-200">Contact Owner</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={handleWhatsAppContact}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-900/30"
                disabled={!formData.name || !formData.email || !formData.phone}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button 
                variant="outline"
                onClick={handleEmailContact}
                disabled={!formData.name || !formData.email || !formData.phone}
                className="border-gray-600 text-gray-200 hover:bg-gray-800 hover:border-blue-500 hover:text-blue-400"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button 
                variant="outline"
                onClick={handlePhoneContact}
                className="border-gray-600 text-gray-200 hover:bg-gray-800 hover:border-blue-500 hover:text-blue-400"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </div>
          </div>

          {/* Cost Estimate for Booking */}
          {inquiryType === "booking" && formData.requiredSpace && formData.duration && (
            <Card className="bg-gray-800/80 border-blue-900/50">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-t-lg">
                <CardTitle className="text-sm bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Cost Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Monthly Rent:</span>
                    <span className="font-medium text-white">₹{(parseInt(formData.requiredSpace) * pricePerSqFt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Duration:</span>
                    <span className="font-medium text-white">{formData.duration} month(s)</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-700">
                    <span className="text-gray-200">Total Cost:</span>
                    <span className="text-green-400">
                      ₹{(parseInt(formData.requiredSpace) * pricePerSqFt * parseInt(formData.duration)).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    *Estimated cost. Final pricing may include additional charges for utilities, security deposit, etc.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Owner Info */}
          <Card className="bg-gray-800/80 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <h4 className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{ownerName}</h4>
                <p className="text-sm text-gray-400">Property Owner</p>
                <div className="flex justify-center items-center space-x-4 mt-2 text-sm">
                  <span className="flex items-center text-green-400">
                    <Clock className="h-3 w-3 mr-1" />
                    Usually responds within 2 hours
                  </span>
                  <Badge variant="secondary" className="bg-green-900/50 text-green-400 border-green-700">
                    ✓ Verified
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
