const path = require("path");
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Team SmartSpace - APSIT";
pres.company = "APSIT Thane";
pres.subject = "SmartSpace Project Presentation";
pres.title = "SmartSpace - Intelligent Warehouse Recommendation System";
pres.lang = "en-US";

const C = {
  navy: "0D1B3E",
  blue: "1A3A6B",
  teal: "028090",
  mint: "02C39A",
  white: "FFFFFF",
  offWhite: "E8F4F8",
  silver: "B0C4D8",
  gold: "F4C430",
  lightBg: "F0F6FA",
  darkText: "0D1B3E",
  midGray: "64748B",
  purple: "7C3AED",
  orange: "E67E22",
  green: "10B981",
};

const shadow = { type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.18 };

function header(slide, title, color) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.7,
    fill: { color },
    line: { type: "none" },
  });
  slide.addText(title, {
    x: 0.35,
    y: 0,
    w: 12.7,
    h: 0.7,
    fontFace: "Calibri",
    fontSize: 23,
    bold: true,
    color: C.white,
    valign: "middle",
  });
}

// Slide 1 - Title
{
  const s = pres.addSlide();
  s.background = { color: C.navy };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: C.teal }, line: { type: "none" } });
  s.addText("A.P. Shah Institute of Technology, Thane | B.E. Computer Engineering | 2025-2026", {
    x: 0.5, y: 0.35, w: 8.5, h: 0.3, fontFace: "Calibri", fontSize: 10, color: C.silver, italic: true,
  });
  s.addText("SmartSpace", {
    x: 0.5, y: 1.0, w: 8.5, h: 1.0, fontFace: "Calibri", fontSize: 60, bold: true, color: C.white,
  });
  s.addText("Intelligent Warehouse Recommendation for Maharashtra", {
    x: 0.5, y: 2.0, w: 8.6, h: 0.5, fontFace: "Calibri", fontSize: 24, bold: true, color: C.mint,
  });
  s.addText("Using Hybrid ML and LLM Assistance", {
    x: 0.5, y: 2.5, w: 8.6, h: 0.4, fontFace: "Calibri", fontSize: 17, color: C.silver,
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.0, w: 3.0, h: 0.05, fill: { color: C.teal }, line: { type: "none" } });
  s.addText("Team SmartSpace", {
    x: 0.5, y: 3.3, w: 4.0, h: 0.3, fontFace: "Calibri", fontSize: 14, bold: true, color: C.gold,
  });
  s.addText("Dipesh Sharma (22102035)   Manthan Shinde (22102124)", {
    x: 0.5, y: 3.65, w: 7.5, h: 0.3, fontFace: "Calibri", fontSize: 12.5, color: C.offWhite,
  });
  s.addText("Sahil Shinde (22102013)   Pranjal Zambre (22102118)", {
    x: 0.5, y: 4.0, w: 7.5, h: 0.3, fontFace: "Calibri", fontSize: 12.5, color: C.offWhite,
  });
  s.addText("Guide: Prof. Varsha Wangikar", {
    x: 0.5, y: 4.4, w: 6.0, h: 0.25, fontFace: "Calibri", fontSize: 11.5, color: C.silver, italic: true,
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.15, w: 13.33, h: 0.35, fill: { color: C.teal }, line: { type: "none" } });
  s.addText("Submitted to University of Mumbai | Department of Computer Engineering", {
    x: 0, y: 7.15, w: 13.33, h: 0.35, fontFace: "Calibri", fontSize: 9, color: C.white, align: "center", valign: "middle",
  });
}

