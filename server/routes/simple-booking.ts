import 'dotenv/config';
import { RequestHandler } from "express";
import { supabaseAnon as supabase } from '../lib/supabaseClient';

// Book warehouse blocks (grid-based booking)
export const bookWarehouseBlocks: RequestHandler = async (req, res) => {
    try {
        const {
            seeker_id,
            warehouse_id,
            blocks,
            start_date,
            end_date,
            total_amount,
            payment_method,
            goods_type,
            customer_details
        } = req.body;

        console.log(`📦 Processing block booking for warehouse ${warehouse_id}`);

        if (!seeker_id || !warehouse_id || !blocks || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                error: 'Missing required booking fields'
            });
        }

        if (!goods_type) {
            return res.status(400).json({
                success: false,
                error: 'Missing goods_type'
            });
        }

        // Calculate total area from blocks (default 100 sq ft per block if not specified)
        const BLOCK_AREA_SQFT = 100;
        const totalArea = (blocks || []).reduce((sum: number, block: any) => sum + (block.area || BLOCK_AREA_SQFT), 0);

        // --- FCFS Validation: Check for Overlapping Bookings ---
        const reqStart = new Date(start_date);
        const reqEnd = new Date(end_date);
        
        // Normalize requested blocks for easy checking (handle objects or strings)
        const requestedBlockIds = (blocks || []).map((b: any) => {
            if (typeof b === 'string') return b;
            return String(b.id || `block_${b.block_number}`);
        });

        const { data: existingBookings, error: fetchErr } = await supabase
            .from('activity_logs')
            .select('metadata')
            .eq('type', 'booking')
            .in('metadata->>booking_status', ['pending', 'approved']);

        if (!fetchErr && existingBookings) {
            // Filter by warehouse_id in JS since it's inside metadata jsonb
            const relevantBookings = existingBookings.filter((b: any) => b.metadata?.warehouse_id === warehouse_id);
            
            for (const b of relevantBookings) {
                const bStart = new Date(b.metadata.start_date);
                const bEnd = new Date(b.metadata.end_date);
                
                // Check if dates overlap
                const datesOverlap = reqStart <= bEnd && reqEnd >= bStart;
                if (!datesOverlap) continue;

                // Dates overlap! Check if any specific requested blocks overlap
                const bookedBlocks = (b.metadata.blocks_booked || []).map((ob: any) => {
                    if (typeof ob === 'string') return ob;
                    return String(ob.id || `block_${ob.block_number}`);
                });

                const blockConflict = requestedBlockIds.some((rb: string) => bookedBlocks.includes(rb));
                if (blockConflict) {
                    return res.status(409).json({
                        success: false,
                        error: 'Slot conflict: One or more requested blocks are already booked or pending for these dates. Please choose different dates or blocks.',
                        conflictDetails: 'FCFS Lock triggered'
                    });
                }
            }
        }
        // --- End FCFS Validation ---

        // -------------------------------------------------------------------
        // FIX #1 + #2: Warehouse lookup — try BOTH id (UUID) AND wh_id in one
        // query so CSV-imported warehouses (LIC007986 etc.) are always found.
        // -------------------------------------------------------------------
        let warehouse: any = null;
        let warehouseOwnerId: string | null = null;

        // Single combined query: match either UUID id OR string wh_id
        const { data: mainWarehouse } = await supabase
            .from('warehouses')
            .select('id, wh_id, name, address, city, state, owner_id, total_area, area_sqft')
            .or(`id.eq.${warehouse_id},wh_id.eq.${warehouse_id}`)
            .maybeSingle();

        if (mainWarehouse) {
            warehouse = mainWarehouse;
            warehouseOwnerId = mainWarehouse.owner_id || null;
            console.log(`✅ Found warehouse in main table: ${mainWarehouse.name} | owner_id: ${warehouseOwnerId}`);
        } else {
            // Try warehouse_submissions for approved submissions (by UUID id)
            const { data: submissionWarehouse } = await supabase
                .from('warehouse_submissions')
                .select('id, name, address, city, state, owner_id, total_area')
                .eq('id', warehouse_id)
                .eq('status', 'approved')
                .maybeSingle();

            if (submissionWarehouse) {
                warehouse = submissionWarehouse;
                warehouseOwnerId = submissionWarehouse.owner_id || null;
                console.log(`✅ Found warehouse in submissions: ${submissionWarehouse.name} | owner_id: ${warehouseOwnerId}`);
            }
        }

        if (!warehouse) {
            console.log(`⚠️ Warehouse ${warehouse_id} not found in database, using provided details from client`);
        }

        // -------------------------------------------------------------------
        // FIX #4: If owner_id is NULL (CSV-seeded warehouses), mark as
        // 'unassigned' so admin can still see the booking. Never silently
        // drop the booking just because there's no owner.
        // -------------------------------------------------------------------
        if (!warehouseOwnerId) {
            console.log(`ℹ️ No owner_id for warehouse ${warehouse_id} — booking will be admin-managed`);
        }

        // Create booking activity log with 'pending' status for admin review
            // Utility: Ensure activity_logs is always updated for booking events
            const upsertActivityLog = async ({
                bookingId,
                seekerId,
                type = 'booking',
                description,
                metadata
            }) => {
                if (!bookingId) {
                    // Insert new log
                    return await supabase
                        .from('activity_logs')
                        .insert({ seeker_id: seekerId, type, description, metadata })
                        .select()
                        .single();
                } else {
                    // Update existing log
                    return await supabase
                        .from('activity_logs')
                        .update({ description, metadata })
                        .eq('id', bookingId)
                        .select()
                        .single();
                }
            };

            // Create booking activity log with 'pending' status for admin review (robust upsert)
            const { data: booking, error: bookingError } = await upsertActivityLog({
                bookingId: null,
                seekerId: seeker_id,
                type: 'booking',
                description: `Block booking for ${warehouse?.name || 'Warehouse'} - ${blocks.length} blocks (${totalArea} sq ft)`,
                metadata: {
                    warehouse_id,
                    warehouse_owner_id: warehouseOwnerId,     // null is fine — admin sees it
                    warehouse_name: warehouse?.name || 'Unknown Warehouse',
                    warehouse_address: warehouse?.address || '',
                    warehouse_city: warehouse?.city || '',
                    warehouse_state: warehouse?.state || '',
                    blocks_booked: blocks,
                    area_sqft: totalArea,
                    start_date,
                    end_date,
                    total_amount,
                    payment_method,
                    goods_type,
                    customer_details,
                    booking_status: 'pending',
                    booking_type: 'block_booking'
                }
            });
        if (bookingError) {
            console.error('❌ Error creating booking:', bookingError);
            return res.status(500).json({
                success: false,
                error: 'Failed to create booking',
                details: bookingError.message
            });
        }

        console.log(`✅ Block booking created successfully with ID: ${booking.id}`);

        return res.json({
            success: true,
            booking: {
                id: booking.id,
                warehouse_id,
                blocks_booked: blocks,
                area_sqft: totalArea,
                start_date,
                end_date,
                total_amount,
                status: 'pending',
                created_at: booking.created_at
            },
            message: 'Booking submitted successfully! Awaiting admin approval.'
        });

    } catch (error) {
        console.error('❌ Block booking error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Get available blocks for a warehouse
export const getAvailableBlocks: RequestHandler = async (req, res) => {
    try {
        const { warehouse_id } = req.query;

        if (!warehouse_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing warehouse_id'
            });
        }

        const wid = String(warehouse_id);
        console.log(`🔍 Fetching available blocks for warehouse ${wid}`);

        // Get all APPROVED bookings for this warehouse to find occupied blocks
        // Match by BOTH warehouse_id stored in metadata (UUID or wh_id)
        const { data: bookings, error } = await supabase
            .from('activity_logs')
            .select('metadata')
            .eq('type', 'booking')
            .filter('metadata->>booking_status', 'eq', 'approved');

        if (error) {
            console.error('Error fetching bookings:', error);
        }

        // Filter client-side so we catch both UUID and wh_id formats stored in metadata
        const relevantBookings = (bookings || []).filter(
            (b: any) => b.metadata?.warehouse_id === wid
        );

        // Extract booked block numbers
        const bookedBlocks = new Set<string>();
        const bookedBlockNumbers = new Set<number>();
        relevantBookings.forEach((booking: any) => {
            const blks = booking.metadata?.blocks_booked || [];
            blks.forEach((block: any) => {
                if (block.id) bookedBlocks.add(String(block.id));
                if (block.block_number != null) bookedBlockNumbers.add(Number(block.block_number));
            });
        });

        // -------------------------------------------------------------------
        // FIX #1 + #2: Fetch warehouse using BOTH id AND wh_id columns.
        // Also select total_area (CSV warehouses) with area_sqft as fallback.
        // -------------------------------------------------------------------
        const { data: warehouse } = await supabase
            .from('warehouses')
            .select('id, wh_id, total_area, area_sqft, total_blocks, blocks, metadata')
            .or(`id.eq.${wid},wh_id.eq.${wid}`)
            .maybeSingle();

        // If not found in main table, try submissions
        let warehouseData: any = warehouse;
        if (!warehouseData) {
            const { data: sub } = await supabase
                .from('warehouse_submissions')
                .select('id, total_area, total_blocks, blocks, metadata')
                .eq('id', wid)
                .eq('status', 'approved')
                .maybeSingle();
            warehouseData = sub || null;
        }

        // -------------------------------------------------------------------
        // FIX #3 (partial): If warehouse has a populated blocks[] array, use
        // it directly and mark the right ones as booked. If not (CSV warehouses),
        // generate a virtual grid dynamically — no need to mutate the DB.
        // -------------------------------------------------------------------
        const hasRealBlocks = warehouseData &&
            Array.isArray(warehouseData.blocks) &&
            warehouseData.blocks.length > 0;

        let blocks: any[] = [];

        if (hasRealBlocks) {
            // Owner-submitted warehouses: use the stored blocks array
            blocks = warehouseData.blocks.map((block: any) => {
                const blockId = String(block.id || `block_${block.block_number}`);
                const blockNum = Number(block.block_number || 0);
                const isBooked =
                    block.status === 'occupied' ||
                    block.status === 'reserved' ||
                    bookedBlocks.has(blockId) ||
                    bookedBlockNumbers.has(blockNum);
                return {
                    id: blockId,
                    block_number: blockNum,
                    row: block.row ?? 0,
                    col: block.col ?? 0,
                    area: block.area_sqft || block.area || 100,
                    available: !isBooked,
                    label: block.label || `Block ${blockNum}`
                };
            });
        } else {
            // CSV-seeded warehouses: generate virtual grid from area
            const gridConfig = warehouseData?.metadata?.grid_config || { rows: 4, cols: 5 };
            // Accept total_area (CSV) OR area_sqft (legacy), fallback 10000
            const totalArea =
                Number(warehouseData?.total_area || 0) ||
                Number(warehouseData?.area_sqft || 0) ||
                10000;
            const blockArea = Math.floor(totalArea / (gridConfig.rows * gridConfig.cols));

            for (let row = 0; row < gridConfig.rows; row++) {
                for (let col = 0; col < gridConfig.cols; col++) {
                    const blockId = `${row}-${col}`;
                    const blockNumber = row * gridConfig.cols + col + 1;
                    const isBooked =
                        bookedBlocks.has(blockId) ||
                        bookedBlockNumbers.has(blockNumber) ||
                        bookedBlocks.has(`block_${blockNumber}`);
                    blocks.push({
                        id: blockId,
                        block_number: blockNumber,
                        row,
                        col,
                        area: blockArea,
                        available: !isBooked,
                        label: `Block ${String.fromCharCode(65 + row)}${col + 1}`
                    });
                }
            }
        }

        const availableCount = blocks.filter(b => b.available).length;
        console.log(`✅ Found ${availableCount} available blocks (${hasRealBlocks ? 'real' : 'virtual'} grid)`);

        return res.json({
            success: true,
            blocks,
            grid_config: warehouseData?.metadata?.grid_config || { rows: 4, cols: 5 },
            total_blocks: blocks.length,
            available_blocks: availableCount,
            booked_block_numbers: Array.from(bookedBlockNumbers)
        });

    } catch (error) {
        console.error('❌ Get blocks error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
