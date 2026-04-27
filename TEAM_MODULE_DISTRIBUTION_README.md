# SmartSpace Team Module Distribution Guide

## Purpose
This document defines how to split the SmartSpace project across your team for execution, code ownership, and external presentation.

Team allocation requested:
- Seeker Module: Dipesh + Manthan
- Admin Module: Pranjal
- Owner Module + Database + Data Generation: Sahil

This guide explains what each file does, who should own it, and how each member can present their work clearly.

---

## 1. Project Architecture Summary
SmartSpace is a full-stack app built with:
- Frontend: React + TypeScript (client)
- Backend: Express + TypeScript (server)
- Database: Supabase Postgres + RLS policies
- Shared business logic: shared
- Data setup/import/migrations: database, scripts, supabase/migrations

Main runtime flows:
1. User actions in frontend call REST endpoints under /api/*.
2. Backend routes handle business logic and read/write Supabase tables.
3. Analytics, booking states, and dashboards are derived from activity_logs + warehouse tables.

---

## 2. Team Ownership Matrix

### Dipesh + Manthan (Seeker Module)
Primary responsibilities:
- Search and browse warehouses
- Warehouse detail page and block booking UI
- Seeker profile, saved warehouses, activity timeline, bookings
- Seeker-facing AI recommendations and assistant UX

### Pranjal (Admin Module)
Primary responsibilities:
- Admin dashboard and analytics
- Admin warehouse submission review
- Admin bookings oversight and status updates
- Admin user management and verification panel

### Sahil (Owner Module + Database + Data Generation)
Primary responsibilities:
- Owner dashboard, property listing, owner booking responses
- Database schema and RLS management in Supabase
- Data setup, imports, fixes, migration scripts, seeding
- Long-term correctness for occupancy/availability pipelines

---

## 3. Seeker Module (Dipesh + Manthan)

## 3.1 Core Frontend Pages
- client/pages/Warehouses.tsx
  - Main seeker browse page with filters/search/pagination.
- client/pages/WarehouseDetail.tsx
  - Warehouse details, owner summary, block booking entrypoint.
- client/pages/SeekerHub.tsx
  - Seeker home with saved data and booking-related widgets.
- client/pages/SeekerBookingsPage.tsx
  - Seeker booking list/status/history.
- client/pages/Saved.tsx
  - Saved warehouses list and interactions.
- client/pages/SeekerProfilePage.tsx
  - Profile display/edit for seeker-facing fields.
- client/pages/Activity.tsx
  - Activity timeline/inquiry context.
- client/pages/Compare.tsx
  - Seeker warehouse comparison workflow.
- client/pages/MLRecommendationsPage.tsx
  - Recommendation exploration UI.
- client/pages/SmartBooking.tsx
  - NLP-driven seeker booking assistant page.

## 3.2 Seeker UI Components
- client/components/ProtectedRoute.tsx
  - Route access gate based on auth/profile type.
- client/components/GridBlockSelector.tsx
  - Block-level selection UI.
- client/components/BlockGridCSS3D.tsx
  - 3D visualization for block booking.
- client/components/BookingSummary.tsx
  - Booking review before submit.
- client/components/BookingSummary3D.tsx
  - 3D flow booking confirmation component.
- client/components/BookingConfirmationModal.tsx
  - Final booking confirmation modal.
- client/components/BookingReceipt.tsx
  - Booking receipt summary.
- client/components/InquiryModal.tsx
  - Seeker inquiry submission flow.
- client/components/ScheduleVisitModal.tsx
  - Visit scheduling flow.
- client/components/SmartBookingAssistant.tsx
  - Recommendation/chat interactions for seekers.
- client/components/MLRecommendations.tsx
  - Recommendation cards and ranking outputs.

## 3.3 Seeker Services and Hooks
- client/services/warehouseService.ts
  - Fetches warehouses, filters, details, and stats from Supabase.
- client/services/blockBookingService.ts
  - Handles block booking requests and local workflow glue.
- client/services/savedActivityService.ts
  - Saved warehouse + activity operations.
- client/services/smartBookingService.ts
  - Smart booking orchestration.
- client/services/aiService.ts
  - LLM request pipeline and model fallback handling.
- client/hooks/use-recommendations.ts
  - Recommendation fetch and state lifecycle.
- client/contexts/AuthContext.tsx
  - Session/profile state for seeker entry and route gating.

## 3.4 Seeker Backend Routes (shared with owner/admin where needed)
- server/routes/saved.ts
  - Saved warehouse endpoints.
- server/routes/bookings.ts
  - Seeker bookings list, cancel, invoice generation.
- server/routes/simple-booking.ts
  - Block booking create + available blocks endpoint.
- server/routes/activity.ts
  - Activity and inquiry endpoints.
- server/routes/schedule-visit.ts
  - Visit scheduling and status update endpoints.
- server/routes/smartBooking.ts
  - NLP booking/recommendation API.

Presentation angle for Dipesh + Manthan:
- Show end-to-end seeker journey:
  - Search -> Detail -> Block selection -> Booking request -> Seeker booking history.
- Highlight real-time data behavior and recommendation stack.

---

## 4. Admin Module (Pranjal)

## 4.1 Admin Frontend Pages
- client/pages/AdminDashboard.tsx
  - Consolidated KPI metrics and admin overview.
- client/pages/AdminBookingsPage.tsx
  - Booking moderation and status actions.
- client/pages/AdminWarehousesPage.tsx
  - Warehouse-level admin visibility and aggregates.
- client/pages/AdminWarehouseSubmissionsPage.tsx
  - Submission approval/rejection workflow.
- client/pages/AdminUsersPage.tsx
  - User-level management view.
- client/pages/AdminVerificationPage.tsx
  - Verification queues and pending actions.
- client/pages/AdminAnalyticsPage.tsx
  - Advanced analytics and system-level metrics.

## 4.2 Admin Backend Routes
- server/routes/admin-bookings.ts
  - Admin booking list, status updates, booking stats endpoint.
- server/routes/admin-warehouses.ts
  - Admin warehouse and user summary endpoints.
- server/routes/admin-warehouse-submissions.ts
  - Submission review APIs for admin.
- server/routes/admin-user-activity.ts
  - User activity overview APIs for admin tools.
- server/routes/analytics.ts
  - Admin/owner analytics aggregations.
- server/routes/approveSubmission.ts
  - Submission approval route logic.

## 4.3 Integration Entry Points
- server/index.ts
  - Route registration and API wiring for admin endpoints.

Presentation angle for Pranjal:
- Show governance and control capabilities:
  - User management
  - Submission moderation
  - Booking oversight
  - Platform analytics dashboard
- Explain how admin actions impact downstream owner/seeker data.

---

## 5. Owner Module + Database + Data Generation (Sahil)

## 5.1 Owner Frontend Pages
- client/pages/ListProperty.tsx
  - Property submission flow for owners.
- client/pages/OwnerProperties.tsx
  - Owner property inventory.
- client/pages/OwnerAnalyticsPage.tsx
  - Owner metrics and performance view.
- client/pages/OwnerNotificationsPage.tsx
  - Owner notifications and updates.
- client/pages/OwnerProfilePage.tsx
  - Owner profile and account data.
- client/pages/SubmissionView.tsx
  - Owner visibility into submission status.

## 5.2 Owner/Submission Backend Routes
- server/routes/owner-bookings.ts
  - Owner booking responses (approve/reject), trust profile, notification logic.
- server/routes/warehouse-submissions.ts
  - Submission create/list/upload workflows.
- server/routes/warehouseSubmission.ts
  - Alternate submission handling module.
- server/routes/recommend-price.ts
  - Price recommendation route logic.
- server/routes/product-pricing.ts
  - Product pricing calculation routes.
- server/routes/cities.ts
  - City support endpoint for location-based workflows.

## 5.3 Database and Migration Ownership
- database/*.sql
  - Schema setup, policy fixes, migrations, data repair, setup scripts.
- supabase/migrations/*.sql
  - Versioned migration history for Supabase.
- server/lib/supabaseClient.ts
  - Server Supabase client setup.
- client/services/supabaseClient.ts
  - Frontend Supabase client setup.

## 5.4 Data Generation, Import, and Repair Scripts
- scripts/import-all-warehouses.ts
- scripts/import-via-api.ts
- scripts/generate-warehouse-sql.ts
- scripts/setup-database.ts
- scripts/deploy-database-schema.ts
- scripts/fix-warehouse-data-quality.js
- scripts/fix-owner-ids.js
- scripts/comprehensive-warehouse-fix.js
- scripts/verify-data.js

Presentation angle for Sahil:
- Show platform backbone and reliability:
  - Schema design
  - RLS policy strategy
  - Data import pipeline for 10k+ rows
  - Data quality correction and migration safety

---

## 6. Shared Core Logic (Cross-Team Awareness)
These files are shared and should be understood by all leads:
- shared/advanced-llm-service.ts
  - Multi-provider LLM fallback and orchestration logic.
- shared/advanced-ml-algorithms.ts
  - Recommendation model computations.
- shared/api.ts
  - Shared API response/request types.
- shared/recommendation.ts
  - Shared recommendation helpers.

Recommended ownership note:
- Keep these as cross-team reviewed files.
- Primary owner can be Dipesh + Manthan for recommendation behavior, with admin/owner teams reviewing impacts.

---

## 7. Suggested Presentation Split (External Demo)

## 7.1 Dipesh + Manthan (Seeker Demo)
Demo story:
1. Login as seeker.
2. Search and filter warehouses.
3. Open details and explain block view.
4. Submit booking/inquiry.
5. Show saved/bookings hub and recommendation panel.

## 7.2 Pranjal (Admin Demo)
Demo story:
1. Login as admin.
2. Show dashboard KPI cards.
3. Review booking statuses.
4. Review warehouse submissions.
5. Show analytics and user operations.

## 7.3 Sahil (Owner + DB Demo)
Demo story:
1. Owner listing workflow and owner dashboard.
2. Show approval/rejection impact from owner side.
3. Explain Supabase schema + RLS.
4. Explain import/migration/data-fix pipeline.

---

## 8. Handoff Rules
- No file movement required.
- No code changes required for ownership split.
- Each member should own:
  - Feature behavior
  - API contracts used by their module
  - Test/demo checklist for their module

---

## 9. Fast Ownership Checklist

Dipesh + Manthan:
- Validate seeker flows from browse -> detail -> booking -> saved/hub.
- Validate recommendation quality and UI fallback behavior.

Pranjal:
- Validate all admin pages load without API errors.
- Validate booking/submission decisions reflect correctly.

Sahil:
- Validate schema and policies.
- Validate data integrity scripts and migration consistency.
- Validate owner submission and booking response workflows.

---

## 10. Optional Next Artifact for Presentation
If required, create a slide deck from this file with:
- 1 architecture slide
- 3 module-owner slides
- 1 risk/mitigation slide
- 1 demo flow slide
- 1 Q&A slide

This document is ready to use as the single source of truth for project task distribution.
