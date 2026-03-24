import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Loader2, Sparkles, TrendingUp, CheckCircle2, Info } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Card, CardContent } from './ui/card';
import { supabase } from '@/lib/supabase';
import { getAIResponse } from '@/services/aiService';

interface PricingRecommendationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAcceptPrice: (price: number) => void;
    warehouseData?: {
        city: string;
        district?: string;
        warehouse_type?: string;
        total_area: number;
        amenities?: string[];
    };
}

interface RecommendationResult {
    recommended_price: number;
    min_price: number;
    max_price: number;
    nearby_avg: number;
    confidence: number;
    demand_score: number;
    reasoning: string[];
    market_data: {
        city: string;
        district: string;
        nearby_warehouses_analyzed: number;
        base_rate: number;
    };
    ai_insight?: string;
}

export function PricingRecommendationModal({
    isOpen,
    onClose,
    onAcceptPrice,
    warehouseData,
}: PricingRecommendationModalProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<RecommendationResult | null>(null);
    const { toast } = useToast();

    const fetchRecommendation = React.useCallback(async () => {
        if (!warehouseData) return;

        setLoading(true);
        try {
            const city = warehouseData.city?.trim();
            if (!city) {
                throw new Error('City is required for pricing analysis');
            }

            const { data: nearby, error } = await supabase
                .from('warehouses')
                .select('price_per_sqft, occupancy, city, district, warehouse_type')
                .ilike('city', `%${city}%`)
                .limit(200);

            if (error) {
                throw error;
            }

            const samples = (nearby || []).filter(w => w.price_per_sqft && w.price_per_sqft > 0);
            const analyzedCount = samples.length;
            const avgPrice = analyzedCount
                ? Math.round(samples.reduce((sum, w) => sum + (w.price_per_sqft || 0), 0) / analyzedCount)
                : 45;

            const avgOccupancyRaw = analyzedCount
                ? samples.reduce((sum, w) => sum + (w.occupancy || 0), 0) / analyzedCount
                : 0.6;
            const avgOccupancy = avgOccupancyRaw > 1 ? avgOccupancyRaw / 100 : avgOccupancyRaw;

            const demandScore = Math.min(10, Math.max(1, Math.round(avgOccupancy * 10)));
            const amenityBoost = (warehouseData.amenities?.length || 0) >= 6 ? 1.08 : 1.03;
            const typeBoost = /cold|pharma|temperature/i.test(warehouseData.warehouse_type || '') ? 1.12 : 1.0;
            const size = warehouseData.total_area || 0;
            const sizeBoost = size >= 50000 ? 0.95 : size >= 20000 ? 0.98 : size <= 5000 ? 1.05 : 1.0;

            const baseRate = Math.round(avgPrice * typeBoost * amenityBoost * sizeBoost);
            const recommended = Math.max(10, baseRate);
            const minPrice = Math.max(10, Math.round(recommended * 0.9));
            const maxPrice = Math.round(recommended * 1.1);

            let reasoning: string[] = [
                `Nearby average pricing in ${city} is around ₹${avgPrice}/sq ft`,
                `Demand score is ${demandScore}/10 based on local occupancy`,
            ];

            if (typeBoost > 1) {
                reasoning.push('Specialized storage type typically commands a premium');
            }

            if (amenityBoost > 1.03) {
                reasoning.push('Amenities and facility features justify a higher rate');
            }

            let aiInsight = '';
            try {
                const prompt = `Explain this warehouse pricing suggestion for an owner in 2-3 sentences.

City: ${city}
Warehouse Type: ${warehouseData.warehouse_type || 'General'}
Total Area: ${warehouseData.total_area} sq ft
Nearby Avg Price: ₹${avgPrice}/sq ft
Suggested Range: ₹${minPrice} - ₹${maxPrice}/sq ft
Demand Score: ${demandScore}/10
Amenities: ${(warehouseData.amenities || []).join(', ') || 'None'}

Return JSON:
{ "insight": "..." }`;

                const response = await getAIResponse({
                    prompt,
                    systemPrompt: 'You create concise business-friendly pricing insights for warehouse owners. Return JSON only.',
                    temperature: 0.3,
                    maxTokens: 200
                });

                const jsonMatch = response.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed?.insight) {
                        aiInsight = parsed.insight;
                    }
                }
            } catch (llmError) {
                console.warn('Pricing insight LLM failed:', llmError);
            }

            if (aiInsight) {
                reasoning = [aiInsight, ...reasoning];
            }

            setResult({
                recommended_price: recommended,
                min_price: minPrice,
                max_price: maxPrice,
                nearby_avg: avgPrice,
                confidence: analyzedCount > 25 ? 0.82 : 0.65,
                demand_score: demandScore,
                reasoning,
                market_data: {
                    city,
                    district: warehouseData.district || city,
                    nearby_warehouses_analyzed: analyzedCount,
                    base_rate: avgPrice
                },
                ai_insight: aiInsight
            });
        } catch (error) {
            console.error('Pricing recommendation error:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch pricing recommendation',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [warehouseData, toast]);

    React.useEffect(() => {
        if (isOpen && warehouseData && !result) {
            fetchRecommendation();
        }
    }, [isOpen, warehouseData, result, fetchRecommendation]);

    const handleAccept = () => {
        if (result) {
            onAcceptPrice(result.recommended_price);
            onClose();
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-green-600';
        if (confidence >= 0.6) return 'text-yellow-600';
        return 'text-orange-600';
    };

    const getDemandColor = (score: number) => {
        if (score >= 8) return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
        if (score >= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        LLM-Powered Pricing Recommendation
                    </DialogTitle>
                    <DialogDescription>
                        Get AI-suggested pricing based on market analysis and competitor data
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-gray-600">Analyzing market data...</p>
                    </div>
                ) : result ? (
                    <div className="space-y-6">
                        {/* Recommended Price */}
                        <Card className="border-2 border-primary">
                            <CardContent className="pt-6">
                                <div className="text-center space-y-2">
                                    <p className="text-sm text-gray-600">Recommended Price</p>
                                    <div className="text-4xl font-bold text-primary">
                                        ₹{result.recommended_price}
                                        <span className="text-lg text-gray-500">/sqft/month</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                        <span>Range: ₹{result.min_price} - ₹{result.max_price}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Info className="h-4 w-4" />
                                        <span className={getConfidenceColor(result.confidence)}>
                                            {Math.round(result.confidence * 100)}% confidence
                                        </span>
                                    </div>
                                    <div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDemandColor(result.demand_score)}`}>
                                            Demand: {result.demand_score}/10
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Market Comparison */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-1">Nearby Average</p>
                                        <p className="text-2xl font-bold">₹{result.nearby_avg}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {result.market_data.nearby_warehouses_analyzed} warehouses analyzed
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-1">Base City Rate</p>
                                        <p className="text-2xl font-bold">₹{result.market_data.base_rate}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {result.market_data.city}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* AI Reasoning */}
                        <Card>
                            <CardContent className="pt-6">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Why this price?
                                </h4>
                                <ul className="space-y-2">
                                    {result.reasoning.map((reason, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>{reason}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button onClick={handleAccept} className="flex-1">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Accept Recommended Price
                            </Button>
                            <Button onClick={onClose} variant="outline" className="flex-1">
                                Customize Manually
                            </Button>
                        </div>

                        {/* Disclaimer */}
                        <p className="text-xs text-gray-500 text-center">
                            <Info className="h-3 w-3 inline mr-1" />
                            This is an AI-generated suggestion. You can customize the final price.
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Unable to load pricing recommendation</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