// Slide 2 - Team and Agenda
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  header(s, "Meet Team SmartSpace", C.navy);

  const team = [
    ["Dipesh Sharma", "22102035", "Seeker Module", C.teal],
    ["Manthan Shinde", "22102124", "Seeker Module", "027A8A"],
    ["Pranjal Zambre", "22102118", "Admin Module", C.orange],
    ["Sahil Shinde", "22102013", "Owner + DB + Data", C.purple],
  ];

  team.forEach((t, i) => {
    const x = 0.35 + i * 3.2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.0, w: 3.0, h: 2.6, fill: { color: C.white }, line: { type: "none" }, shadow });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.0, w: 3.0, h: 0.52, fill: { color: t[3] }, line: { type: "none" } });
    s.addText(t[0], { x: x + 0.1, y: 1.65, w: 2.8, h: 0.3, fontFace: "Calibri", fontSize: 13, bold: true, color: C.darkText, align: "center" });
    s.addText(t[1], { x: x + 0.1, y: 1.95, w: 2.8, h: 0.2, fontFace: "Calibri", fontSize: 10, color: C.midGray, align: "center" });
    s.addText(t[2], { x: x + 0.1, y: 2.3, w: 2.8, h: 0.3, fontFace: "Calibri", fontSize: 11, bold: true, color: t[3], align: "center" });
  });

  const agenda = [
    "Problem Statement and Maharashtra Warehousing Context",
    "SmartSpace Architecture and Design",
    "Seeker, Owner, and Admin Module Workflows",
    "ML Ensemble and LLM Intelligence",
    "Database Architecture and Results",
    "Unique Features, Future Scope, and Q&A",
  ];
  s.addText("Presentation Agenda (20 Minutes)", {
    x: 0.4, y: 4.0, w: 12.5, h: 0.35, fontFace: "Calibri", fontSize: 16, bold: true, color: C.navy,
  });
  agenda.forEach((item, i) => {
    s.addText(`${i + 1}. ${item}`, {
      x: 0.55, y: 4.45 + i * 0.42, w: 12, h: 0.34, fontFace: "Calibri", fontSize: 11.5, color: C.darkText,
    });
  });
}

// Slide 3 - Problem Statement
{
  const s = pres.addSlide();
  s.background = { color: C.navy };
  header(s, "The Problem - Maharashtra Warehousing Crisis", "091530");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.35, y: 0.9, w: 12.6, h: 0.8, fill: { color: C.blue }, line: { type: "none" } });
  s.addText("Maharashtra logistics includes MIDC zones, cold storage, pharma and FMCG facilities, but discovery and booking is still fragmented and manual.", {
    x: 0.55, y: 1.0, w: 12.2, h: 0.6, fontFace: "Calibri", fontSize: 13, color: C.offWhite, italic: true,
  });

  const issues = [
    ["No Centralized Platform", "Listings are fragmented and hard to compare."],
    ["Manual Discovery", "Users spend days calling brokers and visiting sites."],
    ["No Intelligent Matching", "Keyword-only filters fail for natural language needs."],
    ["Cold Start Problem", "New listings remain invisible in classical systems."],
    ["No Trust Layer", "Document verification is often absent in listing workflows."],
    ["Outdated Operations", "Occupancy and revenue often tracked manually on sheets."],
  ];

  issues.forEach((it, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.35 + col * 4.23;
    const y = 2.0 + row * 2.45;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 4.0, h: 2.2, fill: { color: "122045" }, line: { color: C.teal, width: 1 } });
    s.addText(it[0], { x: x + 0.15, y: y + 0.15, w: 3.7, h: 0.45, fontFace: "Calibri", fontSize: 13, bold: true, color: C.mint });
    s.addText(it[1], { x: x + 0.15, y: y + 0.7, w: 3.7, h: 1.3, fontFace: "Calibri", fontSize: 11, color: C.silver });
  });
}

// Slide 4 - Architecture
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  header(s, "SmartSpace 4-Layer Architecture", C.blue);

  const layers = [
    ["Presentation Layer", "React + TypeScript + Vite + Tailwind", C.teal],
    ["Application Layer", "Express.js APIs + JWT + RBAC", "1A6B9A"],
    ["Intelligence Layer", "5-Model ML Ensemble + LLM Fallback", C.purple],
    ["Data Layer", "Supabase PostgreSQL + RLS + Migrations", "B35A00"],
  ];
  layers.forEach((layer, i) => {
    const y = 1.1 + i * 1.45;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.45, y, w: 12.4, h: 1.15, fill: { color: layer[2] }, line: { type: "none" }, shadow });
    s.addText(layer[0], { x: 0.7, y: y + 0.1, w: 4.2, h: 0.35, fontFace: "Calibri", fontSize: 14, bold: true, color: C.white });
    s.addText(layer[1], { x: 0.7, y: y + 0.48, w: 11.8, h: 0.5, fontFace: "Calibri", fontSize: 11.5, color: "FFECB3" });
  });
}

