import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { Loader2, Calculator, TrendingUp, TrendingDown, Shield, Package } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface ProductCategory {
    name: string;
    products: Array<{
        product_type: string;
        current_price_per_kg: number;
        price_trend: string;
    }>;
}

interface CalculationResult {
    product_info: {
        product_type: string;
        product_category: string;
        market_price_per_kg: number;
        price_trend: string;
        quantity: number;
        unit: string;
        weight_per_unit_kg: number;
        total_weight_kg: number;
        total_product_value: number;
    };
    storage_info: {
        storage_type_required: string;
        temperature_control: string;
        rate_per_kg_per_day: number;
        storage_duration_days: number;
        min_storage_days: number;
    };
    cost_breakdown: {
        storage_cost: number;
        insurance_percentage: number;
        insurance_amount: number;
        platform_fee: number;
        total_cost: number;
    };
    per_day_cost: number;
    per_unit_cost: number;
    recommendations: string[];
}

export function ProductPricingCalculator() {
    const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [result, setResult] = useState<CalculationResult | null>(null);

    const [formData, setFormData] = useState({
        product_type: '',
        quantity: '',
        weight_per_unit_kg: '',
        storage_duration_days: '',
        unit: 'sacks',
    });

    const { toast } = useToast();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/product-pricing/products');
            const data = await response.json();

            // Group by category
            const grouped = data.grouped_by_category;
            const categories = Object.keys(grouped).map(cat => ({
                name: cat,
                products: grouped[cat],
            }));

            setProductCategories(categories);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast({
                title: 'Error',
                description: 'Failed to load product catalog',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = async () => {
        if (!formData.product_type || !formData.quantity || !formData.weight_per_unit_kg || !formData.storage_duration_days) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        setCalculating(true);
        try {
            const response = await fetch('/api/product-pricing/calculate-product-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_type: formData.product_type,
                    quantity: parseInt(formData.quantity),
                    weight_per_unit_kg: parseFloat(formData.weight_per_unit_kg),
                    storage_duration_days: parseInt(formData.storage_duration_days),
                    unit: formData.unit,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
            } else {
                toast({
                    title: 'Calculation Error',
                    description: data.error || 'Failed to calculate pricing',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Calculation error:', error);
            toast({
                title: 'Error',
                description: 'Failed to calculate storage pricing',
                variant: 'destructive',
            });
        } finally {
            setCalculating(false);
        }
    };

    const getTrendIcon = (trend: string) => {
        if (trend === 'rising') return <TrendingUp className="h-4 w-4 text-red-500" />;
        if (trend === 'falling') return <TrendingDown className="h-4 w-4 text-green-500" />;
        return null;
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-6 w-6" />
                        Product Storage Cost Calculator
                    </CardTitle>
                    <CardDescription>
                        Calculate storage costs and insurance for your agricultural products
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="product">Product Type *</Label>
                            <Select
                                value={formData.product_type}
                                onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                                disabled={loading}
                            >
                                <SelectTrigger id="product">
                                    <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {productCategories.map(category => (
                                        <React.Fragment key={category.name}>
                                            <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">
                                                {category.name}
                                            </div>
                                            {category.products.map(product => (
                                                <SelectItem key={product.product_type} value={product.product_type}>
                                                    <div className="flex items-center justify-between w-full gap-2">
                                                        <span>{product.product_type}</span>
                                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                                            <span>₹{product.current_price_per_kg}/kg</span>
                                                            {getTrendIcon(product.price_trend)}
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity *</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="quantity"
                                    type="number"
                                    placeholder="e.g., 100"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                                <Select
                                    value={formData.unit}
                                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sacks">Sacks</SelectItem>
                                        <SelectItem value="bags">Bags</SelectItem>
                                        <SelectItem value="crates">Crates</SelectItem>
                                        <SelectItem value="boxes">Boxes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Weight per Unit */}
                        <div className="space-y-2">
                            <Label htmlFor="weight">Weight per {formData.unit.slice(0, -1)} (kg) *</Label>
                            <Input
                                id="weight"
                                type="number"
                                step="0.1"
                                placeholder="e.g., 50"
                                value={formData.weight_per_unit_kg}
                                onChange={(e) => setFormData({ ...formData, weight_per_unit_kg: e.target.value })}
                            />
                        </div>

                        {/* Storage Duration */}
                        <div className="space-y-2">
                            <Label htmlFor="duration">Storage Duration (days) *</Label>
                            <Input
                                id="duration"
                                type="number"
                                placeholder="e.g., 30"
                                value={formData.storage_duration_days}
                                onChange={(e) => setFormData({ ...formData, storage_duration_days: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleCalculate}
                        disabled={calculating || loading}
                        className="w-full md:w-auto"
                    >
                        {calculating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Calculating...
                            </>
                        ) : (
                            <>
                                <Calculator className="mr-2 h-4 w-4" />
                                Calculate Storage Cost
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Results */}
            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Package className="h-5 w-5" />
                                Product Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Product:</span>
                                <span className="font-medium">{result.product_info.product_type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Category:</span>
                                <span className="font-medium">{result.product_info.product_category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Market Price:</span>
                                <span className="font-medium">₹{result.product_info.market_price_per_kg}/kg</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Weight:</span>
                                <span className="font-medium">{result.product_info.total_weight_kg} kg</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Product Value:</span>
                                <span className="font-semibold text-lg">₹{result.product_info.total_product_value.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Storage Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Storage Requirements</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Storage Type:</span>
                                <span className="font-medium capitalize">{result.storage_info.storage_type_required.replace('_', ' ')}</span>
                            </div>
                            {result.storage_info.temperature_control && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Temperature:</span>
                                    <span className="font-medium">{result.storage_info.temperature_control}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Rate:</span>
                                <span className="font-medium">₹{result.storage_info.rate_per_kg_per_day}/kg/day</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{result.storage_info.storage_duration_days} days</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cost Breakdown */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Cost Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Storage Cost:</span>
                                    <span className="font-medium">₹{result.cost_breakdown.storage_cost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Insurance ({result.cost_breakdown.insurance_percentage}%):</span>
                                    <span className="font-medium">₹{result.cost_breakdown.insurance_amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Per Day Cost:</span>
                                    <span className="font-medium">₹{result.per_day_cost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Per Unit Cost:</span>
                                    <span className="font-medium">₹{result.per_unit_cost.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
                                <span className="text-xl font-semibold">Total Cost:</span>
                                <span className="text-2xl font-bold text-primary">₹{result.cost_breakdown.total_cost.toLocaleString()}</span>
                            </div>

                            {/* Recommendations */}
                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
                                <h4 className="font-semibold text-sm mb-2">📋 Important Information:</h4>
                                {result.recommendations.map((rec, idx) => (
                                    <p key={idx} className="text-sm text-gray-700 dark:text-gray-300">• {rec}</p>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
