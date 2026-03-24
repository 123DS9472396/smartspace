import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://bsrzqffxgvdebyofmhzg.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, serviceRoleKey);

export const getAdminUserActivity: RequestHandler = async (req, res) => {
  try {
    const userId = String(req.query.user_id || "");
    const userType = String(req.query.user_type || "");

    if (!userId || !userType) {
      return res.status(400).json({ success: false, error: 'user_id and user_type are required' });
    }

    let activityQuery = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (userType === 'seeker') {
      activityQuery = activityQuery.eq('seeker_id', userId);
    } else if (userType === 'owner') {
      activityQuery = activityQuery.filter('metadata->>warehouse_owner_id', 'eq', userId);
    }

    const { data: activities, error } = await activityQuery;

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, activities: activities || [] });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch user activity' });
  }
};