// Slide 5 - Seeker Module
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  header(s, "Seeker Module Workflow - Dipesh + Manthan", C.teal);
  const steps = [
    ["1", "Landing & Search", "Seeker browses warehouse inventory by city, price, type, and amenities."],
    ["2", "Warehouse Detail", "Seeker opens detailed page with occupancy, amenities, pricing and owner data."],
    ["3", "3D Block Selection", "Grid-based block selector enables visual block booking."],
    ["4", "Booking Request", "Booking summary sends request to /api/bookings with computed total and GST."],
    ["5", "Tracking", "Seeker views booking timeline, saved warehouses, activity feed and invoice status."],
  ];

  steps.forEach((st, i) => {
    const x = 0.45 + i * 2.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.3, w: 2.35, h: 4.8, fill: { color: C.white }, line: { type: "none" }, shadow });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.3, w: 2.35, h: 0.55, fill: { color: C.teal }, line: { type: "none" } });
    s.addText(st[0], { x, y: 1.3, w: 2.35, h: 0.55, fontFace: "Calibri", fontSize: 19, bold: true, color: C.white, align: "center", valign: "middle" });
    s.addText(st[1], { x: x + 0.1, y: 1.95, w: 2.15, h: 0.55, fontFace: "Calibri", fontSize: 12, bold: true, color: C.teal, align: "center" });
    s.addText(st[2], { x: x + 0.12, y: 2.5, w: 2.1, h: 3.4, fontFace: "Calibri", fontSize: 10, color: C.darkText });
  });
}

// Slide 6 - Owner Module
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  header(s, "Owner Module Workflow - Sahil", C.purple);

  const cards = [
    ["Register", "Owner creates profile and uploads KYC documents."],
    ["List Property", "Owner submits warehouse details into warehouse_submissions."],
    ["Admin Review", "Submission is reviewed for compliance and quality."],
    ["Live Listing", "Approved warehouse is published in warehouses table."],
    ["Booking Control", "Owner approves or rejects booking requests."],
    ["Analytics", "Owner tracks occupancy, revenue and pricing recommendations."],
  ];

  cards.forEach((c, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 4.25;
    const y = 1.2 + row * 3.0;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.95, h: 2.65, fill: { color: C.white }, line: { type: "none" }, shadow });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 3.95, h: 0.45, fill: { color: C.purple }, line: { type: "none" } });
    s.addText(c[0], { x: x + 0.12, y: y + 0.05, w: 3.7, h: 0.3, fontFace: "Calibri", fontSize: 12, bold: true, color: C.white, align: "center" });
    s.addText(c[1], { x: x + 0.18, y: y + 0.65, w: 3.55, h: 1.8, fontFace: "Calibri", fontSize: 11, color: C.darkText });
  });
}

// Slide 7 - Admin Module
{
  const s = pres.addSlide();
  s.background = { color: C.navy };
  header(s, "Admin Module - Pranjal", "091530");

  const adminCards = [
    ["Dashboard", "KPI view: users, revenue, booking trends, occupancy."],
    ["Submission Moderation", "Approve/reject warehouse submissions with audit trail."],
    ["Booking Governance", "Cross-platform booking controls and status transitions."],
    ["Verification", "Document and profile verification with scoring support."],
    ["User Management", "Monitor seeker/owner activity and enforce moderation."],
    ["Analytics", "Platform-wide trends and administrative insights."],
  ];

  adminCards.forEach((c, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 4.25;
    const y = 1.1 + row * 3.0;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.95, h: 2.65, fill: { color: "122045" }, line: { color: C.orange, width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 3.95, h: 0.42, fill: { color: C.orange }, line: { type: "none" } });
    s.addText(c[0], { x: x + 0.12, y: y + 0.04, w: 3.7, h: 0.28, fontFace: "Calibri", fontSize: 12, bold: true, color: C.white, align: "center" });
    s.addText(c[1], { x: x + 0.16, y: y + 0.62, w: 3.6, h: 1.8, fontFace: "Calibri", fontSize: 10.8, color: C.silver });
  });
}

