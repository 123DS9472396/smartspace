import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: logs, error } = await supabase.from('activity_logs').select('*').eq('type', 'booking').order('created_at', { ascending: false }).limit(20);
    if (error) {
        console.error(error);
        return;
    }
    
    console.log("Found bookings:", logs.length);
    logs.forEach(l => {
        console.log(`[${l.created_at}] ID: ${l.id} | WH_ID: ${l.metadata?.warehouse_id} | Status: ${l.metadata?.booking_status} | Owner: ${l.metadata?.warehouse_owner_id} | Name: ${l.metadata?.warehouse_name}`);
    });
}
main();
