import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, X, Check, Package, DollarSign, Lock } from 'lucide-react';

interface GridBlock {
    id: string;
    label: string;
    row: number;
    col: number;
    area: number;
    status: 'available' | 'booked' | 'selected';
}

interface GridBlockSelectorProps {
    warehouseId: string;
    warehouseName: string;
    pricePerSqft: number;
    startDate?: string;
    endDate?: string;
    totalBlocks: number;  // Total blocks in warehouse (e.g., 61)
    availableBlocks: number;  // Available blocks (e.g., 31)
    totalArea: number;  // Total warehouse area
    onBooking: (blocks: GridBlock[], totalArea: number, totalPrice: number) => void;
}

const GridBlockSelector: React.FC<GridBlockSelectorProps> = ({
    warehouseId,
    warehouseName,
    pricePerSqft,
    startDate,
    endDate,
    totalBlocks = 61,
    availableBlocks = 31,
    totalArea = 60000,
    onBooking
}) => {
    const [blocks, setBlocks] = useState<GridBlock[]>([]);
    const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
    const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Calculate block area based on total area and blocks
    const blockArea = Math.floor(totalArea / totalBlocks);
    const bookedBlockCount = totalBlocks - availableBlocks;

    // Generate blocks based on warehouse data
    useEffect(() => {
        setLoading(true);

        // Calculate grid dimensions to fit all blocks (aim for roughly square grid)
        const cols = Math.ceil(Math.sqrt(totalBlocks));
        const rows = Math.ceil(totalBlocks / cols);

        const generatedBlocks: GridBlock[] = [];
        let blockIndex = 0;

        for (let row = 0; row < rows && blockIndex < totalBlocks; row++) {
            for (let col = 0; col < cols && blockIndex < totalBlocks; col++) {
                const isBooked = blockIndex < bookedBlockCount; // First N blocks are booked
                const rowLabel = String.fromCharCode(65 + (row % 26)); // A-Z

                generatedBlocks.push({
                    id: `block-${blockIndex}`,
                    label: `${rowLabel}${col + 1}`,
                    row,
                    col,
                    area: blockArea,
                    status: isBooked ? 'booked' : 'available'
                });

                blockIndex++;
            }
        }

        setBlocks(generatedBlocks);
        setSelectedBlocks(new Set());
        setLoading(false);
    }, [totalBlocks, availableBlocks, totalArea, warehouseId]);

    // Toggle block selection
    const toggleBlock = (blockId: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block || block.status === 'booked') return;

        setSelectedBlocks(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(blockId)) {
                newSelected.delete(blockId);
            } else {
                newSelected.add(blockId);
            }
            return newSelected;
        });
    };

    // Calculate totals
    const selectedBlocksArray = blocks.filter(b => selectedBlocks.has(b.id));
    const selectedArea = selectedBlocksArray.reduce((sum, b) => sum + b.area, 0);
    const totalPrice = selectedArea * pricePerSqft;

    // Handle booking
    const handleBook = () => {
        if (selectedBlocksArray.length === 0) {
            alert('Please select at least 1 block to book');
            return;
        }
        onBooking(selectedBlocksArray, selectedArea, totalPrice);
    };

    // Get block style based on state
    const getBlockStyle = (block: GridBlock) => {
        const isSelected = selectedBlocks.has(block.id);
        const isHovered = hoveredBlock === block.id;
        const isBooked = block.status === 'booked';

        if (isBooked) {
            return 'bg-red-900/30 border-red-500/40 cursor-not-allowed opacity-60';
        }
        if (isSelected) {
            return 'bg-gradient-to-br from-green-500/40 to-emerald-500/40 border-green-400 shadow-lg shadow-green-500/20 scale-105';
        }
        if (isHovered) {
            return 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-400/50 shadow-md shadow-blue-500/10 scale-102';
        }
        return 'bg-slate-800/40 border-slate-600/50 hover:border-blue-500/30';
    };

    // Calculate grid columns dynamically
    const gridCols = Math.ceil(Math.sqrt(totalBlocks));

    if (loading) {
        return (
            <Card className="border-slate-600/50 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl">
                <CardContent className="p-8 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-slate-300">Loading warehouse blocks...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-600/50 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl overflow-hidden">
            <CardHeader className="border-b border-slate-600/50 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 py-3 px-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                            <Package className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-white text-lg">Select Blocks</CardTitle>
                            <p className="text-sm text-slate-400">
                                {availableBlocks} of {totalBlocks} available
                            </p>
                        </div>
                    </div>
                    {selectedBlocks.size > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBlocks(new Set())}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-3">
                {/* Grid Display */}
                <div
                    className="grid gap-1.5 mb-3"
                    style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
                >
                    {blocks.map((block) => {
                        const isSelected = selectedBlocks.has(block.id);
                        const isBooked = block.status === 'booked';

                        return (
                            <button
                                key={block.id}
                                onClick={() => toggleBlock(block.id)}
                                onMouseEnter={() => setHoveredBlock(block.id)}
                                onMouseLeave={() => setHoveredBlock(null)}
                                disabled={isBooked}
                                title={isBooked ? 'Already booked' : `${block.label} - ${block.area.toLocaleString()} sq ft`}
                                className={`
                  relative aspect-square rounded-md border-2 transition-all duration-200 ease-out min-h-[32px]
                  ${getBlockStyle(block)}
                  ${!isBooked && 'hover:scale-105 active:scale-95'}
                `}
                            >
                                {/* Block Label */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-[10px] font-bold ${isBooked ? 'text-red-400' : isSelected ? 'text-white' : 'text-slate-400'}`}>
                                        {block.label}
                                    </span>
                                </div>

                                {/* Selection Indicator */}
                                {isSelected && (
                                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                                    </div>
                                )}

                                {/* Booked Indicator */}
                                {isBooked && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Lock className="h-3 w-3 text-red-400/60" strokeWidth={2} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-3 mb-3 py-2 bg-slate-800/50 rounded-lg border border-slate-600/50 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gradient-to-br from-green-500/40 to-emerald-500/40 border border-green-400 rounded"></div>
                        <span className="text-slate-400">Selected ({selectedBlocks.size})</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-slate-800/40 border border-slate-600/50 rounded"></div>
                        <span className="text-slate-400">Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-900/30 border border-red-500/40 rounded"></div>
                        <span className="text-slate-400">Booked</span>
                    </div>
                </div>

                {/* Selection Summary */}
                {selectedBlocks.size > 0 ? (
                    <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div>
                                <p className="text-slate-400 text-xs">Blocks</p>
                                <p className="text-xl font-bold text-white">{selectedBlocks.size}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs">Area</p>
                                <p className="text-xl font-bold text-green-400">{selectedArea.toLocaleString()} sq ft</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs">Total</p>
                                <p className="text-xl font-bold text-emerald-400">₹{totalPrice.toLocaleString()}</p>
                            </div>
                        </div>

                        <Button
                            onClick={handleBook}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 rounded-lg"
                            size="lg"
                        >
                            <Calendar className="mr-2 h-4 w-4" />
                            Book {selectedBlocks.size} Block{selectedBlocks.size > 1 ? 's' : ''}
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-4 text-slate-400 border border-dashed border-slate-600/50 rounded-lg">
                        <Package className="h-8 w-8 mx-auto mb-1 opacity-40" />
                        <p className="text-xs">Click available blocks to select</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default GridBlockSelector;