// Slide 8 - ML and LLM
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  header(s, "ML Ensemble and LLM Intelligence", C.purple);

  const ml = [
    "KNN - distance based matching",
    "Random Forest - categorical robustness",
    "Gradient Boosting - iterative error correction",
    "Neural Network - nonlinear pattern learning",
    "Hybrid Stacking - final ensemble fusion",
  ];
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.0, w: 6.2, h: 5.8, fill: { color: C.white }, line: { type: "none" }, shadow });
  s.addText("ML Engine", { x: 0.75, y: 1.15, w: 5.8, h: 0.35, fontFace: "Calibri", fontSize: 16, bold: true, color: C.orange });
  ml.forEach((m, i) => {
    s.addText(`- ${m}`, { x: 0.9, y: 1.7 + i * 0.72, w: 5.6, h: 0.45, fontFace: "Calibri", fontSize: 12, color: C.darkText });
  });

  const llm = [
    "Primary LLM provider for NLP parsing",
    "Fallback chain for reliability",
    "Natural language booking assistant",
    "Contextual recommendation explanations",
    "Owner pricing insight generation",
  ];
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.95, y: 1.0, w: 5.9, h: 5.8, fill: { color: C.navy }, line: { type: "none" }, shadow });
  s.addText("LLM Layer", { x: 7.2, y: 1.15, w: 5.4, h: 0.35, fontFace: "Calibri", fontSize: 16, bold: true, color: C.mint });
  llm.forEach((item, i) => {
    s.addText(`- ${item}`, { x: 7.3, y: 1.7 + i * 0.72, w: 5.2, h: 0.45, fontFace: "Calibri", fontSize: 12, color: C.silver });
  });
}

// Slide 9 - Database
{
  const s = pres.addSlide();
  s.background = { color: C.navy };
  header(s, "Supabase and Database Architecture", "091530");

  const groups = [
    ["Core Tables", "profiles, owner_profiles, seeker_profiles, warehouses, warehouse_submissions"],
    ["Booking Tables", "bookings, activity_logs, saved_warehouses, inquiries, reviews"],
    ["Governance", "verification_queue, document_verifications, admin_notifications"],
    ["Analytics", "ml_recommendations, pricing_reference, payment_transactions"],
  ];

  groups.forEach((g, i) => {
    const y = 1.1 + i * 1.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y, w: 12.2, h: 1.2, fill: { color: i % 2 ? "122045" : C.blue }, line: { type: "none" } });
    s.addText(g[0], { x: 0.85, y: y + 0.15, w: 3.2, h: 0.35, fontFace: "Calibri", fontSize: 14, bold: true, color: C.gold });
    s.addText(g[1], { x: 3.8, y: y + 0.18, w: 8.6, h: 0.75, fontFace: "Calibri", fontSize: 11.5, color: C.offWhite });
  });

  s.addText("RLS enforces role-based data access for seeker, owner, and admin across all critical tables.", {
    x: 0.7, y: 7.0, w: 12.0, h: 0.3, fontFace: "Calibri", fontSize: 10.5, color: C.silver, italic: true,
  });
}

// Slide 10 - Results
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  header(s, "Performance Results", C.blue);

  const stats = [
    ["87.9%", "ML Ensemble Accuracy", C.teal],
    ["96.8%", "LLM Conversational Success", C.purple],
    ["60%", "Faster Discovery", C.orange],
    ["0.83", "Precision@10", C.green],
  ];

  stats.forEach((st, i) => {
    const x = 0.6 + i * 3.15;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.2, w: 2.8, h: 1.8, fill: { color: C.white }, line: { type: "none" }, shadow });
    s.addText(st[0], { x, y: 1.4, w: 2.8, h: 0.75, fontFace: "Calibri", fontSize: 34, bold: true, color: st[2], align: "center" });
    s.addText(st[1], { x: x + 0.12, y: 2.15, w: 2.56, h: 0.5, fontFace: "Calibri", fontSize: 10.5, color: C.midGray, align: "center" });
  });

  s.addText("Why Hybrid? ML gives speed and structured precision, while LLM provides natural language understanding and explainability.", {
    x: 0.6, y: 3.55, w: 12.0, h: 0.45, fontFace: "Calibri", fontSize: 12, bold: true, color: C.darkText,
  });

  const bullets = [
    "ML-only systems miss conversational context.",
    "LLM-only systems are slower and costlier at scale.",
    "Hybrid architecture balances accuracy, cost, speed, and UX quality.",
    "Failover design preserves service continuity.",
  ];
  bullets.forEach((b, i) => {
    s.addText(`- ${b}`, { x: 0.75, y: 4.2 + i * 0.5, w: 12.0, h: 0.35, fontFace: "Calibri", fontSize: 11.5, color: C.darkText });
  });
}

