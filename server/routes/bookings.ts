import { RequestHandler } from "express";
import { supabase } from "../lib/supabaseClient";

const normalizeBookingBlockIds = (blocks: any[]): string[] => {
    return (blocks || []).map((b: any, idx: number) => {
        if (typeof b === 'number') return `block_${b}`;
        if (typeof b === 'string') return b;
        if (b?.id) return String(b.id);
        return `block_${Number(b?.block_number || idx + 1)}`;
    });
};

const releaseWarehouseBlocks = async (warehouseId: string, blockIds: string[]) => {
    if (!warehouseId || !blockIds.length) return;

    let warehouseData: any = null;
    let table = 'warehouses';
    let key = 'wh_id';

    let { data: mainWarehouse } = await supabase
        .from('warehouses')
        .select('id, wh_id, blocks, total_blocks')
        .eq('wh_id', warehouseId)
        .maybeSingle();

    if (!mainWarehouse) {
        const { data: byId } = await supabase
            .from('warehouses')
            .select('id, wh_id, blocks, total_blocks')
            .eq('id', warehouseId)
            .maybeSingle();
        mainWarehouse = byId;
        key = 'id';
    }

    if (mainWarehouse) {
        warehouseData = mainWarehouse;
    } else {
        const { data: submissionWarehouse } = await supabase
            .from('warehouse_submissions')
            .select('id, blocks, total_blocks')
            .eq('id', warehouseId)
            .eq('status', 'approved')
            .maybeSingle();
        if (submissionWarehouse) {
            warehouseData = submissionWarehouse;
            table = 'warehouse_submissions';
            key = 'id';
        }
    }

    if (!warehouseData || !Array.isArray(warehouseData.blocks) || warehouseData.blocks.length === 0) return;

    const blockSet = new Set(blockIds);
    const updatedBlocks = warehouseData.blocks.map((block: any) => {
        const blockId = String(block?.id || `block_${block?.block_number}`);
        if (!blockSet.has(blockId)) return block;
        return {
            ...block,
            status: 'available',
            booking_id: null,
            booked_by: null,
            booking_dates: null,
            reserved_at: null,
            occupied_at: null,
        };
    });

    const totalBlocks = Number(warehouseData.total_blocks) || updatedBlocks.length;
    const unavailableCount = updatedBlocks.filter((b: any) => ['reserved', 'occupied', 'booked'].includes(String(b.status))).length;
    const availableBlocks = Math.max(0, totalBlocks - unavailableCount);
    const occupancy = totalBlocks > 0 ? unavailableCount / totalBlocks : 0;

    await supabase
        .from(table)
        .update({ blocks: updatedBlocks, available_blocks: availableBlocks, occupancy })
        .eq(key, warehouseId);
};

/**
 * Get all bookings for a specific seeker
 * Maps admin approval statuses to seeker-friendly statuses
 */
