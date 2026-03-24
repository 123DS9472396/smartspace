import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Sparkles, 
  MapPin, 
  DollarSign, 
  Maximize, 
  Building2, 
  Zap, 
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Layers,
  MessageSquare,
  Search,
  ArrowRight,
  Star,
  Package
} from 'lucide-react';
import { smartBookingService, BookingRequirement, BookingAnalysis, SmartBookingOption, WarehouseResult } from '@/services/smartBookingService';
import { DEFAULT_GOODS_TYPES, GOODS_TYPES_BY_WAREHOUSE, WAREHOUSE_TYPES } from '@/data/warehouseTaxonomy';
import { cn } from '@/lib/utils';

interface SmartBookingAssistantProps {
  onBookingSelect?: (option: SmartBookingOption) => void;
  className?: string;
}

export function SmartBookingAssistant({ onBookingSelect, className }: SmartBookingAssistantProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'chat'>('form');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<BookingAnalysis | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string; warehouses?: WarehouseResult[] }>>([]);
  
  // Form state
  const [formData, setFormData] = useState<BookingRequirement>({
    requiredSpace: 1000,
    location: '',
    maxBudget: undefined,
    preferredType: '',
    goodsType: '',
    duration: 1,
    urgency: 'medium',
    flexibleLocation: false,
    flexibleSpace: true
  });

  const getWarehouseTypeKey = (value?: string) => {
    if (!value) return undefined;
    const match = WAREHOUSE_TYPES.find(type => type.toLowerCase() === value.toLowerCase())
      || WAREHOUSE_TYPES.find(type => type.toLowerCase().includes(value.toLowerCase()));
    return match;
  };

  const goodsOptions = (() => {
    const key = getWarehouseTypeKey(formData.preferredType);
    if (key && GOODS_TYPES_BY_WAREHOUSE[key]) return GOODS_TYPES_BY_WAREHOUSE[key];
    return DEFAULT_GOODS_TYPES;
  })();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location) return;
    
    setIsAnalyzing(true);
    try {
      const result = await smartBookingService.analyzeBookingRequirements(formData);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setIsAnalyzing(true);
    try {
      const result = await smartBookingService.processNaturalLanguageBooking(userMessage);
      setChatHistory(prev => [...prev, { role: 'assistant', content: result.response, warehouses: result.warehouses }]);
      if (result.analysis) {
        setAnalysis(result.analysis);
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderOption = (option: SmartBookingOption, index: number) => {
    const isBest = index === 0;
    
    return (
      <Card 
        key={option.id} 
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg",
          isBest && "ring-2 ring-blue-500 dark:ring-blue-400"
        )}
        onClick={() => onBookingSelect?.(option)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isBest && (
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <Star className="w-3 h-3 mr-1" /> Best Match
                </Badge>
              )}
              <Badge variant={option.type === 'merged' ? 'secondary' : 'outline'}>
                {option.type === 'merged' ? (
                  <><Layers className="w-3 h-3 mr-1" /> Multi-Warehouse</>
                ) : (
                  <><Building2 className="w-3 h-3 mr-1" /> Single</>
                )}
              </Badge>
            </div>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {option.matchScore}%
            </span>
          </div>
          <CardTitle className="text-lg mt-2">
            {option.warehouses.map(w => w.name).join(' + ')}
          </CardTitle>
          <CardDescription>
            {option.warehouses.map(w => w.city).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Space</p>
              <p className="font-semibold">{option.totalArea.toLocaleString()} sq ft</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Cost</p>
              <p className="font-semibold">₹{option.totalMonthlyCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Price</p>
              <p className="font-semibold">₹{option.averagePricePerSqft}/sq ft</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Blocks</p>
              <p className="font-semibold">
                {option.warehouses.reduce((sum, w) => sum + w.blocks.length, 0)} blocks
              </p>
            </div>
          </div>
          
          {option.savings && option.savings > 0 && (
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg mb-3">
              <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                Save ₹{option.savings.toLocaleString()}/month with this option!
              </span>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {option.pros.map((pro, i) => (
                <Badge key={i} variant="outline" className="text-xs text-green-600 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {pro}
                </Badge>
              ))}
            </div>
            {option.cons.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {option.cons.map((con, i) => (
                  <Badge key={i} variant="outline" className="text-xs text-amber-600 border-amber-200">
                    <AlertCircle className="w-3 h-3 mr-1" /> {con}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 italic">
            <Brain className="w-4 h-4 inline mr-1" />
            {option.llmReasoning}
          </p>
          
          <Button className="w-full mt-4" onClick={() => onBookingSelect?.(option)}>
            Select This Option <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Smart Booking Assistant
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered warehouse space matching & optimization
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <Search className="w-4 h-4" /> Structured Search
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Natural Language
          </TabsTrigger>
        </TabsList>

        {/* Form-based search */}
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Enter Your Requirements</CardTitle>
              <CardDescription>
                Our AI will find the best warehouse options, including multi-warehouse combinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Location *
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g., Thane, Mumbai, Pune"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="space" className="flex items-center gap-2">
                      <Maximize className="w-4 h-4" /> Required Space (sq ft) *
                    </Label>
                    <Input
                      id="space"
                      type="number"
                      min={100}
                      value={formData.requiredSpace}
                      onChange={(e) => setFormData(prev => ({ ...prev, requiredSpace: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Max Budget (₹/sq ft/month)
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      min={10}
                      placeholder="Optional"
                      value={formData.maxBudget || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        maxBudget: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Warehouse Type
                    </Label>
                    <Input
                      id="type"
                      list="warehouse-type-list"
                      placeholder="e.g., Cold Storage, General"
                      value={formData.preferredType || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredType: e.target.value }))}
                    />
                    <datalist id="warehouse-type-list">
                      {WAREHOUSE_TYPES.map(option => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Choose a type to see relevant goods suggestions below.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goods" className="flex items-center gap-2">
                      <Package className="w-4 h-4" /> Goods Type (auto-maps to warehouse type)
                    </Label>
                    <Input
                      id="goods"
                      list="goods-type-list"
                      placeholder="e.g., Vaccines, Dairy, Electronics"
                      value={formData.goodsType || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, goodsType: e.target.value }))}
                    />
                    <datalist id="goods-type-list">
                      {goodsOptions.map(option => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                    <div className="flex flex-wrap gap-2">
                      {goodsOptions.slice(0, 6).map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, goodsType: option }))}
                          className="rounded-full border border-slate-300/60 dark:border-slate-700 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Goods type helps auto-select the right warehouse category.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Allow Multi-Warehouse Booking
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Combine spaces from multiple warehouses for better pricing
                      </p>
                    </div>
                    <Switch
                      checked={formData.flexibleSpace}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, flexibleSpace: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Flexible on Location
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Consider nearby areas if limited options
                      </p>
                    </div>
                    <Switch
                      checked={formData.flexibleLocation}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, flexibleLocation: checked }))}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isAnalyzing || !formData.location}>
                  {isAnalyzing ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      AI is analyzing options...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Find Smart Booking Options
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat-based search */}
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Tell us what you need</CardTitle>
              <CardDescription>
                Describe your requirements in natural language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] mb-4 p-4 border rounded-lg">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Start a conversation</p>
                    <p className="text-sm mt-2">Try saying:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>"I need 400 sq ft in Thane with low budget"</li>
                      <li>"Find cold storage in Mumbai, around 5000 sq ft"</li>
                      <li>"Looking for warehouse space in Pune under ₹50/sq ft"</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatHistory.map((msg, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "p-3 rounded-lg",
                          msg.role === 'user' 
                            ? "bg-blue-100 dark:bg-blue-900/30 ml-8" 
                            : "bg-gray-100 dark:bg-gray-800 mr-8"
                        )}
                      >
                        <p className="text-sm font-medium mb-1">
                          {msg.role === 'user' ? 'You' : '🤖 Smart Assistant'}
                        </p>
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        {msg.role === 'assistant' && msg.warehouses && msg.warehouses.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.warehouses.map((w, idx) => {
                              const rankEmoji = ['🥇','🥈','🥉','4️⃣','5️⃣'][idx] ?? `${idx+1}.`;
                              return (
                                <div key={w.id} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold flex items-center gap-1">
                                        <span>{rankEmoji}</span>
                                        <span className="truncate">{w.name}</span>
                                        {w.matchScore ? (
                                          <span className="ml-1 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full">
                                            {w.matchScore}%
                                          </span>
                                        ) : null}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        📍 {w.city}
                                        {w.total_area ? ` · ${w.total_area.toLocaleString()} sq ft` : ''}
                                        {` · ₹${w.price_per_sqft}/sqft`}
                                        {w.warehouse_type ? ` · ${w.warehouse_type}` : ''}
                                        {w.rating ? ` · ⭐ ${w.rating}` : ''}
                                      </p>
                                      {w.reason && (
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic">💬 {w.reason}</p>
                                      )}
                                    </div>
                                    <Link
                                      to={`/warehouses/${w.id}`}
                                      className="flex-shrink-0 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                                    >
                                      View &amp; Book <ArrowRight className="w-3 h-3" />
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                    {isAnalyzing && (
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mr-8 animate-pulse">
                        <p className="text-sm">🧠 Analyzing your request...</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <Input
                  placeholder="Describe your warehouse needs..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isAnalyzing}
                />
                <Button type="submit" disabled={isAnalyzing || !chatInput.trim()}>
                  <Sparkles className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {analysis && analysis.options.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              AI-Optimized Booking Options
            </h3>
            <Badge variant="outline">
              {analysis.options.length} options found
            </Badge>
          </div>
          
          {/* AI Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">AI Analysis</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {analysis.llmSummary}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    📊 {analysis.marketInsights}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Options Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analysis.options.slice(0, 6).map((option, i) => renderOption(option, i))}
          </div>
          
          {/* Alternative Suggestions */}
          {analysis.alternativeSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Alternative Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.alternativeSuggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-blue-500">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default SmartBookingAssistant;
