import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://bsrzqffxgvdebyofmhzg.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Normalize block IDs from any format
const normalizeBlockIds = (blocks: any[]): string[] =>
  (blocks || []).map((b: any, idx: number) => {
    if (typeof b === "number") return `block_${b}`;
    if (typeof b === "string") return b;
    if (b?.id) return String(b.id);
    return `block_${Number(b?.block_number || idx + 1)}`;
  });

// Update block states for a warehouse (approve → occupied, reject/cancel → available)
const updateBlocksForOwnerAction = async (
  warehouseId: string,
  blockIds: string[],
  newStatus: "approved" | "rejected",
  bookingMeta: any,
  bookingId: string,
) => {
  if (!warehouseId || !blockIds.length) return;

  let warehouseData: any = null;
  let table = "warehouses";
  let col = "wh_id";

  let { data: byWhId } = await supabase
    .from("warehouses")
    .select("id, wh_id, blocks, total_blocks")
    .eq("wh_id", warehouseId)
    .maybeSingle();

  if (!byWhId) {
    const { data: byId } = await supabase
      .from("warehouses")
      .select("id, wh_id, blocks, total_blocks")
      .eq("id", warehouseId)
      .maybeSingle();
    byWhId = byId;
    col = "id";
  }

  if (byWhId) {
    warehouseData = byWhId;
  } else {
    const { data: sub } = await supabase
      .from("warehouse_submissions")
      .select("id, blocks, total_blocks")
      .eq("id", warehouseId)
      .eq("status", "approved")
      .maybeSingle();
    if (sub) {
      warehouseData = sub;
      table = "warehouse_submissions";
      col = "id";
    }
  }

  if (
    !warehouseData ||
    !Array.isArray(warehouseData.blocks) ||
    !warehouseData.blocks.length
  )
    return;

  const nextState = newStatus === "approved" ? "occupied" : "available";
  const blockSet = new Set(blockIds);

  const updatedBlocks = warehouseData.blocks.map((block: any) => {
    const id = String(block?.id || `block_${block?.block_number}`);
    if (!blockSet.has(id)) return block;
    if (nextState === "available") {
      return {
        ...block,
        status: "available",
        booking_id: null,
        booked_by: null,
        booking_dates: null,
        reserved_at: null,
        occupied_at: null,
      };
    }
    return {
      ...block,
      status: nextState,
      booking_id: bookingId,
      booked_by: bookingMeta?.customer_details?.email || "owner",
      booking_dates: {
        start: bookingMeta?.start_date,
        end: bookingMeta?.end_date,
      },
      reserved_at: block.reserved_at || new Date().toISOString(),
      occupied_at: nextState === "occupied" ? new Date().toISOString() : null,
    };
  });

  const total = Number(warehouseData.total_blocks) || updatedBlocks.length;
  const unavailable = updatedBlocks.filter((b: any) =>
    ["reserved", "occupied", "booked"].includes(String(b.status)),
  ).length;

  await supabase
    .from(table)
    .update({
      blocks: updatedBlocks,
      available_blocks: Math.max(0, total - unavailable),
      occupancy: total > 0 ? unavailable / total : 0,
    })
    .eq(col, col === "wh_id" ? warehouseId : warehouseData.id);
};

/**
 * GET /api/owner/bookings?owner_id=<uuid>
 * Returns all bookings for warehouses owned by this user,
 * regardless of whether warehouse_owner_id was stored in the booking metadata.
 */
