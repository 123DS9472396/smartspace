export const INQUIRY_MESSAGES = {
  general: {
    title: "General Inquiry",
    description: "Get more information about the warehouse",
    template: (warehouse: any, formData: any) => `Hi! I'm interested in your warehouse listed on SmartWarehouse:

🏢 Property: ${warehouse.name}
📍 Location: ${warehouse.location}
💰 Price: ₹${warehouse.pricePerSqFt}/sq ft

I would like to know more details about this warehouse. Could you please share more information?

Contact Details:
👤 Name: ${formData.name}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone}${formData.company ? `\n🏢 Company: ${formData.company}` : ''}

${formData.message ? `\nAdditional Notes:\n${formData.message}` : ''}

Thank you!`
  },
  
  booking: {
    title: "Instant Booking",
    description: "Reserve warehouse space immediately",
    template: (warehouse: any, formData: any) => {
      const totalCost = formData.requiredSpace && formData.duration 
        ? parseInt(formData.requiredSpace) * warehouse.pricePerSqFt * parseInt(formData.duration)
        : 0;
      
      return `Hi! I want to book your warehouse on SmartWarehouse:

🏢 Property: ${warehouse.name}
📍 Location: ${warehouse.location}
💰 Price: ₹${warehouse.pricePerSqFt}/sq ft

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
    }
  },
  
  partnership: {
    title: "Business Partnership",
    description: "Long-term business collaboration opportunities",
    template: (warehouse: any, formData: any) => `Hi! Partnership Inquiry for your warehouse:

🏢 Property: ${warehouse.name}
📍 Location: ${warehouse.location}
💰 Price: ₹${warehouse.pricePerSqFt}/sq ft

We're expanding our operations and need:
📍 Location: ${warehouse.location}
📐 Space: ${formData.requiredSpace || 'To be discussed'} sq ft
🤝 Partnership Type: Long-term business collaboration

Company Details:
🏢 Company: ${formData.company}
👤 Contact Person: ${formData.name}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone}

${formData.message ? `\nPartnership Details:\n${formData.message}` : ''}

Looking forward to discussing this opportunity.`
  },

  quickCommerce: {
    title: "Quick Commerce",
    description: "Fast delivery & logistics partnership",
    template: (warehouse: any, formData: any) => `🚀 Quick Commerce Partnership Inquiry:

We're expanding our quick delivery operations and need:

📍 Location: ${warehouse.location}
📐 Space: ${formData.requiredSpace || '1000'} sq ft
⚡ Requirement: 10-minute delivery zone
🕐 Operations: 24/7 access needed

Company Details:
🏢 Company: ${formData.company}
👤 Contact Person: ${formData.name}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone}

Looking for immediate partnership opportunities.`
  }
};

export const CONTACT_METHODS = {
  whatsapp: {
    label: "WhatsApp",
    color: "green",
    icon: "MessageSquare"
  },
  call: {
    label: "Call Now",
    color: "blue", 
    icon: "Phone"
  },
  email: {
    label: "Email",
    color: "gray",
    icon: "Mail"
  }
};
