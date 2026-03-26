import { RequestHandler } from "express";
import { supabase } from '../lib/supabaseClient';

console.log('📅 Schedule Visit module loaded');

/**
 * Schedule a warehouse visit
 * Creates a visit request and notifies the owner
 */
export const scheduleVisit: RequestHandler = async (req, res) => {
    try {
        const {
            warehouseId,
            warehouseName,
            warehouseLocation,
            ownerId,
            seekerId,
            visitorDetails,
            visitDate,
            visitTime,
            purpose,
            notes,
        } = req.body;

        console.log(`📅 Scheduling visit for warehouse: ${warehouseName}`);

        if (!warehouseId || !visitDate || !visitTime || !visitorDetails?.name || !visitorDetails?.email) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Create visit request in activity_logs
        const visitData = {
            seeker_id: seekerId || 'anonymous',
            type: 'visit_request',
            description: `Visit scheduled for ${warehouseName} on ${visitDate} at ${visitTime}`,
            metadata: {
                warehouse_id: warehouseId,
                warehouse_name: warehouseName,
                warehouse_location: warehouseLocation,
                owner_id: ownerId,
                visitor_details: visitorDetails,
                visit_date: visitDate,
                visit_time: visitTime,
                purpose: purpose,
                notes: notes,
                status: 'pending',
                created_at: new Date().toISOString()
            }
        };

        const { data: visitLog, error: visitError } = await supabase
            .from('activity_logs')
            .insert(visitData)
            .select()
            .single();

        if (visitError) {
            console.error('❌ Error creating visit request:', visitError);
            return res.status(500).json({
                success: false,
                error: 'Failed to schedule visit',
                details: visitError.message
            });
        }

        // Create notification for owner
        const ownerNotificationId = ownerId || '550e8400-e29b-41d4-a716-446655440002'; // Demo owner ID

        const notificationData = {
            seeker_id: ownerNotificationId,
            type: 'notification',
            description: `New visit request from ${visitorDetails.name} for ${warehouseName}`,
            metadata: {
                notification_type: 'visit_request',
                title: 'New Visit Request',
                message: `${visitorDetails.name} wants to visit ${warehouseName} on ${visitDate} at ${visitTime}`,
                visit_id: visitLog.id,
                warehouse_id: warehouseId,
                warehouse_name: warehouseName,
                visitor_name: visitorDetails.name,
                visitor_email: visitorDetails.email,
                visitor_phone: visitorDetails.phone,
                visit_date: visitDate,
                visit_time: visitTime,
                purpose: purpose,
                is_read: false,
                created_at: new Date().toISOString()
            }
        };

        await supabase.from('activity_logs').insert(notificationData);

        console.log(`✅ Visit scheduled successfully: ${visitLog.id}`);

        return res.json({
            success: true,
            visitId: visitLog.id,
            message: 'Visit scheduled successfully. Owner has been notified.'
        });

    } catch (error) {
        console.error('❌ Schedule visit error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get visit requests for owner
 */
export const getOwnerVisitRequests: RequestHandler = async (req, res) => {
    try {
        const { owner_id } = req.query;

        console.log(`📋 Fetching visit requests for owner: ${owner_id}`);

        const { data: visits, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('type', 'visit_request')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching visits:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch visit requests'
            });
        }

        // Filter visits for this owner (or return all for demo)
        const ownerVisits = visits?.filter(v => 
            !owner_id || v.metadata?.owner_id === owner_id
        ).map(v => ({
            id: v.id,
            warehouse_name: v.metadata?.warehouse_name,
            warehouse_location: v.metadata?.warehouse_location,
            visitor_name: v.metadata?.visitor_details?.name,
            visitor_email: v.metadata?.visitor_details?.email,
            visitor_phone: v.metadata?.visitor_details?.phone,
            visit_date: v.metadata?.visit_date,
            visit_time: v.metadata?.visit_time,
            purpose: v.metadata?.purpose,
            notes: v.metadata?.notes,
            status: v.metadata?.status || 'pending',
            created_at: v.created_at
        })) || [];

        return res.json({
            success: true,
            visits: ownerVisits,
            total: ownerVisits.length
        });

    } catch (error) {
        console.error('❌ Get visits error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

/**
 * Update visit request status
 */
export const updateVisitStatus: RequestHandler = async (req, res) => {
    try {
        const { visitId, status, ownerNotes } = req.body;

        console.log(`📝 Updating visit ${visitId} status to: ${status}`);

        if (!visitId || !status) {
            return res.status(400).json({
                success: false,
                error: 'Missing visitId or status'
            });
        }

        if (!['confirmed', 'cancelled', 'completed', 'rescheduled'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        // Get existing visit
        const { data: existingVisit, error: fetchError } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('id', visitId)
            .eq('type', 'visit_request')
            .single();

        if (fetchError || !existingVisit) {
            return res.status(404).json({
                success: false,
                error: 'Visit request not found'
            });
        }

        // Update status
        const updatedMetadata = {
            ...existingVisit.metadata,
            status: status,
            owner_notes: ownerNotes,
            status_updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
            .from('activity_logs')
            .update({ metadata: updatedMetadata })
            .eq('id', visitId);

        if (updateError) {
            console.error('❌ Error updating visit:', updateError);
            return res.status(500).json({
                success: false,
                error: 'Failed to update visit status'
            });
        }

        // Notify seeker about status change
        if (existingVisit.seeker_id && existingVisit.seeker_id !== 'anonymous') {
            await supabase.from('activity_logs').insert({
                seeker_id: existingVisit.seeker_id,
                type: 'notification',
                description: `Your visit to ${existingVisit.metadata?.warehouse_name} has been ${status}`,
                metadata: {
                    notification_type: 'visit_update',
                    title: `Visit ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    message: `Your visit request for ${existingVisit.metadata?.warehouse_name} on ${existingVisit.metadata?.visit_date} has been ${status}.`,
                    visit_id: visitId,
                    status: status,
                    owner_notes: ownerNotes,
                    is_read: false,
                    created_at: new Date().toISOString()
                }
            });
        }

        console.log(`✅ Visit ${visitId} status updated to ${status}`);

        return res.json({
            success: true,
            message: `Visit ${status} successfully`
        });

    } catch (error) {
        console.error('❌ Update visit status error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