export const getSeekerBookings: RequestHandler = async (req, res) => {
    try {
        const { seeker_id } = req.query;

        if (!seeker_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing seeker_id parameter'
            });
        }

        console.log(`📋 Fetching bookings for seeker: ${seeker_id}`);

        // Fetch all booking activity logs for this seeker
        const { data: bookingsData, error: bookingsError } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('type', 'booking')
            .eq('seeker_id', seeker_id)
            .order('created_at', { ascending: false });

        if (bookingsError) {
            console.error('❌ Error fetching seeker bookings:', bookingsError);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch bookings',
                details: bookingsError.message
            });
        }

        // Transform activity logs into seeker booking format with status mapping
        const seekerBookings = [];

        for (const booking of bookingsData || []) {
            const metadata = booking.metadata || {};
            const warehouseId = metadata.warehouse_id;

            // Map admin approval status to booking status for seeker view
            let status: 'active' | 'upcoming' | 'completed' | 'cancelled';
            const adminStatus = metadata.booking_status || 'pending';

            if (adminStatus === 'cancelled') {
                status = 'cancelled';
            } else if (adminStatus === 'rejected') {
                status = 'cancelled'; // Show rejected bookings as cancelled to seeker
            } else if (adminStatus === 'approved') {
                // Check if the booking period has started/ended for approved bookings
                const now = new Date();
                const startDate = new Date(metadata.start_date);
                const endDate = new Date(metadata.end_date);

                if (now < startDate) {
                    status = 'upcoming'; // Approved but not started yet
                } else if (now > endDate) {
                    status = 'completed'; // Approved and period has ended
                } else {
                    status = 'active'; // Approved and currently active
                }
            } else {
                // Pending or confirmed bookings are shown as upcoming
                status = 'upcoming';
            }

            // Use warehouse info from metadata first, then fetch if needed
            let warehouseInfo = {
                name: metadata.warehouse_name || 'Unknown Warehouse',
                location: `${metadata.warehouse_city || 'Unknown'}, ${metadata.warehouse_state || 'Unknown'}`,
                address: metadata.warehouse_address || 'Address not available'
            };

            // If we have warehouse_id and missing info, fetch from database
            if (warehouseId && !metadata.warehouse_name) {
                const { data: warehouseData } = await supabase
                    .from('warehouses')
                    .select('name, city, state, address')
                    .eq('id', warehouseId)
                    .single();

                if (warehouseData) {
                    warehouseInfo = {
                        name: warehouseData.name,
                        location: `${warehouseData.city}, ${warehouseData.state}`,
                        address: warehouseData.address
                    };
                }
            }

            seekerBookings.push({
                id: booking.id,
                warehouse_id: warehouseId,
                warehouse_name: warehouseInfo.name,
                warehouse_location: warehouseInfo.location,
                warehouse_address: warehouseInfo.address,
                start_date: metadata.start_date,
                end_date: metadata.end_date,
                total_amount: metadata.total_amount || metadata.monthly_rent,
                area_sqft: metadata.area_sqft,
                blocks_booked: metadata.blocks_booked || [],
                payment_method: metadata.payment_method,
                status: status,
                admin_status: adminStatus, // Include original admin status for transparency
                created_at: booking.created_at,
                booking_notes: booking.description,
                booking_type: metadata.booking_type || 'standard',
                admin_notes: metadata.admin_notes || null
            });
        }

        console.log(`✅ Found ${seekerBookings.length} bookings for seeker`);

        return res.json({
            success: true,
            bookings: seekerBookings,
            total: seekerBookings.length
        });

    } catch (error) {
        console.error('❌ Get seeker bookings error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Cancel a booking
 * Updates booking status to cancelled in activity_logs
 */
export const cancelBooking: RequestHandler = async (req, res) => {
    try {
        const { booking_id, seeker_id, cancellation_reason } = req.body;

        if (!booking_id || !seeker_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing booking_id or seeker_id'
            });
        }

        console.log(`🚫 Cancelling booking ${booking_id} for seeker ${seeker_id}`);

        // Fetch the booking
        const { data: existingBooking, error: fetchError } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('id', booking_id)
            .eq('type', 'booking')
            .eq('seeker_id', seeker_id)
            .single();

        if (fetchError || !existingBooking) {
            console.error('❌ Booking not found:', fetchError);
            return res.status(404).json({
                success: false,
                error: 'Booking not found or you do not have permission to cancel it'
            });
        }

        // Check if booking can be cancelled
        const currentStatus = existingBooking.metadata?.booking_status || 'pending';
        if (currentStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                error: 'Booking is already cancelled'
            });
        }

        if (currentStatus === 'completed') {
            return res.status(400).json({
                success: false,
                error: 'Cannot cancel a completed booking'
            });
        }

        // Update booking status to cancelled
        const updatedMetadata = {
            ...existingBooking.metadata,
            booking_status: 'cancelled',
            cancellation_reason: cancellation_reason || 'Cancelled by seeker',
            cancelled_at: new Date().toISOString()
        };

        const { data: updatedBooking, error: updateError } = await supabase
            .from('activity_logs')
            .update({
                metadata: updatedMetadata,
                description: `${existingBooking.description} - CANCELLED`
            })
            .eq('id', booking_id)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Error cancelling booking:', updateError);
            return res.status(500).json({
                success: false,
                error: 'Failed to cancel booking',
                details: updateError.message
            });
        }

        const blockIds = normalizeBookingBlockIds(existingBooking.metadata?.blocks_booked || []);
        if (blockIds.length > 0 && existingBooking.metadata?.warehouse_id) {
            await releaseWarehouseBlocks(existingBooking.metadata.warehouse_id, blockIds);
        }

        console.log(`✅ Booking ${booking_id} cancelled successfully`);

        return res.json({
            success: true,
            booking: {
                id: updatedBooking.id,
                status: 'cancelled',
                cancelled_at: updatedMetadata.cancelled_at
            },
            message: 'Booking cancelled successfully'
        });

    } catch (error) {
        console.error('❌ Cancel booking error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Generate invoice for a booking
 * Returns invoice data in JSON format
 */
export const generateInvoice: RequestHandler = async (req, res) => {
    try {
        const { booking_id } = req.params;

        if (!booking_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing booking_id'
            });
        }

        console.log(`📄 Generating invoice for booking ${booking_id}`);

        // Fetch the booking
        const { data: booking, error: bookingError } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('id', booking_id)
            .eq('type', 'booking')
            .single();

        if (bookingError || !booking) {
            console.error('❌ Booking not found:', bookingError);
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        const metadata = booking.metadata || {};

        // Only generate invoice for approved bookings
        if (metadata.booking_status !== 'approved') {
            return res.status(400).json({
                success: false,
                error: 'Invoice can only be generated for approved bookings'
            });
        }

        // Fetch warehouse details from database for accurate data
        let warehouseData: any = null;
        const warehouseId = metadata.warehouse_id;
        if (warehouseId) {
            // Try by wh_id first (LIC format)
            let { data: wh } = await supabase
                .from('warehouses')
                .select('name, address, city, state, total_area, price_per_sqft, owner_id')
                .eq('wh_id', warehouseId)
                .maybeSingle();

            // Try by id (UUID format)
            if (!wh) {
                const { data: whById } = await supabase
                    .from('warehouses')
                    .select('name, address, city, state, total_area, price_per_sqft, owner_id')
                    .eq('id', warehouseId)
                    .maybeSingle();
                wh = whById;
            }
            warehouseData = wh;
        }

        // Use warehouse DB data as fallback for missing metadata
        const areaSqft = metadata.area_sqft || warehouseData?.total_area || 0;
        const pricePerSqft = warehouseData?.price_per_sqft || 0;

        // Calculate invoice details
        const startDate = new Date(metadata.start_date);
        const endDate = new Date(metadata.end_date);
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Recalculate amount properly: area * price_per_sqft * months (or use stored amount)
        const durationMonths = Math.max(1, Math.ceil(durationDays / 30));
        const calculatedAmount = areaSqft * pricePerSqft * durationMonths;
        const baseAmount = metadata.total_amount && metadata.total_amount > 0 
            ? metadata.total_amount 
            : calculatedAmount > 0 ? calculatedAmount : 0;
        const tax = baseAmount * 0.18; // 18% GST
        const insurance = baseAmount * 0.02; // 2% insurance
        const totalAmount = baseAmount + tax + insurance;

        const invoice = {
            invoice_id: `INV-${booking.id.substring(0, 8).toUpperCase()}`,
            booking_id: booking.id,
            invoice_date: new Date().toISOString(),

            // Customer details
            customer: {
                name: metadata.customer_details?.name || 'N/A',
                email: metadata.customer_details?.email || 'N/A',
                phone: metadata.customer_details?.phone || 'N/A'
            },

            // Warehouse details
            warehouse: {
                name: warehouseData?.name || metadata.warehouse_name || 'Unknown Warehouse',
                location: `${warehouseData?.city || metadata.warehouse_city || 'Unknown'}, ${warehouseData?.state || metadata.warehouse_state || 'Unknown'}`,
                address: warehouseData?.address || metadata.warehouse_address || 'Address not available'
            },

            // Booking details
            booking: {
                start_date: metadata.start_date,
                end_date: metadata.end_date,
                duration_days: durationDays,
                duration_months: durationMonths,
                area_sqft: areaSqft,
                price_per_sqft: pricePerSqft,
                booking_type: metadata.booking_type || 'standard',
                goods_type: metadata.goods_type || 'General Goods'
            },

            // Pricing
            pricing: {
                base_amount: baseAmount,
                tax: tax,
                tax_rate: '18% GST',
                insurance: insurance,
                insurance_rate: '2% Insurance',
                total_amount: totalAmount,
                currency: 'INR',
                payment_method: metadata.payment_method || 'N/A'
            },

            // Status
            status: 'paid',
            created_at: booking.created_at,
            approved_at: metadata.status_updated_at || booking.created_at
        };

        console.log(`✅ Invoice generated for booking ${booking_id}`);

        return res.json({
            success: true,
            invoice
        });

    } catch (error) {
        console.error('❌ Generate invoice error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
