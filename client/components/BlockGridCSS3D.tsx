import React, { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, ZoomIn, ZoomOut, Move, MousePointer2 } from 'lucide-react';

interface Block {
  id: string;
  block_number: number;
  position_x: number;
  position_y: number;
  status: 'available' | 'booked' | 'maintenance' | 'selected';
  booked_by?: string;
  area_sqft: number;
}

interface BlockGridCSS3DProps {
  blocks: Block[];
  selectedBlocks: number[];
  onBlockSelect: (blockNumber: number) => void;
  gridSize?: number;
  isSelectionMode: boolean;
  maxSelection?: number;
}

export default function BlockGridCSS3D({
  blocks,
  selectedBlocks,
  onBlockSelect,
  gridSize = 10,
  isSelectionMode,
  maxSelection = 20
}: BlockGridCSS3DProps) {
  const [rotation, setRotation] = useState({ x: 55, y: 0, z: -45 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);

  // Calculate grid dimensions
  const cols = Math.ceil(Math.sqrt(blocks.length));
  const rows = Math.ceil(blocks.length / cols);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !e.target || !(e.target as HTMLElement).closest('.block-cell')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setRotation(prev => ({
        x: Math.max(20, Math.min(80, prev.x - deltaY * 0.3)),
        y: prev.y,
        z: prev.z - deltaX * 0.3
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setRotation({ x: 55, y: 0, z: -45 });
    setZoom(1);
  };

  const getBlockColor = (block: Block, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) {
      return {
        top: 'bg-blue-500',
        front: 'bg-blue-600',
        side: 'bg-blue-700',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.6)]'
      };
    }
    
    switch (block.status) {
      case 'available':
        return {
          top: isHovered && isSelectionMode ? 'bg-green-400' : 'bg-green-500',
          front: isHovered && isSelectionMode ? 'bg-green-500' : 'bg-green-600',
          side: isHovered && isSelectionMode ? 'bg-green-600' : 'bg-green-700',
          glow: isHovered && isSelectionMode ? 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' : ''
        };
      case 'booked':
        return {
          top: 'bg-red-500',
          front: 'bg-red-600',
          side: 'bg-red-700',
          glow: ''
        };
      case 'maintenance':
        return {
          top: 'bg-orange-500',
          front: 'bg-orange-600',
          side: 'bg-orange-700',
          glow: ''
        };
      default:
        return {
          top: 'bg-gray-500',
          front: 'bg-gray-600',
          side: 'bg-gray-700',
          glow: ''
        };
    }
  };

  const stats = useMemo(() => {
    const available = blocks.filter(b => b.status === 'available').length;
    const booked = blocks.filter(b => b.status === 'booked').length;
    const maintenance = blocks.filter(b => b.status === 'maintenance').length;
    return { available, booked, maintenance, total: blocks.length };
  }, [blocks]);

  return (
    <div className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden">
      {/* Header with controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            3D Warehouse Layout
          </h3>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="bg-green-500/20 border-green-500/50 text-green-400">
              {stats.available} Available
            </Badge>
            <Badge variant="outline" className="bg-red-500/20 border-red-500/50 text-red-400">
              {stats.booked} Booked
            </Badge>
            <Badge variant="outline" className="bg-orange-500/20 border-orange-500/50 text-orange-400">
              {stats.maintenance} Maintenance
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
            className="bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-white"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
            className="bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-white"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={resetView}
            className="bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selection mode indicator */}
      {isSelectionMode && (
        <div className="absolute top-20 left-4 z-20">
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg px-3 py-2 flex items-center gap-2">
            <MousePointer2 className="h-4 w-4 text-blue-400 animate-pulse" />
            <span className="text-blue-400 text-sm font-medium">
              Selection Mode: {selectedBlocks.length}/{maxSelection} blocks
            </span>
          </div>
        </div>
      )}

      {/* 3D Grid Container */}
      <div 
        className="w-full h-[500px] flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative transition-transform duration-100"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg) scale(${zoom})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Grid floor */}
          <div 
            className="absolute bg-slate-700/50 border border-slate-600/30"
            style={{
              width: `${cols * 50 + 20}px`,
              height: `${rows * 50 + 20}px`,
              transform: 'translateZ(-30px) translateX(-10px) translateY(-10px)',
            }}
          />
          
          {/* Grid pattern on floor */}
          <div
            className="absolute opacity-20"
            style={{
              width: `${cols * 50 + 20}px`,
              height: `${rows * 50 + 20}px`,
              transform: 'translateZ(-29px) translateX(-10px) translateY(-10px)',
              backgroundImage: `
                linear-gradient(to right, #475569 1px, transparent 1px),
                linear-gradient(to bottom, #475569 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Blocks */}
          <div 
            className="grid gap-1 p-2"
            style={{
              gridTemplateColumns: `repeat(${cols}, 45px)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {blocks.map((block, index) => {
              const isSelected = selectedBlocks.includes(block.block_number);
              const isHovered = hoveredBlock === block.block_number;
              const colors = getBlockColor(block, isSelected, isHovered);
              const isClickable = block.status === 'available' && isSelectionMode;
              
              return (
                <div
                  key={block.id}
                  className={cn(
                    "block-cell relative w-[45px] h-[45px] transition-all duration-200 cursor-pointer",
                    colors.glow,
                    isSelected && 'animate-pulse',
                    !isClickable && 'cursor-not-allowed'
                  )}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `translateZ(${isSelected ? 25 : isHovered ? 15 : 0}px)`,
                  }}
                  onClick={() => isClickable && onBlockSelect(block.block_number)}
                  onMouseEnter={() => setHoveredBlock(block.block_number)}
                  onMouseLeave={() => setHoveredBlock(null)}
                >
                  {/* Top face */}
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-sm flex items-center justify-center transition-colors",
                      colors.top
                    )}
                    style={{
                      transform: 'translateZ(15px)',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <span className={cn(
                      "font-bold text-xs",
                      isSelected || block.status === 'booked' ? 'text-white' : 'text-gray-900'
                    )}>
                      {block.block_number}
                    </span>
                  </div>
                  
                  {/* Front face */}
                  <div 
                    className={cn(
                      "absolute left-0 right-0 h-[15px] rounded-b-sm transition-colors",
                      colors.front
                    )}
                    style={{
                      bottom: '0',
                      transform: 'rotateX(-90deg)',
                      transformOrigin: 'bottom',
                    }}
                  />
                  
                  {/* Right face */}
                  <div 
                    className={cn(
                      "absolute top-0 bottom-0 w-[15px] rounded-r-sm transition-colors",
                      colors.side
                    )}
                    style={{
                      right: '0',
                      transform: 'rotateY(90deg)',
                      transformOrigin: 'right',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded shadow-lg" />
              <span className="text-gray-300">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded shadow-lg animate-pulse" />
              <span className="text-gray-300">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded shadow-lg" />
              <span className="text-gray-300">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded shadow-lg" />
              <span className="text-gray-300">Maintenance</span>
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-2">
            <Move className="inline h-3 w-3 mr-1" />
            Drag to rotate • Click blocks to select
          </p>
        </div>
      </div>
    </div>
  );
}
