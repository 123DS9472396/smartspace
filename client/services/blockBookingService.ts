/**
 * Block Booking Service
 * Handles grid-based warehouse block booking operations
 * Includes mock data for demo purposes with real API integration
 */

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

interface BookingData {
  selectedBlocks: number[];
  startDate: string;
  endDate: string;
  paymentMethod: 'razorpay' | 'stripe';
  totalAmount: number;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
}

// Generate mock blocks for a warehouse
const generateMockBlocks = (totalBlocks: number): Block[] => {
  const blocks: Block[] = [];
  const gridSize = Math.ceil(Math.sqrt(totalBlocks));
  
  for (let i = 1; i <= totalBlocks; i++) {
    const x = ((i - 1) % gridSize) + 1;
    const y = Math.floor((i - 1) / gridSize) + 1;
    
    // Randomly assign some blocks as booked or maintenance
    let status: 'available' | 'booked' | 'maintenance' = 'available';
    const rand = Math.random();
    
    if (rand < 0.15) {
      status = 'booked';
    } else if (rand < 0.2) {
      status = 'maintenance';
    }
    
    blocks.push({
      id: `block_${i}`,
      block_number: i,
      position_x: x,
      position_y: y,
      status,
      booked_by: status === 'booked' ? `Customer ${i}` : undefined,
      booked_at: status === 'booked' ? new Date().toISOString() : undefined,
      expires_at: status === 'booked' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    });
  }
  
  return blocks;
};

// Mock storage for blocks data
const blocksStorage = new Map<string, Block[]>();

export const blockBookingService = {
  // Get blocks for a warehouse
  async getWarehouseBlocks(warehouseId: string): Promise<Block[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!blocksStorage.has(warehouseId)) {
      // Generate blocks for this warehouse (demo: 100 blocks)
      const blocks = generateMockBlocks(100);
      blocksStorage.set(warehouseId, blocks);
    }
    
    return blocksStorage.get(warehouseId) || [];
  },

  // Book selected blocks
  async bookWarehouseBlocks(warehouseId: string, bookingData: BookingData): Promise<{ success: boolean; bookingId: string; message: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const blocks = blocksStorage.get(warehouseId) || [];
    const { selectedBlocks, customerDetails } = bookingData;
    
    // Check if all selected blocks are available
    const unavailableBlocks = selectedBlocks.filter(blockNum => {
      const block = blocks.find(b => b.block_number === blockNum);
      return !block || block.status !== 'available';
    });
    
    if (unavailableBlocks.length > 0) {
      throw new Error(`Blocks ${unavailableBlocks.join(', ')} are not available for booking.`);
    }
    
    // Update block status to booked
    selectedBlocks.forEach(blockNum => {
      const block = blocks.find(b => b.block_number === blockNum);
      if (block) {
        block.status = 'booked';
        block.booked_by = customerDetails.name;
        block.booked_at = new Date().toISOString();
        
        // Set expiry date based on booking period
        const endDate = new Date(bookingData.endDate);
        block.expires_at = endDate.toISOString();
      }
    });
    
    // Update storage
    blocksStorage.set(warehouseId, blocks);
    
    // Generate mock booking ID
    const bookingId = `BK${Date.now().toString().slice(-8)}`;
    
    // Create a real booking record in the database (background call)
    try {
      console.log('🔄 Creating database booking record...');
      console.log('📤 Sending booking data:', {
        warehouse_id: warehouseId,
        blocks: selectedBlocks,
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        total_amount: bookingData.totalAmount
      });
      
      const response = await fetch('/api/bookings/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warehouse_id: warehouseId,
          blocks: selectedBlocks,
          start_date: bookingData.startDate,
          end_date: bookingData.endDate,
          payment_method: bookingData.paymentMethod,
          total_amount: bookingData.totalAmount,
          customer_details: customerDetails,
          booking_metadata: {
            selected_blocks: selectedBlocks,
            booking_type: 'block_booking',
            payment_status: 'completed'
          }
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Database booking created successfully:', result.booking_id || bookingId);
      } else {
        const errorData = await response.json();
        console.error('❌ Database booking failed:', errorData);
        console.error('❌ Response status:', response.status);
      }
    } catch (error) {
      console.error('❌ Database booking error:', error);
      // Don't fail the UI booking - it's just for database sync
    }
    
    // Simulate payment processing
    console.log(`✅ Payment processed: ₹${bookingData.totalAmount} via ${bookingData.paymentMethod}`);
    
    return {
      success: true,
      bookingId,
      message: `Successfully booked ${selectedBlocks.length} blocks for ${customerDetails.name}`
    };
  },

  // Get booking history for a warehouse
  async getBookingHistory(warehouseId: string): Promise<any[]> {
    // Mock implementation - returns empty for now
    return [];
  },

  // Clear blocks cache (useful for testing)
  clearCache(warehouseId?: string): void {
    if (warehouseId) {
      blocksStorage.delete(warehouseId);
    } else {
      blocksStorage.clear();
    }
  }
};

// Expose as global API endpoints for the frontend
if (typeof window !== 'undefined') {
  // Add mock API endpoints to window for demo
  (window as any).mockBlockAPI = {
    getBlocks: blockBookingService.getWarehouseBlocks,
    bookBlocks: blockBookingService.bookWarehouseBlocks
  };
}

export type { Block, BookingData };
