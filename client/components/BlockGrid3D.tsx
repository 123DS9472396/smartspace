import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface Block {
  id: string;
  block_number: number;
  position_x: number;
  position_y: number;
  status: 'available' | 'booked' | 'maintenance';
  booked_by?: string;
  booked_at?: string;
  expires_at?: string;
}

interface BlockGrid3DProps {
  blocks: Block[];
  selectedBlocks: number[];
  onBlockSelect: (blockNumber: number) => void;
  gridSize: number;
  isSelectionMode: boolean;
  pricePerBlock?: number;
}

interface BlockMeshProps {
  block: Block;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
  isSelectionMode: boolean;
}

function BlockMesh({ block, position, isSelected, onClick, isSelectionMode }: BlockMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Animation for selection and hover
  useFrame((state) => {
    if (meshRef.current) {
      const targetY = isSelected ? 0.6 : hovered ? 0.3 : 0;
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.15);
      
      if (isSelected) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.1;
      } else {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1);
      }
    }
  });

  const getColor = () => {
    if (isSelected) return '#3b82f6'; // Blue for selected
    
    switch (block.status) {
      case 'available':
        return hovered && isSelectionMode ? '#22c55e' : '#16a34a'; // Green shades
      case 'booked':
        return '#dc2626'; // Red for booked
      case 'maintenance':
        return '#f59e0b'; // Orange for maintenance
      default:
        return '#6b7280'; // Gray default
    }
  };

  const isClickable = block.status === 'available' && isSelectionMode;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={isClickable ? onClick : undefined}
      onPointerEnter={() => isClickable && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1.5, 0.4, 1.5]} />
      <meshStandardMaterial 
        color={getColor()} 
        transparent
        opacity={block.status === 'available' ? 0.9 : 0.7}
        emissive={isSelected ? '#1e40af' : '#000000'}
        emissiveIntensity={isSelected ? 0.2 : 0}
        roughness={0.4}
        metalness={0.1}
      />
      
      {/* Block number text */}
      <Text
        position={[0, 0.21, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color={isSelected || block.status === 'booked' ? '#ffffff' : '#1f2937'}
        anchorX="center"
        anchorY="middle"
      >
        {block.block_number}
      </Text>
    </mesh>
  );
}

function CameraController({ gridSize }: { gridSize: number }) {
  const { camera } = useThree();
  
  useEffect(() => {
    // Position camera to view the entire grid optimally
    const distance = Math.max(gridSize * 1.2, 12);
    camera.position.set(distance, distance * 0.8, distance);
    camera.lookAt(gridSize / 2, 0, gridSize / 2);
  }, [camera, gridSize]);
  
  return null;
}

function GridFloor({ gridSize }: { gridSize: number }) {
  return (
    <group>
      {/* Main floor */}
      <mesh position={[gridSize / 2, -0.5, gridSize / 2]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[gridSize + 2, gridSize + 2]} />
        <meshStandardMaterial color="#1f2937" transparent opacity={0.5} />
      </mesh>
      
      {/* Grid lines */}
      <gridHelper 
        args={[gridSize + 2, gridSize + 1, '#374151', '#374151']} 
        position={[gridSize / 2, -0.49, gridSize / 2]} 
      />
    </group>
  );
}

export default function BlockGrid3D({ 
  blocks, 
  selectedBlocks, 
  onBlockSelect, 
  gridSize, 
  isSelectionMode,
  pricePerBlock = 100
}: BlockGrid3DProps) {
  
  // Create a map for quick block lookup
  const blockMap = useMemo(() => {
    const map = new Map<string, Block>();
    blocks.forEach(block => {
      map.set(`${block.position_x}-${block.position_y}`, block);
    });
    return map;
  }, [blocks]);

  // Generate grid positions
  const gridBlocks = useMemo(() => {
    const gridBlocks: (Block | null)[] = [];
    
    for (let x = 1; x <= gridSize; x++) {
      for (let y = 1; y <= gridSize; y++) {
        const block = blockMap.get(`${x}-${y}`);
        gridBlocks.push(block || null);
      }
    }
    
    return gridBlocks;
  }, [blockMap, gridSize]);

  // Count stats
  const availableCount = blocks.filter(b => b.status === 'available').length;
  const bookedCount = blocks.filter(b => b.status === 'booked').length;
  const maintenanceCount = blocks.filter(b => b.status === 'maintenance').length;

  return (
    <div className="relative">
      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-900/80 rounded-t-lg border border-gray-700 border-b-0">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{blocks.length}</div>
          <div className="text-sm text-gray-400">Total Blocks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{availableCount - selectedBlocks.length}</div>
          <div className="text-sm text-gray-400">Available</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">₹{pricePerBlock}</div>
          <div className="text-sm text-gray-400">Price per Block</div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-[500px] bg-gray-900 overflow-hidden border border-gray-700 border-t-0 rounded-b-lg">
        <Canvas
          shadows
          gl={{ 
            antialias: true, 
            alpha: false,
            powerPreference: "high-performance"
          }}
          dpr={[1, 2]}
        >
          <PerspectiveCamera 
            makeDefault 
            fov={60} 
            near={0.1} 
            far={1000}
          />
          
          <CameraController gridSize={gridSize} />
          
          {/* Lighting setup */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 20, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <pointLight position={[gridSize/2, 10, gridSize/2]} intensity={0.6} />
          <pointLight position={[0, 5, 0]} intensity={0.3} color="#ffffff" />
          
          {/* Grid Floor */}
          <GridFloor gridSize={gridSize} />
          
          {/* Render blocks */}
          {gridBlocks.map((block, index) => {
            if (!block) return null;
            
            const x = (block.position_x - 1) * 2;
            const z = (block.position_y - 1) * 2;
            const isSelected = selectedBlocks.includes(block.block_number);
            
            return (
              <BlockMesh
                key={block.id}
                block={block}
                position={[x, 0, z]}
                isSelected={isSelected}
                onClick={() => onBlockSelect(block.block_number)}
                isSelectionMode={isSelectionMode}
              />
            );
          })}
          
          {/* Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minDistance={8}
            maxDistance={60}
            dampingFactor={0.05}
            enableDamping={true}
          />
        </Canvas>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-800/95 backdrop-blur-sm p-3 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-300">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-300">Booked</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-300">Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-300">Maintenance</span>
          </div>
        </div>
      </div>

      {/* Selection Info */}
      {selectedBlocks.length > 0 && (
        <div className="absolute top-16 left-4 bg-blue-600/95 backdrop-blur-sm p-3 rounded-lg border border-blue-500 shadow-xl">
          <div className="text-sm font-semibold text-white">
            {selectedBlocks.length} Block{selectedBlocks.length !== 1 ? 's' : ''} Selected
          </div>
          <div className="text-xs text-blue-100 mt-1">
            Blocks: {selectedBlocks.slice(0, 5).join(', ')}{selectedBlocks.length > 5 ? '...' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
