import React from 'react';
import { Navbar } from '@/components/Navbar';
import { SmartBookingAssistant } from '@/components/SmartBookingAssistant';
import { useNavigate } from 'react-router-dom';
import { SmartBookingOption } from '@/services/smartBookingService';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Zap, Layers, TrendingDown, Shield } from 'lucide-react';

export default function SmartBooking() {
  const navigate = useNavigate();

  const handleBookingSelect = (option: SmartBookingOption) => {
    // Navigate to the first warehouse in the booking option
    if (option.warehouses.length > 0) {
      const firstWarehouse = option.warehouses[0];
      navigate(`/warehouses/${firstWarehouse.id}`, {
        state: {
          smartBooking: option,
          preSelectedBlocks: firstWarehouse.blocks.map(b => b.blockNumber)
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Powered by Advanced AI
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Smart Warehouse Booking
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Our AI analyzes 10,000+ warehouses to find the perfect match for your needs.
            It can even combine spaces from multiple warehouses for optimal pricing!
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
              LLM-Powered Analysis
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <Layers className="w-4 h-4 mr-2 text-blue-500" />
              Multi-Warehouse Merging
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <TrendingDown className="w-4 h-4 mr-2 text-green-500" />
              Cost Optimization
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <Zap className="w-4 h-4 mr-2 text-orange-500" />
              Instant Results
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <Shield className="w-4 h-4 mr-2 text-purple-500" />
              Verified Warehouses
            </Badge>
          </div>
        </div>

        {/* Smart Booking Assistant */}
        <div className="max-w-5xl mx-auto">
          <SmartBookingAssistant onBookingSelect={handleBookingSelect} />
        </div>

        {/* How It Works Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How Smart Booking Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Tell Us Your Needs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter your space requirements, location, and budget. You can use natural language like "I need 400 sq ft in Thane with low budget".
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">AI Analyzes Options</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Our LLM analyzes thousands of warehouses, finds matching blocks, and can even combine spaces from multiple warehouses for better pricing.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Book Instantly</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose your preferred option and book instantly. See exactly which blocks you're getting, total costs, and potential savings.
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-16 max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Perfect For</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">📦</span>
              </div>
              <div>
                <h4 className="font-medium">Small Businesses</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Need just 200-500 sq ft? Our AI finds the most affordable blocks across warehouses.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">🚀</span>
              </div>
              <div>
                <h4 className="font-medium">Growing Startups</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scale up easily by combining spaces from multiple locations as you grow.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">💰</span>
              </div>
              <div>
                <h4 className="font-medium">Budget-Conscious</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Save money by letting AI find the cheapest combination of blocks for your needs.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">⚡</span>
              </div>
              <div>
                <h4 className="font-medium">Urgent Needs</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get instant recommendations without spending hours searching manually.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
