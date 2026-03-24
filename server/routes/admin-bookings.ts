import { RequestHandler } from "express";
import { createClient } from '@supabase/supabase-js';

// Create Supabase client inline to avoid module resolution issues in Vite
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://bsrzqffxgvdebyofmhzg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('📦 admin-bookings: key role:', supabaseKey.includes('service_role') ? 'service_role ✅' : 'anon ⚠️');

console.log('📦 Admin Bookings module loaded - Supabase URL:', supabaseUrl.substring(0, 30) + '...');

// Get all bookings for admin dashboard
export const getAdminBookings: RequestHandler = async (req, res) => {
    try {
        console.log('📊 Fetching admin bookings...');

        // Fetch all booking activity logs
        const { data: bookingLogs, error: logsError } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('type', 'booking')
            .order('created_at', { ascending: false });

        if (logsError) {
            console.error('❌ Error fetching booking logs:', logsError);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch bookings',
                details: logsError.message
            });
        }

        // Transform activity logs into admin booking format
        const adminBookings = bookingLogs?.map(log => {
            const metadata = log.metadata || {};

            return {
                id: log.id,
                seeker_id: log.seeker_id,
                seeker_name: metadata.customer_details?.name || 'Unknown Seeker',
                seeker_email: metadata.customer_details?.email || 'No email provided',
                warehouse_id: metadata.warehouse_id,
                warehouse_name: metadata.warehouse_name || 'Unknown Warehouse',
                warehouse_location: `${metadata.warehouse_city || 'Unknown'}, ${metadata.warehouse_state || 'Unknown'}`,
                warehouse_address: metadata.warehouse_address || 'Address not available',
                start_date: metadata.start_date,
                end_date: metadata.end_date,
                total_amount: metadata.total_amount || metadata.monthly_rent,
                area_sqft: metadata.area_sqft,
                blocks_booked: metadata.blocks_booked || [],
                payment_method: metadata.payment_method,
                status: metadata.booking_status || 'pending',
                created_at: log.created_at,
                booking_notes: log.description,
                booking_type: metadata.booking_type || 'standard'
            };
        }) || [];

        console.log(`✅ Found ${adminBookings.length} bookings for admin dashboard`);

        return res.json({
            success: true,
            bookings: adminBookings,
            total: adminBookings.length
        });

    } catch (error) {
        console.error('❌ Admin bookings error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Update booking status (approve/reject)
export const updateBookingStatus: RequestHandler = async (req, res) => {
    try {
        const { bookingId, status, adminNotes } = req.body;

        console.log(`📝 Updating booking ${bookingId} status to: ${status}`);

        if (!bookingId || !status) {
            return res.status(400).json({
                success: false,
                error: 'Missing bookingId or status'
            });
        }

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be approved, rejected, or pending'
            });
        }

        // Update the booking status in activity_logs
        const { data: existingLog, error: fetchError } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('id', bookingId)
            .eq('type', 'booking')
            .single();

        if (fetchError || !existingLog) {
            console.error('❌ Booking not found:', fetchError);
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Update metadata with new status and admin notes
        const updatedMetadata = {
            ...existingLog.metadata,
            booking_status: status,
            admin_notes: adminNotes || '',
            status_updated_at: new Date().toISOString(),
            status_updated_by: 'admin'
        };

        const { data: updatedLog, error: updateError } = await supabase
            .from('activity_logs')
            .update({
                metadata: updatedMetadata,
                description: `${existingLog.description} - Status: ${status.toUpperCase()}`
            })
            .eq('id', bookingId)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Error updating booking status:', updateError);
            return res.status(500).json({
                success: false,
                error: 'Failed to update booking status',
                details: updateError.message
            });
        }

        console.log(`✅ Booking ${bookingId} status updated to ${status}`);

        return res.json({
            success: true,
            booking: {
                id: updatedLog.id,
                status: status,
                admin_notes: adminNotes,
                updated_at: new Date().toISOString()
            },
            message: `Booking ${status} successfully`
        });

    } catch (error) {
        console.error('❌ Update booking status error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get booking statistics for admin dashboard
export const getBookingStats: RequestHandler = async (req, res) => {
    try {
        console.log('📈 Fetching booking statistics...');

        const { data: bookingLogs, error: logsError } = await supabase
            .from('activity_logs')
            .select('metadata, created_at')
            .eq('type', 'booking');

        if (logsError) {
            console.error('❌ Error fetching booking stats:', logsError);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch booking statistics'
            });
        }

        const stats = {
            total_bookings: bookingLogs?.length || 0,
            pending_bookings: 0,
            approved_bookings: 0,
            rejected_bookings: 0,
            total_revenue: 0,
            new_bookings_24h: 0
        };

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        bookingLogs?.forEach(log => {
            const metadata = log.metadata || {};
            const status = metadata.booking_status || 'pending';
            const createdAt = new Date(log.created_at);

            // Count by status
            if (status === 'pending') stats.pending_bookings++;
            else if (status === 'approved') stats.approved_bookings++;
            else if (status === 'rejected') stats.rejected_bookings++;

            // Sum revenue for approved bookings
            if (status === 'approved' && metadata.total_amount) {
                stats.total_revenue += metadata.total_amount;
            }

            // Count new bookings in last 24 hours
            if (createdAt > twentyFourHoursAgo) {
                stats.new_bookings_24h++;
            }
        });

        console.log('✅ Booking statistics calculated:', stats);

        return res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('❌ Booking stats error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
