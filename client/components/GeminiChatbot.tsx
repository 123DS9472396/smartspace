import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, X, Bot, User, Minimize2, Maximize2, RefreshCw, Sparkles, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getChatbotResponse, getAIResponse } from '@/services/aiService';
import { warehouseService } from '@/services/warehouseService';
import { smartBookingService } from '@/services/smartBookingService';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  provider?: string;
  model?: string;
}

interface ChatbotProps {
  className?: string;
}

export function GeminiChatbot({ className = '' }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hi! I\'m your AI assistant for SmartSpace Warehouse powered by Claude 3.5 Sonnet. I can help you find the perfect warehouse, answer questions about facilities, pricing, and more. How can I help you today?',
      timestamp: new Date(),
      provider: 'AI Assistant',
      model: 'Multiple LLMs'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Simulated Gemini AI responses based on warehouse context
  const generateGeminiResponse = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const message = userMessage.toLowerCase();

    // Check if user is asking for specific warehouse listings
    if (message.includes('show') || message.includes('list') || message.includes('find') || message.includes('warehouses in')) {
      // Extract location if mentioned
      const maharashtraCities = ['mumbai', 'pune', 'nashik', 'aurangabad', 'thane', 'solapur', 'kolhapur', 'sangli', 'satara', 'amravati', 'akola', 'nanded', 'latur', 'dhule'];
      const mentionedCity = maharashtraCities.find(city => message.includes(city));

      if (mentionedCity) {
        // Generate realistic warehouse data based on the city
        const cityCapitalized = mentionedCity.charAt(0).toUpperCase() + mentionedCity.slice(1);
        const basePrice = mentionedCity === 'mumbai' ? 80 : mentionedCity === 'pune' ? 70 : 60;
        const warehouseCount = mentionedCity === 'mumbai' ? 25000 : mentionedCity === 'pune' ? 18000 : 12000;

        return `Here are **TOP VERIFIED WAREHOUSES** available in **${cityCapitalized}** right now:\n\n**🏢 PREMIUM LISTINGS:**\n\n**1. ${cityCapitalized} Logistics Hub**\n📍 Location: ${cityCapitalized} Industrial Area\n📐 Total Size: ${(Math.random() * 30000 + 40000).toFixed(0)} sq ft\n💰 Price: ₹${basePrice + Math.floor(Math.random() * 15)}/sq ft/month\n✅ Available: ${(Math.random() * 30 + 60).toFixed(0)}%\n⭐ Rating: ${(Math.random() * 0.8 + 4.2).toFixed(1)}/5\n🚚 Features: 24/7 Security, Loading Dock, Climate Control\n\n**2. Smart Storage ${cityCapitalized}**\n📍 Location: ${cityCapitalized} Highway Belt\n📐 Total Size: ${(Math.random() * 25000 + 30000).toFixed(0)} sq ft\n💰 Price: ₹${basePrice + Math.floor(Math.random() * 10) - 5}/sq ft/month\n✅ Available: ${(Math.random() * 40 + 50).toFixed(0)}%\n⭐ Rating: ${(Math.random() * 0.6 + 4.0).toFixed(1)}/5\n🚚 Features: Power Backup, Fire Safety, CCTV\n\n**3. Metro Warehouse Complex**\n📍 Location: ${cityCapitalized} MIDC Area\n📐 Total Size: ${(Math.random() * 40000 + 50000).toFixed(0)} sq ft\n💰 Price: ₹${basePrice + Math.floor(Math.random() * 20)}/sq ft/month\n✅ Available: ${(Math.random() * 35 + 45).toFixed(0)}%\n⭐ Rating: ${(Math.random() * 0.7 + 4.1).toFixed(1)}/5\n🚚 Features: Rail Access, Container Yard, Office Space\n\n**� ${cityCapitalized} Market Summary:**\n• Total Warehouses: ${warehouseCount.toLocaleString()}+\n• Price Range: ₹${basePrice - 10}-${basePrice + 20}/sq ft\n• Average Availability: 65%\n• Popular Areas: Industrial Belt, Highway Zone, MIDC\n\n**🎯 RECOMMENDED ACTION:**\n1. Visit our "Find Warehouses" page\n2. Filter by "${cityCapitalized}" location  \n3. Set your area & budget preferences\n4. Contact directly for site visits\n\n*These are real-time listings. Availability changes rapidly!*`;
      }

      return `**🔍 MAHARASHTRA WAREHOUSE SEARCH**\n\nI can help you find warehouses! Here are our **LIVE INVENTORY HIGHLIGHTS**:\n\n**�️ TOP CITIES & AVAILABILITY:**\n\n• **MUMBAI** - 25,000+ warehouses\n  Price: ₹70-100/sq ft | High demand area\n  \n• **PUNE** - 18,000+ warehouses  \n  Price: ₹60-90/sq ft | IT & Manufacturing hub\n  \n• **NASHIK** - 12,000+ warehouses\n  Price: ₹50-75/sq ft | Wine & Agriculture center\n  \n• **AURANGABAD** - 15,000+ warehouses\n  Price: ₹55-80/sq ft | Industrial corridor\n  \n• **THANE** - 20,000+ warehouses\n  Price: ₹65-95/sq ft | Mumbai metro area\n\n**� CURRENT MARKET STATUS:**\n✅ 150,000+ verified warehouses\n✅ 13.2B+ sq ft total capacity  \n✅ 65% average availability\n✅ ₹25-150/sq ft price range\n\n**💡 PRO TIP:** Type something like:\n• "Show warehouses in Mumbai"\n• "Find storage in Pune under ₹70"\n• "List warehouses in Nashik with 50000 sqft"\n\n**Which city are you interested in?** 🎯`;
    }

    // Warehouse-specific responses
    if (message.includes('warehouse') || message.includes('storage')) {
      if (message.includes('price') || message.includes('cost') || message.includes('pricing')) {
        return 'Based on our Maharashtra warehouse database, prices typically range from ₹25-150 per sq ft per month. Factors affecting pricing include:\n\n• Location (Mumbai/Pune are premium)\n• Warehouse size and specifications\n• Available amenities (climate control, security, etc.)\n• Occupancy rates and availability\n\nWould you like me to help you find warehouses within a specific budget range?';
      }

      if (message.includes('location') || message.includes('city') || message.includes('district')) {
        return 'Our database covers all major districts in Maharashtra including:\n\n• **Mumbai** - Premium logistics hub (25K+ warehouses)\n• **Pune** - IT and manufacturing center (18K+ warehouses)\n• **Nashik** - Agricultural and wine region (12K+ warehouses)\n• **Aurangabad** - Industrial corridor (15K+ warehouses)\n• **Thane** - Mumbai metropolitan area (20K+ warehouses)\n• **Kolhapur** - Sugar and textile hub (8K+ warehouses)\n\nEach location offers different advantages. Which area interests you most?';
      }

      if (message.includes('size') || message.includes('area') || message.includes('capacity')) {
        return 'Our warehouses range from small-scale to mega facilities:\n\n• **Small**: 5,000-25,000 sq ft (500-2,500 MT)\n• **Medium**: 25,000-100,000 sq ft (2,500-10,000 MT)\n• **Large**: 100,000-500,000 sq ft (10,000-50,000 MT)\n• **Mega**: 500,000+ sq ft (50,000+ MT)\n\nWhat size range would work best for your business?';
      }

      if (message.includes('amenities') || message.includes('features') || message.includes('facilities')) {
        return 'Common warehouse amenities in our network include:\n\n• **Security**: 24/7 surveillance, access control\n• **Climate**: Temperature/humidity control\n• **Loading**: Multiple dock doors, ramps\n• **Technology**: WMS integration, RFID tracking\n• **Certifications**: FDA, FSSAI, pharmaceutical grade\n• **Services**: Material handling, inventory management\n\nAny specific amenities you\'re looking for?';
      }

      return 'I can help you find the perfect warehouse in Maharashtra! Our platform has detailed information on 150,000+ verified facilities. What specific requirements do you have? (location, size, budget, special features, etc.)';
    }

    if (message.includes('ai') || message.includes('recommendation') || message.includes('suggest')) {
      return 'Our AI recommendation system uses advanced machine learning to match you with optimal warehouses based on:\n\n• **Your preferences** (location, budget, size)\n• **Business type** and industry requirements\n• **Similar user choices** (collaborative filtering)\n• **Market trends** and availability patterns\n\nTry our ML Recommendations tab in the warehouse browser for personalized suggestions!';
    }

    if (message.includes('contact') || message.includes('support') || message.includes('help')) {
      return 'I\'m here to help! For additional support:\n\n• **Chat with me** - Ask any warehouse-related questions\n• **Browse our database** - Use filters to find specific warehouses\n• **ML Recommendations** - Get personalized suggestions\n• **Contact form** - Reach our human experts\n• **Phone**: +91-XXXX-XXXXXX\n• **Email**: support@smartspace.com\n\nWhat would you like to know more about?';
    }

    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return 'Hello! Welcome to SmartSpace Warehouse platform. I\'m your AI assistant powered by Gemini. I can help you:\n\n• Find warehouses by location, size, or budget\n• Show specific warehouse listings\n• Explain pricing and amenities\n• Provide market insights\n• Guide you through our platform\n\nWhat brings you here today?';
    }

    if (message.includes('thank') || message.includes('thanks')) {
      return 'You\'re welcome! I\'m always here to help with your warehouse needs. Feel free to ask me anything about our facilities, pricing, locations, or platform features. Have a great day! 😊';
    }

    // Default response for general queries
    return `I understand you're asking about "${userMessage}". As your warehouse AI assistant, I can help with:\n\n• **Finding warehouses** - Search by location, size, price\n• **Showing listings** - Get specific warehouse recommendations\n• **Pricing information** - Current market rates and trends\n• **Facility details** - Amenities, certifications, availability\n• **Platform guidance** - How to use our features effectively\n\nCould you please rephrase your question to be more specific about warehouses or our platform?`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    const loadingMessage: Message = {
      id: Date.now().toString() + '_loading',
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Check if this is a booking request (contains sq ft, space, book, need space, etc.)
      const bookingKeywords = ['sq ft', 'sqft', 'square feet', 'book', 'booking', 'need space', 'looking for space', 'require space', 'want space', 'rent space'];
      const isBookingRequest = bookingKeywords.some(keyword => inputMessage.toLowerCase().includes(keyword));
      
      let response: string;
      
      if (isBookingRequest) {
        // Use Smart Booking Service for intelligent multi-warehouse matching
        console.log('🧠 Detected booking request, using Smart Booking Service...');
        const bookingResult = await smartBookingService.processNaturalLanguageBooking(inputMessage);
        response = bookingResult.response;
      } else {
        // Use regular LLM chatbot for general queries
        response = await getChatbotResponse(inputMessage);
      }

      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.isLoading) {
          lastMessage.content = response;
          lastMessage.isLoading = false;
        }
        return newMessages;
      });
    } catch (error) {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.isLoading) {
          lastMessage.content = 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment or contact our support team for immediate assistance.';
          lastMessage.isLoading = false;
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: 'Chat cleared! How can I help you with warehouse solutions today?',
        timestamp: new Date()
      }
    ]);
  };

  // Quick suggestion buttons
  const quickSuggestions = [
    'Show warehouses in Mumbai',
    'What are the pricing ranges?',
    'Find warehouses with climate control',
    'Compare different locations'
  ];

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className={`w-96 transition-all duration-300 shadow-2xl border-0 ${isMinimized ? 'h-16' : 'h-[600px]'
        }`}>
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-full">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">SmartSpace AI Assistant</CardTitle>
                <CardDescription className="text-xs text-blue-100">
                  Powered by Gemini • Online
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-white hover:bg-white/20 p-1 h-auto"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[calc(600px-80px)]">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                      <div className={`p-2 rounded-full ${message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                        {message.type === 'user' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                      </div>
                      <div className={`p-3 rounded-2xl ${message.type === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                        }`}>
                        {message.isLoading ? (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                        )}
                        <span className={`text-xs opacity-70 mt-1 block ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Quick suggestions (show when no recent user messages) */}
                {messages.length === 1 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Quick suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickSuggestions.map((suggestion, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs py-1"
                          onClick={() => setInputMessage(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t dark:border-gray-700">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about warehouses, pricing, locations..."
                  className="flex-1 text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                AI responses may not always be accurate. Verify important information.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
