import { RequestHandler } from "express";
import { supabase } from '../lib/supabaseClient';

/**
 * GET /api/admin/dashboard-stats
 * Returns comprehensive real-time dashboard statistics from ALL tables.
 * Uses the service role key so it bypasses RLS and works for demo sessions.
 */
export const getDashboardStats: RequestHandler = async (_req, res) => {
  try {
    console.log(
      "📊 [dashboard-stats] Fetching comprehensive dashboard data...",
    );

    // ── Wave 1: Core counts + data (parallelized) ──
    const [
      seekersRes,
      ownersRes,
      profilesRes,
      warehouseCountRes,
      warehouseDataRes,
      submissionsRes,
      verificationsRes,
      bookingsRes,
      notificationsRes,
      inquiriesRes,
      visitsRes,
      reviewsRes,
      paymentsRes,
      savedRes,
      recentUserSignups,
    ] = await Promise.all([
      supabase
        .from("seeker_profiles")
        .select("id, created_at, is_active, verification_status", {
          count: "exact",
        }),
      supabase
        .from("owner_profiles")
        .select(
          "id, created_at, is_active, verification_status, total_warehouses, total_bookings",
          { count: "exact" },
        ),
      supabase
        .from("profiles")
        .select("id, user_type, created_at, is_verified"),
      supabase.from("warehouses").select("id", { count: "exact", head: true }),
      supabase
        .from("warehouses")
        .select(
          "id, name, city, district, state, total_area, price_per_sqft, occupancy, rating, reviews_count, warehouse_type, status, owner_id, created_at, is_verified",
        ),
      supabase
        .from("warehouse_submissions")
        .select(
          "id, status, owner_id, name, city, state, created_at, reviewed_at",
        ),
      supabase
        .from("verification_queue")
        .select(
          "id, status, user_name, company_name, profile_type, created_at, ml_score",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_logs")
        .select("id, seeker_id, type, description, metadata, created_at")
        .in("type", ["booking", "visit_request", "inquiry", "cancellation"])
        .order("created_at", { ascending: false }),
      supabase
        .from("admin_notifications")
        .select("id, notification_type, title, message, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("inquiries").select("id, status, created_at").limit(500),
      supabase
        .from("activity_logs")
        .select("id, metadata, created_at")
        .eq("type", "visit_request")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("reviews")
        .select("id, rating, warehouse_id, created_at")
        .limit(500),
      supabase
        .from("payment_transactions")
        .select("id, amount, payment_status, payment_method, created_at")
        .limit(500),
      supabase
        .from("saved_warehouses")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id, name, email, user_type, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    // ── User Stats ──
    const seekers = seekersRes.data || [];
    const owners = ownersRes.data || [];
    const allProfiles = profilesRes.data || [];
    const seekerCount = seekersRes.count ?? seekers.length;
    const ownerCount = ownersRes.count ?? owners.length;
    const adminCount = allProfiles.filter(
      (p: any) => p.user_type === "admin",
    ).length;
    const totalUsers = seekerCount + ownerCount + adminCount;
    const verifiedSeekers = seekers.filter(
      (s: any) =>
        s.verification_status === "approved" ||
        s.verification_status === "verified",
    ).length;
    const verifiedOwners = owners.filter(
      (o: any) =>
        o.verification_status === "approved" ||
        o.verification_status === "verified",
    ).length;

    // User growth (last 30 days vs prior 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);
    const newUsersLast30 = allProfiles.filter(
      (p: any) => new Date(p.created_at) >= thirtyDaysAgo,
    ).length;
    const newUsersPrior30 = allProfiles.filter((p: any) => {
      const d = new Date(p.created_at);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    }).length;
    const userGrowthPct =
      newUsersPrior30 > 0
        ? Math.round(
            ((newUsersLast30 - newUsersPrior30) / newUsersPrior30) * 100,
          )
        : newUsersLast30 > 0
          ? 100
          : 0;

    // ── Warehouse Stats ──
    const warehouses = warehouseDataRes.data || [];
    const totalWarehouses = warehouseCountRes.count ?? warehouses.length;
    const activeWarehouses = warehouses.filter(
      (w: any) => w.status === "active",
    ).length;
    const verifiedWarehouses = warehouses.filter(
      (w: any) => w.is_verified,
    ).length;

    // Storage capacity
    const totalStorageSqft = warehouses.reduce(
      (s: number, w: any) => s + (Number(w.total_area) || 0),
      0,
    );
    const occupiedStorageSqft = warehouses.reduce((s: number, w: any) => {
      const area = Number(w.total_area) || 0;
      const occ = Number(w.occupancy) || 0;
      return s + Math.round(area * occ);
    }, 0);
    const availableStorageSqft = Math.max(
      0,
      totalStorageSqft - occupiedStorageSqft,
    );
    const avgOccupancy =
      warehouses.length > 0
        ? warehouses.reduce(
            (s: number, w: any) => s + (Number(w.occupancy) || 0),
            0,
          ) / warehouses.length
        : 0;

    // Average metrics
    const avgRating =
      warehouses.length > 0
        ? warehouses.reduce(
            (s: number, w: any) => s + (Number(w.rating) || 0),
            0,
          ) / warehouses.length
        : 0;
    const avgPricePerSqft =
      warehouses.length > 0
        ? warehouses.reduce(
            (s: number, w: any) => s + (Number(w.price_per_sqft) || 0),
            0,
          ) / warehouses.length
        : 0;

    // City distribution (top 10)
    const cityMap: Record<string, number> = {};
    warehouses.forEach((w: any) => {
      if (w.city) cityMap[w.city] = (cityMap[w.city] || 0) + 1;
    });
    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    // Warehouse type distribution
    const typeMap: Record<string, number> = {};
    warehouses.forEach((w: any) => {
      if (w.warehouse_type)
        typeMap[w.warehouse_type] = (typeMap[w.warehouse_type] || 0) + 1;
    });
    const warehouseTypes = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    // Top 5 warehouses by rating
    const topWarehouses = [...warehouses]
      .filter((w: any) => w.rating > 0)
      .sort(
        (a: any, b: any) => (Number(b.rating) || 0) - (Number(a.rating) || 0),
      )
      .slice(0, 5)
      .map((w: any) => ({
        id: w.id,
        name: w.name,
        city: w.city,
        rating: Number(w.rating) || 0,
        occupancy: Math.round((Number(w.occupancy) || 0) * 100),
        area: Number(w.total_area) || 0,
      }));

    // ── Submission Stats ──
    const allSubs = submissionsRes.data || [];
    const pendingWarehouseSubmissions = allSubs.filter(
      (s: any) => s.status === "pending",
    ).length;
    const approvedSubmissions = allSubs.filter(
      (s: any) => s.status === "approved",
    ).length;
    const rejectedSubmissions = allSubs.filter(
      (s: any) => s.status === "rejected",
    ).length;

    // ── Verification Stats ──
    const allVerifs = verificationsRes.data || [];
    const pendingVerifications = allVerifs.filter(
      (v: any) => v.status === "pending",
    ).length;
    const totalVerificationRequests = allVerifs.length;

    // ── Booking Stats (from activity_logs) ──
    const allActivityLogs = bookingsRes.data || [];
    const bookings = allActivityLogs.filter((b: any) => b.type === "booking");
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(
      (b: any) => b.metadata?.booking_status === "pending",
    ).length;
    const approvedBookings = bookings.filter(
      (b: any) => b.metadata?.booking_status === "approved",
    ).length;
    const rejectedBookings = bookings.filter(
      (b: any) => b.metadata?.booking_status === "rejected",
    ).length;
    const cancelledBookings = bookings.filter(
      (b: any) => b.metadata?.booking_status === "cancelled",
    ).length;
    const totalRevenue = bookings.reduce((sum: number, b: any) => {
      if (b.metadata?.booking_status === "approved") {
        return sum + (parseFloat(b.metadata?.total_amount) || 0);
      }
      return sum;
    }, 0);
    const avgBookingValue =
      approvedBookings > 0 ? totalRevenue / approvedBookings : 0;
    const bookingConversionRate =
      totalBookings > 0
        ? Math.round((approvedBookings / totalBookings) * 100)
        : 0;

    // Revenue breakdown by city
    const revenueByCityMap: Record<string, number> = {};
    bookings.forEach((b: any) => {
      if (
        b.metadata?.booking_status === "approved" &&
        b.metadata?.warehouse_city
      ) {
        const city = b.metadata.warehouse_city;
        revenueByCityMap[city] =
          (revenueByCityMap[city] || 0) +
          (parseFloat(b.metadata.total_amount) || 0);
      }
    });
    const revenueByCity = Object.entries(revenueByCityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, revenue]) => ({ city, revenue: Math.round(revenue) }));

    // ── Booking trend (last 6 months) ──
    const bookingTrend: Array<{
      label: string;
      count: number;
      revenue: number;
    }> = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setDate(1);
      start.setMonth(start.getMonth() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const label = start.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });
      const monthBookings = bookings.filter((b: any) => {
        const created = new Date(b.created_at);
        return created >= start && created < end;
      });
      const revenue = monthBookings.reduce((sum: number, b: any) => {
        if (b.metadata?.booking_status === "approved") {
          return sum + (parseFloat(b.metadata?.total_amount) || 0);
        }
        return sum;
      }, 0);
      bookingTrend.push({
        label,
        count: monthBookings.length,
        revenue: Math.round(revenue),
      });
    }

    // ── Inquiry & Visit Stats ──
    const inquiries = inquiriesRes.data || [];
    const totalInquiries = inquiries.length;
    const openInquiries = inquiries.filter(
      (i: any) => i.status === "open",
    ).length;

    const visits = visitsRes.data || [];
    const totalVisits = visits.length;
    const pendingVisits = visits.filter(
      (v: any) =>
        v.metadata?.visit_status === "pending" ||
        v.metadata?.status === "pending",
    ).length;

    // ── Review Stats ──
    const reviews = reviewsRes.data || [];
    const totalReviews = reviews.length;
    const avgReviewRating =
      reviews.length > 0
        ? reviews.reduce(
            (s: number, r: any) => s + (Number(r.rating) || 0),
            0,
          ) / reviews.length
        : 0;

    // ── Payment Stats ──
    const payments = paymentsRes.data || [];
    const completedPayments = payments.filter(
      (p: any) => p.payment_status === "completed",
    );
    const totalPaymentAmount = completedPayments.reduce(
      (s: number, p: any) => s + (Number(p.amount) || 0),
      0,
    );
    const paymentMethodBreakdown: Record<string, number> = {};
    completedPayments.forEach((p: any) => {
      const method = p.payment_method || "unknown";
      paymentMethodBreakdown[method] =
        (paymentMethodBreakdown[method] || 0) + 1;
    });

    // ── Saved/Wishlist Count ──
    const totalSaved = savedRes.count ?? 0;

    // ── Recent Activities (comprehensive, from ALL sources) ──
    const activities: any[] = [];

    // From verification queue (pending)
    allVerifs
      .filter((v: any) => v.status === "pending")
      .slice(0, 5)
      .forEach((v: any) => {
        activities.push({
          id: `verif-${v.id}`,
          type: "verification",
          icon: "shield",
          message: `New ${v.profile_type} verification request from ${v.user_name || "Unknown"}${v.company_name ? ` (${v.company_name})` : ""}`,
          detail: v.ml_score
            ? `ML Score: ${(v.ml_score * 100).toFixed(0)}%`
            : undefined,
          timestamp: v.created_at,
          status: "pending",
        });
      });

    // From bookings
    bookings.slice(0, 8).forEach((b: any) => {
      const status = b.metadata?.booking_status || "pending";
      const wName = b.metadata?.warehouse_name || "Unknown Warehouse";
      const wCity = b.metadata?.warehouse_city || "";
      const amt = parseFloat(b.metadata?.total_amount) || 0;
      const cust =
        b.metadata?.customer_details?.name ||
        b.metadata?.customer_details?.email ||
        "Customer";
      const areaSqft = b.metadata?.area_sqft || 0;
      const statusIcon =
        status === "approved"
          ? "✅"
          : status === "rejected"
            ? "❌"
            : status === "cancelled"
              ? "🚫"
              : "📋";
      activities.push({
        id: `booking-${b.id}`,
        type: "booking",
        icon:
          status === "approved"
            ? "check"
            : status === "rejected"
              ? "x"
              : "clock",
        message: `${statusIcon} ${status.charAt(0).toUpperCase() + status.slice(1)} booking: ${wName}${wCity ? ` (${wCity})` : ""}`,
        detail: `By ${cust} • ${areaSqft.toLocaleString()} sqft • ₹${amt.toLocaleString()}`,
        timestamp: b.created_at,
        status,
      });
    });

    // From warehouse submissions
    allSubs
      .filter((s: any) => s.status === "pending")
      .slice(0, 3)
      .forEach((s: any) => {
        activities.push({
          id: `sub-${s.id}`,
          type: "submission",
          icon: "warehouse",
          message: `New warehouse submission: ${s.name || "Unnamed"}`,
          detail: `${s.city || ""} ${s.state || ""}`.trim() || undefined,
          timestamp: s.created_at,
          status: "pending",
        });
      });

    // From visits
    const visitEntries = allActivityLogs.filter(
      (a: any) => a.type === "visit_request",
    );
    visitEntries.slice(0, 3).forEach((v: any) => {
      activities.push({
        id: `visit-${v.id}`,
        type: "visit",
        icon: "eye",
        message: `Visit request for ${v.metadata?.warehouse_name || "Warehouse"}`,
        detail: v.metadata?.visitor_name
          ? `By ${v.metadata.visitor_name}`
          : undefined,
        timestamp: v.created_at,
        status: v.metadata?.visit_status || v.metadata?.status || "pending",
      });
    });

    // Sort all by timestamp
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // ── Notifications ──
    const notifications = (notificationsRes.data || []).map((n: any) => ({
      id: n.id,
      type: n.notification_type,
      title: n.title,
      message: n.message,
      isRead: n.is_read,
      timestamp: n.created_at,
    }));
    const unreadNotifications = notifications.filter(
      (n: any) => !n.isRead,
    ).length;

    // ── Recent signups ──
    const recentSignups = (recentUserSignups.data || []).map((u: any) => ({
      id: u.id,
      name: u.name || u.email,
      type: u.user_type,
      joinedAt: u.created_at,
    }));

    // ── System health indicators ──
    const systemHealth = {
      dbConnected: true,
      totalTables: 15,
      lastActivity: activities[0]?.timestamp || null,
      avgResponseMs: null, // could be computed from payment processing
    };

    // Log any partial errors
    const errors: string[] = [];
    const resChecks = [
      { name: "seekers", res: seekersRes },
      { name: "owners", res: ownersRes },
      { name: "profiles", res: profilesRes },
      { name: "warehouses", res: warehouseCountRes },
      { name: "warehouseData", res: warehouseDataRes },
      { name: "submissions", res: submissionsRes },
      { name: "verifications", res: verificationsRes },
      { name: "bookings", res: bookingsRes },
      { name: "notifications", res: notificationsRes },
      { name: "inquiries", res: inquiriesRes },
      { name: "visits", res: visitsRes },
      { name: "reviews", res: reviewsRes },
      { name: "payments", res: paymentsRes },
      { name: "saved", res: savedRes },
    ];
    resChecks.forEach(({ name, res: r }) => {
      if (r.error) errors.push(`${name}: ${r.error.message}`);
    });
    if (errors.length)
      console.warn("⚠️ [dashboard-stats] Partial errors:", errors);

    console.log(
      `✅ [dashboard-stats] Users: ${totalUsers} | WH: ${totalWarehouses} | Bookings: ${totalBookings} | Revenue: ₹${totalRevenue}`,
    );

    return res.json({
      success: true,
      stats: {
        // Users
        totalUsers,
        seekerCount,
        ownerCount,
        adminCount,
        verifiedSeekers,
        verifiedOwners,
        newUsersLast30,
        userGrowthPct,
        // Warehouses
        totalWarehouses,
        activeWarehouses,
        verifiedWarehouses,
        totalStorageSqft,
        occupiedStorageSqft,
        availableStorageSqft,
        avgOccupancy: Math.round(avgOccupancy * 100),
        avgRating: Math.round(avgRating * 10) / 10,
        avgPricePerSqft: Math.round(avgPricePerSqft * 100) / 100,
        // Submissions
        pendingWarehouseSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        totalSubmissions: allSubs.length,
        // Verifications
        pendingVerifications,
        totalVerificationRequests,
        // Bookings
        totalBookings,
        pendingBookings,
        approvedBookings,
        rejectedBookings,
        cancelledBookings,
        totalRevenue,
        avgBookingValue: Math.round(avgBookingValue),
        bookingConversionRate,
        // Inquiries & Visits
        totalInquiries,
        openInquiries,
        totalVisits,
        pendingVisits,
        // Reviews & Engagement
        totalReviews,
        avgReviewRating: Math.round(avgReviewRating * 10) / 10,
        totalSaved,
        totalPayments: completedPayments.length,
        totalPaymentAmount: Math.round(totalPaymentAmount),
        // Notifications
        unreadNotifications,
      },
      bookingTrend,
      topCities,
      warehouseTypes,
      topWarehouses,
      revenueByCity,
      paymentMethodBreakdown,
      recentActivities: activities.slice(0, 15),
      notifications: notifications.slice(0, 15),
      recentSignups,
      systemHealth,
      errors: errors.length ? errors : undefined,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ [dashboard-stats] Fatal error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to fetch dashboard statistics",
    });
  }
};