// Slide 11 - Unique Features
{
  const s = pres.addSlide();
  s.background = { color: C.navy };
  header(s, "Unique Features and Competitive Advantages", "091530");

  const usps = [
    ["3D Block Booking", "Visual selection of warehouse blocks with real-time availability."],
    ["NLP Smart Booking", "Natural language query handling for practical seeker requests."],
    ["Verification Pipeline", "Document checks and trust scoring before listing is published."],
    ["Dynamic Pricing", "Data-assisted pricing recommendations for owners."],
    ["Resilience", "Fallback strategy for service reliability under provider outages."],
    ["Maharashtra Data Focus", "Large regional warehouse dataset for realistic recommendations."],
  ];

  usps.forEach((u, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.55 + col * 6.2;
    const y = 1.05 + row * 2.05;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.95, h: 1.8, fill: { color: "122045" }, line: { color: C.teal, width: 1 } });
    s.addText(u[0], { x: x + 0.2, y: y + 0.12, w: 5.5, h: 0.4, fontFace: "Calibri", fontSize: 13, bold: true, color: C.mint });
    s.addText(u[1], { x: x + 0.2, y: y + 0.58, w: 5.5, h: 1.0, fontFace: "Calibri", fontSize: 11, color: C.silver });
  });
}

// Slide 12 - Closing
{
  const s = pres.addSlide();
  s.background = { color: C.navy };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: C.teal }, line: { type: "none" } });
  s.addText("Conclusion", {
    x: 0.55, y: 0.4, w: 12.0, h: 0.8, fontFace: "Calibri", fontSize: 34, bold: true, color: C.white,
  });
  s.addText("SmartSpace delivers a complete intelligent warehouse operations platform for Maharashtra.", {
    x: 0.55, y: 1.45, w: 12.2, h: 0.55, fontFace: "Calibri", fontSize: 16, italic: true, color: C.offWhite,
  });

  const points = [
    "Role-based workflows for seeker, owner, and admin.",
    "Hybrid ML plus LLM architecture for speed and explainability.",
    "Supabase RLS data security with operational transparency.",
    "Scalable foundation for future expansion and productization.",
  ];
  points.forEach((p, i) => {
    s.addText(`- ${p}`, { x: 0.75, y: 2.4 + i * 0.6, w: 12.0, h: 0.4, fontFace: "Calibri", fontSize: 13, color: C.offWhite });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 5.4, w: 12.2, h: 1.4, fill: { color: C.teal, transparency: 10 }, line: { type: "none" } });
  s.addText("Thank you, sir/ma'am. We are ready for questions.", {
    x: 0.55, y: 5.8, w: 12.2, h: 0.45, fontFace: "Calibri", fontSize: 20, bold: true, color: C.white, align: "center",
  });
  s.addText("Team SmartSpace | APSIT Thane", {
    x: 0.55, y: 6.3, w: 12.2, h: 0.3, fontFace: "Calibri", fontSize: 11, color: C.offWhite, align: "center", italic: true,
  });
}

const outputFile = path.resolve(__dirname, "..", "SmartSpace_Presentation.pptx");

pres
  .writeFile({ fileName: outputFile })
  .then(() => {
    console.log(`DONE: ${outputFile}`);
  })
  .catch((err) => {
    console.error("Error generating PPT:", err);
    process.exitCode = 1;
  });
