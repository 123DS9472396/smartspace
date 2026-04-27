import { supabase } from "./lib/supabaseClient";
import { releaseWarehouseBlocks } from "./routes/bookings";

/**
 * Auto-expire bookings whose end_date has passed
 * - Sets booking_status to 'completed'
 * - Releases booked blocks
 */
export async function autoExpireBookings() {
  const now = new Date();
  const nowISO = now.toISOString();

  // Find all approved bookings where end_date < now
  const { data: bookings, error } = await supabase
    .from("activity_logs")
    .select("id, metadata")
    .eq("type", "booking")
    .eq("metadata->>booking_status", "approved")
    .lt("metadata->>end_date", nowISO);

  if (error) {
    console.error("❌ Error fetching bookings for auto-expiry:", error);
    return;
  }

  for (const booking of bookings || []) {
    const meta = booking.metadata || {};
    const blockIds = (meta.blocks_booked || []).map((b: any, idx: number) => {
      if (typeof b === "string") return b;
      if (b?.id) return String(b.id);
      return `block_${b?.block_number || idx + 1}`;
    });
    // Update booking status
    const updatedMeta = {
      ...meta,
      booking_status: "completed",
      completed_at: nowISO
    };
    await supabase
      .from("activity_logs")
      .update({ metadata: updatedMeta, description: `${booking.description || ""} - COMPLETED` })
      .eq("id", booking.id);
    // Release blocks
    if (meta.warehouse_id && blockIds.length > 0) {
      await releaseWarehouseBlocks(meta.warehouse_id, blockIds);
    }
    console.log(`✅ Auto-expired booking ${booking.id}`);
  }
}

// If run directly (node server/autoExpireBookings.js), execute
if (require.main === module) {
  autoExpireBookings().then(() => process.exit(0));
}