/**
 * GET /api/analytics/admin
 * Returns comprehensive warehouse analytics for admin dashboard
 */
export const getAdminAnalytics: RequestHandler = async (_req, res) => {
  try {
    // Fetch ALL warehouses using pagination (Supabase defaults to 1000 rows max)
    const PAGE_SIZE = 1000;
    let allWarehouses: any[] = [];
    let from = 0;
    let hasMore = true;

    console.log("📊 Fetching all warehouses for analytics...");

    while (hasMore) {
      const { data, error } = await supabase
        .from("warehouses")
        .select(
          "id, wh_id, name, city, district, state, total_area, capacity, price_per_sqft, warehouse_type, status, occupancy, rating, reviews_count, amenities, features, images, created_at, owner_id",
        )
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error("❌ Analytics query error:", error);
        return res.status(500).json({ success: false, error: error.message });
      }

      const batch = data || [];
      allWarehouses = allWarehouses.concat(batch);
      console.log(
        `  📦 Fetched rows ${from}–${from + batch.length - 1} (${batch.length} rows, total so far: ${allWarehouses.length})`,
      );

      if (batch.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        from += PAGE_SIZE;
      }
    }

    console.log(`✅ Total warehouses fetched: ${allWarehouses.length}`);

    const all = allWarehouses;
    const total = all.length;

    // ── 1. State distribution ──
    const stateMap: Record<string, number> = {};
    all.forEach((w) => {
      const s = w.state || "Unknown";
      stateMap[s] = (stateMap[s] || 0) + 1;
    });
    const stateDistribution = Object.entries(stateMap)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    // ── 2. City distribution (top 20) ──
    const cityMap: Record<string, number> = {};
    all.forEach((w) => {
      const c = w.city || "Unknown";
      cityMap[c] = (cityMap[c] || 0) + 1;
    });
    const cityDistribution = Object.entries(cityMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // ── 3. Warehouse type distribution ──
    const typeMap: Record<string, number> = {};
    all.forEach((w) => {
      const t = w.warehouse_type || "General";
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    const typeDistribution = Object.entries(typeMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // ── 4. Price analytics ──
    const prices = all
      .map((w) => Number(w.price_per_sqft) || 0)
      .filter((p) => p > 0);
    const avgPrice = prices.length
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : 0;
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const medianPrice = prices.length
      ? (() => {
          const sorted = [...prices].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          return sorted.length % 2
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
        })()
      : 0;

    // Price range buckets
    const priceRanges = [
      { range: "₹0-5", min: 0, max: 5, count: 0 },
      { range: "₹5-10", min: 5, max: 10, count: 0 },
      { range: "₹10-20", min: 10, max: 20, count: 0 },
      { range: "₹20-50", min: 20, max: 50, count: 0 },
      { range: "₹50-100", min: 50, max: 100, count: 0 },
      { range: "₹100+", min: 100, max: Infinity, count: 0 },
    ];
    prices.forEach((p) => {
      const bucket = priceRanges.find((r) => p >= r.min && p < r.max);
      if (bucket) bucket.count++;
    });

    // Price by state (avg)
    const priceByState: Record<string, { total: number; count: number }> = {};
    all.forEach((w) => {
      const p = Number(w.price_per_sqft) || 0;
      if (p > 0) {
        const s = w.state || "Unknown";
        if (!priceByState[s]) priceByState[s] = { total: 0, count: 0 };
        priceByState[s].total += p;
        priceByState[s].count++;
      }
    });
    const avgPriceByState = Object.entries(priceByState)
      .map(([state, v]) => ({
        state,
        avgPrice: Math.round((v.total / v.count) * 100) / 100,
        count: v.count,
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice)
      .slice(0, 15);

    // ── 5. Area/Size analytics ──
    const areas = all
      .map((w) => Number(w.total_area) || 0)
      .filter((a) => a > 0);
    const totalArea = areas.reduce((a, b) => a + b, 0);
    const avgArea = areas.length ? totalArea / areas.length : 0;
    const sizeRanges = [
      { range: "0-1K sqft", min: 0, max: 1000, count: 0 },
      { range: "1K-5K sqft", min: 1000, max: 5000, count: 0 },
      { range: "5K-10K sqft", min: 5000, max: 10000, count: 0 },
      { range: "10K-50K sqft", min: 10000, max: 50000, count: 0 },
      { range: "50K-100K sqft", min: 50000, max: 100000, count: 0 },
      { range: "100K+ sqft", min: 100000, max: Infinity, count: 0 },
    ];
    areas.forEach((a) => {
      const bucket = sizeRanges.find((r) => a >= r.min && a < r.max);
      if (bucket) bucket.count++;
    });

    // ── 6. Occupancy analytics ──
    const occupancies = all.map((w) => Number(w.occupancy) || 0);
    const avgOccupancy = occupancies.length
      ? occupancies.reduce((a, b) => a + b, 0) / occupancies.length
      : 0;
    const occupancyBuckets = [
      { range: "0-20%", min: 0, max: 0.2, count: 0 },
      { range: "20-40%", min: 0.2, max: 0.4, count: 0 },
      { range: "40-60%", min: 0.4, max: 0.6, count: 0 },
      { range: "60-80%", min: 0.6, max: 0.8, count: 0 },
      { range: "80-100%", min: 0.8, max: 1.01, count: 0 },
    ];
    occupancies.forEach((o) => {
      const bucket = occupancyBuckets.find((r) => o >= r.min && o < r.max);
      if (bucket) bucket.count++;
    });

    // ── 7. Ratings analytics ──
    const ratings = all.map((w) => Number(w.rating) || 0).filter((r) => r > 0);
    const avgRating = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;
    const ratingBuckets = [
      { range: "1-2★", min: 1, max: 2.5, count: 0 },
      { range: "2.5-3.5★", min: 2.5, max: 3.5, count: 0 },
      { range: "3.5-4★", min: 3.5, max: 4, count: 0 },
      { range: "4-4.5★", min: 4, max: 4.5, count: 0 },
      { range: "4.5-5★", min: 4.5, max: 5.01, count: 0 },
    ];
    ratings.forEach((r) => {
      const bucket = ratingBuckets.find((b) => r >= b.min && r < b.max);
      if (bucket) bucket.count++;
    });

    // ── 8. Amenities frequency ──
    const amenityMap: Record<string, number> = {};
    all.forEach((w) => {
      const ams = Array.isArray(w.amenities) ? w.amenities : [];
      ams.forEach((a: string) => {
        if (a) amenityMap[a] = (amenityMap[a] || 0) + 1;
      });
    });
    const topAmenities = Object.entries(amenityMap)
      .map(([amenity, count]) => ({ amenity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // ── 9. Features frequency ──
    const featureMap: Record<string, number> = {};
    all.forEach((w) => {
      const fs = Array.isArray(w.features) ? w.features : [];
      fs.forEach((f: string) => {
        if (f) featureMap[f] = (featureMap[f] || 0) + 1;
      });
    });
    const topFeatures = Object.entries(featureMap)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // ── 10. Monthly listing trend (by created_at) ──
    const monthMap: Record<string, number> = {};
    all.forEach((w) => {
      if (w.created_at) {
        const d = new Date(w.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap[key] = (monthMap[key] || 0) + 1;
      }
    });
    const monthlyListings = Object.entries(monthMap)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    // ── 11. Owner distribution ──
    const ownerMap: Record<string, number> = {};
    all.forEach((w) => {
      const oid = w.owner_id || "unknown";
      ownerMap[oid] = (ownerMap[oid] || 0) + 1;
    });
    const uniqueOwners = Object.keys(ownerMap).length;
    const topOwners = Object.entries(ownerMap)
      .map(([owner_id, count]) => ({ owner_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── 12. Status distribution ──
    const statusMap: Record<string, number> = {};
    all.forEach((w) => {
      const s = w.status || "unknown";
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusMap).map(
      ([status, count]) => ({ status, count }),
    );

    // ── 13. Top warehouses by area ──
    const topByArea = [...all]
      .sort((a, b) => (Number(b.total_area) || 0) - (Number(a.total_area) || 0))
      .slice(0, 10)
      .map((w) => ({
        name: w.name,
        city: w.city,
        state: w.state,
        total_area: w.total_area,
        price_per_sqft: w.price_per_sqft,
      }));

    // ── 14. Top warehouses by price ──
    const topByPrice = [...all]
      .sort(
        (a, b) =>
          (Number(b.price_per_sqft) || 0) - (Number(a.price_per_sqft) || 0),
      )
      .slice(0, 10)
      .map((w) => ({
        name: w.name,
        city: w.city,
        state: w.state,
        price_per_sqft: w.price_per_sqft,
        total_area: w.total_area,
      }));

    // ── 15. Images analytics ──
    const imagesCounts = all.map((w) =>
      Array.isArray(w.images) ? w.images.length : 0,
    );
    const warehousesWithImages = imagesCounts.filter((c) => c > 0).length;
    const avgImages = imagesCounts.length
      ? imagesCounts.reduce((a, b) => a + b, 0) / imagesCounts.length
      : 0;

    // ── Response ──
    return res.json({
      success: true,
      analytics: {
        overview: {
          totalWarehouses: total,
          totalArea,
          avgArea: Math.round(avgArea),
          avgPrice: Math.round(avgPrice * 100) / 100,
          minPrice,
          maxPrice,
          medianPrice,
          avgOccupancy: Math.round(avgOccupancy * 100),
          avgRating: Math.round(avgRating * 100) / 100,
          uniqueOwners,
          uniqueStates: Object.keys(stateMap).length,
          uniqueCities: Object.keys(cityMap).length,
          warehousesWithImages,
          avgImages: Math.round(avgImages * 10) / 10,
        },
        stateDistribution,
        cityDistribution,
        typeDistribution,
        priceRanges: priceRanges.map((r) => ({
          range: r.range,
          count: r.count,
        })),
        avgPriceByState,
        sizeRanges: sizeRanges.map((r) => ({ range: r.range, count: r.count })),
        occupancyBuckets: occupancyBuckets.map((r) => ({
          range: r.range,
          count: r.count,
        })),
        ratingBuckets: ratingBuckets.map((r) => ({
          range: r.range,
          count: r.count,
        })),
        topAmenities,
        topFeatures,
        monthlyListings,
        statusDistribution,
        topByArea,
        topByPrice,
        topOwners,
      },
    });
  } catch (error: any) {
    console.error("❌ Analytics exception:", error?.message || error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to compute analytics" });
  }
};

/**
 * GET /api/analytics/warehouses
 * Returns paginated, searchable, filterable warehouse list for the explorer
 */
export const getWarehouseList: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const search = ((req.query.search as string) || "").trim();
    const state = ((req.query.state as string) || "").trim();
    const city = ((req.query.city as string) || "").trim();
    const type = ((req.query.type as string) || "").trim();
    const status = ((req.query.status as string) || "").trim();
    const sortBy = (req.query.sortBy as string) || "created_at";
    const sortOrder = (req.query.sortOrder as string) || "desc";

    let query = supabase
      .from("warehouses")
      .select(
        "id, wh_id, name, city, district, state, total_area, capacity, price_per_sqft, warehouse_type, status, occupancy, rating, reviews_count, amenities, features, images, created_at, owner_id",
        { count: "exact" },
      );

    // Apply filters
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,wh_id.ilike.%${search}%`,
      );
    }
    if (state) query = query.eq("state", state);
    if (city) query = query.eq("city", city);
    if (type) query = query.eq("warehouse_type", type);
    if (status) query = query.eq("status", status);

    // Apply sorting
    const ascending = sortOrder === "asc";
    const validSortCols = [
      "created_at",
      "name",
      "price_per_sqft",
      "total_area",
      "rating",
      "occupancy",
      "city",
      "warehouse_type",
    ];
    const safeSort = validSortCols.includes(sortBy) ? sortBy : "created_at";
    query = query.order(safeSort, { ascending });

    // Apply pagination
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ Warehouse list error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      warehouses: (data || []).map((w: any) => ({
        ...w,
        imageCount: Array.isArray(w.images) ? w.images.length : 0,
        amenityCount: Array.isArray(w.amenities) ? w.amenities.length : 0,
        featureCount: Array.isArray(w.features) ? w.features.length : 0,
        occupancyPct: Math.round((Number(w.occupancy) || 0) * 100),
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error("❌ Warehouse list exception:", error?.message || error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch warehouse list" });
  }
};

/**
 * GET /api/analytics/warehouse/:id
 * Returns individual warehouse detail with platform comparison
 */
export const getWarehouseDetail: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the specific warehouse with all columns
    const { data: warehouse, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !warehouse) {
      return res
        .status(404)
        .json({ success: false, error: "Warehouse not found" });
    }

    // Get platform-wide averages + rank data in parallel using aggregation
    const [
      avgResult,
      priceRankResult,
      areaRankResult,
      ratingRankResult,
      sameCity,
      sameType,
    ] = await Promise.all([
      // 1. Platform averages (simple aggregate)
      supabase
        .from("warehouses")
        .select("price_per_sqft, total_area, occupancy, rating")
        .limit(10000),
      // 2. Count warehouses with higher price (for rank)
      supabase
        .from("warehouses")
        .select("id", { count: "exact", head: true })
        .gt("price_per_sqft", warehouse.price_per_sqft || 0),
      // 3. Count warehouses with larger area (for rank)
      supabase
        .from("warehouses")
        .select("id", { count: "exact", head: true })
        .gt("total_area", warehouse.total_area || 0),
      // 4. Count warehouses with better rating (for rank)
      supabase
        .from("warehouses")
        .select("id", { count: "exact", head: true })
        .gt("rating", warehouse.rating || 0),
      // 5. Same city warehouses count + averages
      supabase
        .from("warehouses")
        .select("price_per_sqft, total_area, occupancy, rating")
        .eq("city", warehouse.city || ""),
      // 6. Same type warehouses
      supabase
        .from("warehouses")
        .select("price_per_sqft, total_area, occupancy, rating")
        .eq("warehouse_type", warehouse.warehouse_type || ""),
    ]);

    // Compute platform averages
    const allWh = avgResult.data || [];
    const totalCount = allWh.length;
    const platformAvg = {
      price:
        allWh.reduce((s, w) => s + (Number(w.price_per_sqft) || 0), 0) /
        (totalCount || 1),
      area:
        allWh.reduce((s, w) => s + (Number(w.total_area) || 0), 0) /
        (totalCount || 1),
      occupancy:
        allWh.reduce((s, w) => s + (Number(w.occupancy) || 0), 0) /
        (totalCount || 1),
      rating:
        allWh.reduce((s, w) => s + (Number(w.rating) || 0), 0) /
        (totalCount || 1),
    };

    // Compute city averages
    const cityWh = sameCity.data || [];
    const cityAvg = {
      count: cityWh.length,
      price:
        cityWh.reduce((s, w) => s + (Number(w.price_per_sqft) || 0), 0) /
        (cityWh.length || 1),
      area:
        cityWh.reduce((s, w) => s + (Number(w.total_area) || 0), 0) /
        (cityWh.length || 1),
      occupancy:
        cityWh.reduce((s, w) => s + (Number(w.occupancy) || 0), 0) /
        (cityWh.length || 1),
      rating:
        cityWh.reduce((s, w) => s + (Number(w.rating) || 0), 0) /
        (cityWh.length || 1),
    };

    // Compute type averages
    const typeWh = sameType.data || [];
    const typeAvg = {
      count: typeWh.length,
      price:
        typeWh.reduce((s, w) => s + (Number(w.price_per_sqft) || 0), 0) /
        (typeWh.length || 1),
      area:
        typeWh.reduce((s, w) => s + (Number(w.total_area) || 0), 0) /
        (typeWh.length || 1),
      occupancy:
        typeWh.reduce((s, w) => s + (Number(w.occupancy) || 0), 0) /
        (typeWh.length || 1),
      rating:
        typeWh.reduce((s, w) => s + (Number(w.rating) || 0), 0) /
        (typeWh.length || 1),
    };

    // Ranks (lower = better for price, higher = better for area/rating)
    const priceRank = (priceRankResult.count || 0) + 1; // warehouses with HIGHER price + 1 = cheaper rank
    const areaRank = (areaRankResult.count || 0) + 1; // warehouses with LARGER area + 1
    const ratingRank = (ratingRankResult.count || 0) + 1;

    return res.json({
      success: true,
      warehouse: {
        ...warehouse,
        imageCount: Array.isArray(warehouse.images)
          ? warehouse.images.length
          : 0,
        amenityList: Array.isArray(warehouse.amenities)
          ? warehouse.amenities
          : [],
        featureList: Array.isArray(warehouse.features)
          ? warehouse.features
          : [],
        occupancyPct: Math.round((Number(warehouse.occupancy) || 0) * 100),
      },
      comparison: {
        totalWarehouses: totalCount,
        platform: {
          avgPrice: Math.round(platformAvg.price * 100) / 100,
          avgArea: Math.round(platformAvg.area),
          avgOccupancy: Math.round(platformAvg.occupancy * 100),
          avgRating: Math.round(platformAvg.rating * 100) / 100,
        },
        city: {
          name: warehouse.city,
          count: cityAvg.count,
          avgPrice: Math.round(cityAvg.price * 100) / 100,
          avgArea: Math.round(cityAvg.area),
          avgOccupancy: Math.round(cityAvg.occupancy * 100),
          avgRating: Math.round(cityAvg.rating * 100) / 100,
        },
        type: {
          name: warehouse.warehouse_type,
          count: typeAvg.count,
          avgPrice: Math.round(typeAvg.price * 100) / 100,
          avgArea: Math.round(typeAvg.area),
          avgOccupancy: Math.round(typeAvg.occupancy * 100),
          avgRating: Math.round(typeAvg.rating * 100) / 100,
        },
        ranks: {
          priceCheapest: priceRank, // rank 1 = cheapest
          areaLargest: areaRank, // rank 1 = largest
          ratingBest: ratingRank, // rank 1 = best rated
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Warehouse detail exception:", error?.message || error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch warehouse details" });
  }
};

/**
 * GET /api/analytics/filters
 * Returns distinct values for filter dropdowns (states, cities, types, statuses)
 */
export const getAnalyticsFilters: RequestHandler = async (_req, res) => {
  try {
    // Fetch unique states, cities, types, statuses using paginated queries
    const PAGE_SIZE = 1000;
    let all: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("warehouses")
        .select("state, city, warehouse_type, status")
        .range(from, from + PAGE_SIZE - 1);
      if (error) break;
      all = all.concat(data || []);
      if (!data || data.length < PAGE_SIZE) hasMore = false;
      else from += PAGE_SIZE;
    }

    const states = [...new Set(all.map((w) => w.state).filter(Boolean))].sort();
    const cities = [...new Set(all.map((w) => w.city).filter(Boolean))].sort();
    const types = [
      ...new Set(all.map((w) => w.warehouse_type).filter(Boolean)),
    ].sort();
    const statuses = [
      ...new Set(all.map((w) => w.status).filter(Boolean)),
    ].sort();

    return res.json({
      success: true,
      filters: { states, cities, types, statuses },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch filters" });
  }
};

/**
 * GET /api/analytics/owner/:ownerId
 * Returns analytics for a specific owner's warehouses
 */
export const getOwnerAnalytics: RequestHandler = async (req, res) => {
  try {
    const { ownerId } = req.params;
    if (!ownerId)
      return res
        .status(400)
        .json({ success: false, error: "ownerId is required" });

    const { data: warehouses, error } = await supabase
      .from("warehouses")
      .select(
        "id, wh_id, name, city, district, state, total_area, capacity, price_per_sqft, warehouse_type, status, occupancy, rating, reviews_count, amenities, features, images, created_at",
      )
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Owner analytics error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Also fetch submissions
    const { data: submissions } = await supabase
      .from("warehouse_submissions")
      .select(
        "id, name, city, status, submitted_at, total_area, price_per_sqft",
      )
      .eq("owner_id", ownerId)
      .order("submitted_at", { ascending: false });

    // Also fetch bookings for this owner's warehouses
    const { data: bookings } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("type", "booking")
      .order("created_at", { ascending: false });

    const all = warehouses || [];
    const total = all.length;

    const prices = all
      .map((w) => Number(w.price_per_sqft) || 0)
      .filter((p) => p > 0);
    const areas = all
      .map((w) => Number(w.total_area) || 0)
      .filter((a) => a > 0);
    const occupancies = all.map((w) => Number(w.occupancy) || 0);
    const ratings = all.map((w) => Number(w.rating) || 0).filter((r) => r > 0);

    const totalArea = areas.reduce((a, b) => a + b, 0);
    const estimatedMonthlyRevenue =
      prices.length && areas.length
        ? all.reduce((sum, w) => {
            const area = Number(w.total_area) || 0;
            const price = Number(w.price_per_sqft) || 0;
            const occ = Number(w.occupancy) || 0;
            return sum + area * price * occ;
          }, 0)
        : 0;

    // Per-warehouse breakdown
    const warehouseBreakdown = all.map((w) => ({
      id: w.id,
      name: w.name,
      city: w.city,
      state: w.state,
      total_area: w.total_area,
      price_per_sqft: w.price_per_sqft,
      occupancy: Math.round((Number(w.occupancy) || 0) * 100),
      rating: w.rating,
      reviews_count: w.reviews_count,
      status: w.status,
      imageCount: Array.isArray(w.images) ? w.images.length : 0,
      amenityCount: Array.isArray(w.amenities) ? w.amenities.length : 0,
      monthlyRevenue: Math.round(
        (Number(w.total_area) || 0) *
          (Number(w.price_per_sqft) || 0) *
          (Number(w.occupancy) || 0),
      ),
    }));

    // City distribution
    const cityMap: Record<string, number> = {};
    all.forEach((w) => {
      cityMap[w.city || "Unknown"] = (cityMap[w.city || "Unknown"] || 0) + 1;
    });
    const cityDistribution = Object.entries(cityMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);

    // Type distribution
    const typeMap: Record<string, number> = {};
    all.forEach((w) => {
      typeMap[w.warehouse_type || "General"] =
        (typeMap[w.warehouse_type || "General"] || 0) + 1;
    });
    const typeDistribution = Object.entries(typeMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Owner bookings
    const ownerBookings = (bookings || []).filter(
      (b: any) =>
        b.metadata?.warehouse_owner_id === ownerId ||
        all.some((w) => w.id === b.metadata?.warehouse_id),
    );
    const totalBookings = ownerBookings.length;
    const confirmedBookings = ownerBookings.filter(
      (b: any) =>
        b.metadata?.booking_status === "approved" ||
        b.metadata?.booking_status === "confirmed",
    ).length;
    const pendingBookings = ownerBookings.filter(
      (b: any) => b.metadata?.booking_status === "pending",
    ).length;
    const rejectedBookings = ownerBookings.filter(
      (b: any) => b.metadata?.booking_status === "rejected",
    ).length;

    const approvedStatuses = new Set(["approved", "confirmed"]);
    const now = new Date();
    const dueCutoff = new Date(now);
    dueCutoff.setHours(0, 0, 0, 0);

    const bookingDetails = ownerBookings.map((b: any) => {
      const md = b.metadata || {};
      return {
        id: b.id,
        created_at: b.created_at,
        booking_status: md.booking_status || "pending",
        warehouse_id: md.warehouse_id || "",
        warehouse_name: md.warehouse_name || "Warehouse",
        warehouse_city: md.warehouse_city || "",
        warehouse_state: md.warehouse_state || "",
        seeker_id: b.seeker_id || "",
        seeker_name:
          md.customer_details?.name || md.customer_details?.email || "Customer",
        seeker_email: md.customer_details?.email || "",
        seeker_phone: md.customer_details?.phone || "",
        start_date: md.start_date || null,
        end_date: md.end_date || null,
        area_sqft: Number(md.area_sqft || 0),
        blocks_booked: Array.isArray(md.blocks_booked)
          ? md.blocks_booked.length
          : 0,
        total_amount: Number(md.total_amount || 0),
        payment_method: md.payment_method || "N/A",
      };
    });

    const totalRevenue = ownerBookings.reduce((sum: number, b: any) => {
      const md = b.metadata || {};
      if (approvedStatuses.has(md.booking_status)) {
        return sum + (Number(md.total_amount) || 0);
      }
      return sum;
    }, 0);

    const avgBookingValue =
      confirmedBookings > 0 ? Math.round(totalRevenue / confirmedBookings) : 0;

    const bookingStatusBreakdown: Record<string, number> = {};
    ownerBookings.forEach((b: any) => {
      const status = b.metadata?.booking_status || "pending";
      bookingStatusBreakdown[status] =
        (bookingStatusBreakdown[status] || 0) + 1;
    });

    const paymentMethodBreakdown: Record<string, number> = {};
    ownerBookings.forEach((b: any) => {
      const method = b.metadata?.payment_method || "N/A";
      paymentMethodBreakdown[method] =
        (paymentMethodBreakdown[method] || 0) + 1;
    });

    const bookingsByWarehouse: Record<string, number> = {};
    ownerBookings.forEach((b: any) => {
      const name = b.metadata?.warehouse_name || "Warehouse";
      bookingsByWarehouse[name] = (bookingsByWarehouse[name] || 0) + 1;
    });

    const topSeekersMap: Record<
      string,
      { name: string; email: string; total: number; count: number }
    > = {};
    ownerBookings.forEach((b: any) => {
      const md = b.metadata || {};
      const key = md.customer_details?.email || b.seeker_id || "unknown";
      if (!topSeekersMap[key]) {
        topSeekersMap[key] = {
          name:
            md.customer_details?.name ||
            md.customer_details?.email ||
            "Customer",
          email: md.customer_details?.email || "",
          total: 0,
          count: 0,
        };
      }
      topSeekersMap[key].total += Number(md.total_amount || 0);
      topSeekersMap[key].count += 1;
    });
    const topSeekers = Object.values(topSeekersMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const bookingTrend: Array<{
      label: string;
      count: number;
      revenue: number;
    }> = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setDate(1);
      start.setMonth(start.getMonth() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const monthBookings = ownerBookings.filter((b: any) => {
        const created = new Date(b.created_at);
        return created >= start && created < end;
      });
      const revenue = monthBookings.reduce((sum: number, b: any) => {
        const md = b.metadata || {};
        if (approvedStatuses.has(md.booking_status)) {
          return sum + (Number(md.total_amount) || 0);
        }
        return sum;
      }, 0);
      const label = start.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });
      bookingTrend.push({
        label,
        count: monthBookings.length,
        revenue: Math.round(revenue),
      });
    }

    const upcomingExpirations = bookingDetails.filter((b: any) => {
      if (!approvedStatuses.has(b.booking_status) || !b.end_date) return false;
      const end = new Date(b.end_date);
      const diffDays = (end.getTime() - now.getTime()) / 86400000;
      return diffDays >= 0 && diffDays <= 14;
    });

    const overdueBookings = bookingDetails.filter((b: any) => {
      if (!approvedStatuses.has(b.booking_status) || !b.end_date) return false;
      const end = new Date(b.end_date);
      return end < dueCutoff;
    });

    const dueRevenue = overdueBookings.reduce(
      (sum: number, b: any) => sum + Number(b.total_amount || 0),
      0,
    );

    // Submission stats
    const pendingSubs = (submissions || []).filter(
      (s) => s.status === "pending",
    ).length;
    const approvedSubs = (submissions || []).filter(
      (s) => s.status === "approved",
    ).length;
    const rejectedSubs = (submissions || []).filter(
      (s) => s.status === "rejected",
    ).length;

    return res.json({
      success: true,
      analytics: {
        overview: {
          totalWarehouses: total,
          totalArea,
          avgPrice: prices.length
            ? Math.round(
                (prices.reduce((a, b) => a + b, 0) / prices.length) * 100,
              ) / 100
            : 0,
          avgOccupancy: occupancies.length
            ? Math.round(
                (occupancies.reduce((a, b) => a + b, 0) / occupancies.length) *
                  100,
              )
            : 0,
          avgRating: ratings.length
            ? Math.round(
                (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100,
              ) / 100
            : 0,
          estimatedMonthlyRevenue: Math.round(estimatedMonthlyRevenue),
          totalBookings,
          confirmedBookings,
          pendingBookings,
          rejectedBookings,
          pendingSubmissions: pendingSubs,
          approvedSubmissions: approvedSubs,
          rejectedSubmissions: rejectedSubs,
          avgBookingValue,
          dueRevenue: Math.round(dueRevenue),
          overdueBookings: overdueBookings.length,
        },
        warehouseBreakdown,
        cityDistribution,
        typeDistribution,
        bookingTrend,
        bookingStatusBreakdown,
        paymentMethodBreakdown,
        bookingsByWarehouse: Object.entries(bookingsByWarehouse).map(
          ([name, count]) => ({ name, count }),
        ),
        topSeekers,
        bookingDetails,
        upcomingExpirations,
        overdueBookings,
        submissions: submissions || [],
      },
    });
  } catch (error: any) {
    console.error("❌ Owner analytics error:", error?.message || error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to compute owner analytics" });
  }
};
