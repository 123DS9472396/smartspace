import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Phone, Mail, Clock, X } from "lucide-react";

interface QuickContactWidgetProps {
  warehouseName: string;
  location: string;
  price: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  whatsappNumber: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function QuickContactWidget({
  warehouseName,
  location,
  price,
  ownerName,
  ownerPhone,
  ownerEmail,
  whatsappNumber,
  isVisible,
  onClose
}: QuickContactWidgetProps) {
  if (!isVisible) return null;

  const handleWhatsAppContact = () => {
    const message = `Hi! I'm interested in your warehouse listed on SmartWarehouse:

🏢 Property: ${warehouseName}
📍 Location: ${location}
💰 Price: ₹${price}/sq ft

Could you please share more details about availability and features?

Thank you!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailContact = () => {
    const subject = `Inquiry for ${warehouseName} - ${location}`;
    const body = `Hi ${ownerName},

I'm interested in your warehouse listed on SmartWarehouse:

Property: ${warehouseName}
Location: ${location}
Price: ₹${price}/sq ft

Could you please share more details about:
- Available space and minimum lease terms
- Additional facilities and amenities
- Viewing schedule
- Any special requirements

Looking forward to hearing from you.

Best regards`;
    
    const emailUrl = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
  };

  const handlePhoneContact = () => {
    window.open(`tel:${ownerPhone}`, '_self');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <Card className="w-80 shadow-lg border-2 border-blue-200 bg-white">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-sm text-gray-900">{warehouseName}</h3>
              <p className="text-xs text-gray-600">{location}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-blue-600 font-semibold text-sm">₹{price}/sq ft</span>
                <Badge variant="secondary" className="text-xs">Quick Contact</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Quick Response
              </span>
              <span className="text-green-600 font-medium">Owner: {ownerName}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Button 
                size="sm" 
                onClick={handleWhatsAppContact}
                className="bg-green-600 hover:bg-green-700 text-white text-xs"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                WhatsApp
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePhoneContact}
                className="text-xs"
              >
                <Phone className="h-3 w-3 mr-1" />
                Call
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEmailContact}
                className="text-xs"
              >
                <Mail className="h-3 w-3 mr-1" />
                Email
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              Connect instantly with verified warehouse owners
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
