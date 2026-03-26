import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./contexts/AuthContext";
import { WarehouseProvider } from "./contexts/WarehouseContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "./components/ui/toaster";
import { GeminiChatbot } from "./components/GeminiChatbot";
import ProtectedRoute from "./components/ProtectedRoute";

import Placeholder from "./pages/Placeholder";
import Index from "./pages/Index";
import About from "./pages/About";
import Warehouses from "./pages/Warehouses";
import WarehouseDetail from "./pages/WarehouseDetail";
import Compare from "./pages/Compare";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBookingsPage from "./pages/AdminBookingsPage";
import OwnerNotificationsPage from "./pages/OwnerNotificationsPage";
import SeekerDashboard from "./pages/SeekerDashboard";
import SeekerHub from "./pages/SeekerHub";
import SeekerBookingsPage from "./pages/SeekerBookingsPage";
import SeekerProfilePage from "./pages/SeekerProfilePage";
import Activity from "./pages/Activity";
import Saved from "./pages/Saved";
import OwnerProfilePage from "./pages/OwnerProfilePage";
import AdminVerificationPage from "./pages/AdminVerificationPage";
import MLRecommendationsPage from "./pages/MLRecommendationsPage";
import ListProperty from "./pages/ListProperty";
import SubmissionView from "./pages/SubmissionView";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminWarehousesPage from "./pages/AdminWarehousesPage";
import InvoicePage from "./pages/InvoicePage";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import OwnerProperties from "./pages/OwnerProperties";
import SmartBooking from "./pages/SmartBooking";
import AdminWarehouseSubmissionsPage from "./pages/AdminWarehouseSubmissionsPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import OwnerAnalyticsPage from "./pages/OwnerAnalyticsPage";

const queryClient = new QueryClient();

const App = () => (
  <Router>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <WarehouseProvider>
          <div className="min-h-screen relative selection:bg-blue-500/30 font-sans antialiased">
            <div className="relative z-10">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Login />} />
                <Route path="/register" element={<Login />} />

                {/* Protected routes - authentication required */}
                {/* Warehouse browsing requires login */}
                <Route path="/warehouses" element={
                  <ProtectedRoute>
                    <Warehouses />
                  </ProtectedRoute>
                } />
                {/* MORE SPECIFIC ROUTES MUST COME FIRST! */}
                <Route path="/warehouses/owner/:ownerId" element={
                  <ProtectedRoute>
                    <OwnerProperties />
                  </ProtectedRoute>
                } />
                <Route path="/warehouses/:id" element={
                  <ProtectedRoute>
                    <WarehouseDetail />
                  </ProtectedRoute>
                } />
                <Route path="/compare" element={
                  <ProtectedRoute>
                    <Compare />
                  </ProtectedRoute>
                } />

                {/* Role-specific protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/warehouse-submissions" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminWarehouseSubmissionsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/warehouses" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminWarehousesPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin-verification" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminVerificationPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/bookings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminBookingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/analytics" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAnalyticsPage />
                  </ProtectedRoute>
                } />
                <Route path="/invoice/:bookingId" element={
                  <ProtectedRoute>
                    <InvoicePage />
                  </ProtectedRoute>
                } />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/owner/notifications" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerNotificationsPage />
                  </ProtectedRoute>
                } />
                <Route path="/seeker-dashboard" element={
                  <ProtectedRoute allowedRoles={['seeker']}>
                    <SeekerHub />
                  </ProtectedRoute>
                } />
                <Route path="/seeker-hub" element={
                  <ProtectedRoute allowedRoles={['seeker']}>
                    <SeekerHub />
                  </ProtectedRoute>
                } />
                <Route path="/my-bookings" element={
                  <ProtectedRoute allowedRoles={['seeker']}>
                    <SeekerHub />
                  </ProtectedRoute>
                } />
                <Route path="/saved" element={
                  <ProtectedRoute allowedRoles={['seeker']}>
                    <SeekerHub />
                  </ProtectedRoute>
                } />
                <Route path="/activity" element={
                  <ProtectedRoute allowedRoles={['seeker']}>
                    <SeekerHub />
                  </ProtectedRoute>
                } />
                <Route path="/seeker-profile" element={
                  <ProtectedRoute>
                    <SeekerProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/owner-profile" element={
                  <ProtectedRoute>
                    <OwnerProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/ml-recommendations" element={
                  <ProtectedRoute>
                    <MLRecommendationsPage />
                  </ProtectedRoute>
                } />
                <Route path="/ai-recommendations" element={
                  <ProtectedRoute>
                    <MLRecommendationsPage />
                  </ProtectedRoute>
                } />
                <Route path="/smart-booking" element={
                  <ProtectedRoute>
                    <SmartBooking />
                  </ProtectedRoute>
                } />
                <Route path="/owner/analytics" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerAnalyticsPage />
                  </ProtectedRoute>
                } />
                <Route path="/list-property" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <ListProperty />
                  </ProtectedRoute>
                } />
                <Route path="/submission/:id" element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <SubmissionView />
                  </ProtectedRoute>
                } />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <GeminiChatbot />
            </div>
          </div>
        </WarehouseProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </Router>
);

export default App;