export const getOwnerBookings: RequestHandler = async (req, res) => {
  const { owner_id } = req.query;
  if (!owner_id)
    return res.status(400).json({ success: false, error: "Missing owner_id" });

  try {
    // Find all warehouse IDs owned by this user (warehouses + approved submissions)
    const [{ data: warehouses }, { data: submissions }] = await Promise.all([
      supabase
        .from("warehouses")
        .select("id, wh_id, name")
        .eq("owner_id", String(owner_id)),
      supabase
        .from("warehouse_submissions")
        .select("id, name")
        .eq("owner_id", String(owner_id))
        .eq("status", "approved"),
    ]);

    const warehouseIdSet = new Set<string>();
    (warehouses || []).forEach((w) => {
      if (w.id) warehouseIdSet.add(String(w.id));
      if (w.wh_id) warehouseIdSet.add(String(w.wh_id));
    });
    (submissions || []).forEach((s) => {
      if (s.id) warehouseIdSet.add(String(s.id));
    });

    if (!warehouseIdSet.size) {
      return res.json({ success: true, bookings: [] });
    }

    // Fetch all bookings - then filter server-side by warehouse_id in metadata
    const { data: allBookings, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("type", "booking")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching bookings for owner:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const ownerBookings = (allBookings || []).filter((b) => {
      const wid = String(b.metadata?.warehouse_id || "");
      return wid && warehouseIdSet.has(wid);
    });

    const formatted = ownerBookings.map((b) => ({
      id: b.id,
      created_at: b.created_at,
      seeker_id: b.seeker_id,
      booking_status: b.metadata?.booking_status || "pending",
      warehouse_id: b.metadata?.warehouse_id || "",
      warehouse_name: b.metadata?.warehouse_name || "Warehouse",
      warehouse_address: b.metadata?.warehouse_address || "",
      warehouse_city: b.metadata?.warehouse_city || "",
      warehouse_state: b.metadata?.warehouse_state || "",
      seeker_name: b.metadata?.customer_details?.name || "Customer",
      seeker_email: b.metadata?.customer_details?.email || "",
      seeker_phone: b.metadata?.customer_details?.phone || "",
      blocks_booked: b.metadata?.blocks_booked || [],
      area_sqft: b.metadata?.area_sqft || 0,
      start_date: b.metadata?.start_date || "",
      end_date: b.metadata?.end_date || "",
      total_amount: b.metadata?.total_amount || 0,
      payment_method: b.metadata?.payment_method || "N/A",
      goods_type: b.metadata?.goods_type || "",
      booking_type: b.metadata?.booking_type || "standard",
      admin_notes: b.metadata?.admin_notes || "",
      owner_action: b.metadata?.owner_action || null,
    }));

    return res.json({ success: true, bookings: formatted });
  } catch (err) {
    console.error("❌ Owner bookings error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

/**
 * POST /api/owner/bookings/respond
 * Owner approves or rejects a booking for their warehouse.
 * Body: { booking_id, owner_id, action: 'approve' | 'reject', notes? }
 */
export const respondToBooking: RequestHandler = async (req, res) => {
  const { booking_id, owner_id, action, notes } = req.body;

  if (!booking_id || !owner_id || !["approve", "reject"].includes(action)) {
    return res
      .status(400)
      .json({
        success: false,
        error: "Missing booking_id, owner_id, or invalid action",
      });
  }

  try {
    // Fetch the booking
    const { data: booking, error: fetchErr } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("id", booking_id)
      .eq("type", "booking")
      .single();

    if (fetchErr || !booking) {
      return res
        .status(404)
        .json({ success: false, error: "Booking not found" });
    }

    const currentStatus = booking.metadata?.booking_status || "pending";
    if (currentStatus !== "pending") {
      return res
        .status(409)
        .json({
          success: false,
          error: `Booking is already ${currentStatus}. Only pending bookings can be responded to.`,
        });
    }

    const warehouseId = booking.metadata?.warehouse_id;
    if (!warehouseId) {
      return res
        .status(400)
        .json({ success: false, error: "Booking missing warehouse_id" });
    }

    // Verify that this owner owns the warehouse
    const [{ data: mainWh }, { data: subWh }] = await Promise.all([
      supabase
        .from("warehouses")
        .select("id")
        .or(`wh_id.eq.${warehouseId},id.eq.${warehouseId}`)
        .eq("owner_id", owner_id)
        .maybeSingle(),
      supabase
        .from("warehouse_submissions")
        .select("id")
        .eq("id", warehouseId)
        .eq("owner_id", owner_id)
        .maybeSingle(),
    ]);

    if (!mainWh && !subWh) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Not authorized to manage this warehouse",
        });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    const updatedMetadata = {
      ...booking.metadata,
      booking_status: newStatus,
      owner_action: action,
      owner_notes: notes || "",
      owner_action_at: new Date().toISOString(),
      status_updated_at: new Date().toISOString(),
    };

    // Update booking status
    const { error: updateErr } = await supabase
      .from("activity_logs")
      .update({ metadata: updatedMetadata })
      .eq("id", booking_id);

    if (updateErr) {
      return res.status(500).json({ success: false, error: updateErr.message });
    }

    // Update block states
    const blockIds = normalizeBlockIds(booking.metadata?.blocks_booked || []);
    if (blockIds.length > 0) {
      await updateBlocksForOwnerAction(
        warehouseId,
        blockIds,
        newStatus,
        booking.metadata,
        booking_id,
      );
    }

    // Notify the seeker about the decision
    if (booking.seeker_id) {
      const statusLabel = newStatus === "approved" ? "approved" : "rejected";
      await supabase.from("activity_logs").insert({
        seeker_id: booking.seeker_id,
        type: "notification",
        description: `Your booking for ${booking.metadata?.warehouse_name || "the warehouse"} has been ${statusLabel} by the property owner`,
        metadata: {
          notification_type: `booking_${statusLabel}`,
          booking_id,
          warehouse_id: warehouseId,
          warehouse_name: booking.metadata?.warehouse_name || "",
          booking_status: newStatus,
          start_date: booking.metadata?.start_date,
          end_date: booking.metadata?.end_date,
          total_amount: booking.metadata?.total_amount,
          owner_notes: notes || "",
          read: false,
        },
      });
    }

    console.log(`✅ Owner ${owner_id} ${action}d booking ${booking_id}`);
    return res.json({
      success: true,
      message: `Booking ${newStatus} by owner`,
      status: newStatus,
    });
  } catch (err) {
    console.error("❌ Owner booking respond error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};
