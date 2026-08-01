import { Routes, Route } from "react-router-dom";
import { TierProvider } from "./lib/TierContext";
import { AuthProvider } from "./lib/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Onboarding from "./pages/Onboarding";
import LoginPage from "./pages/auth/LoginPage";
import StaffLoginPage from "./pages/auth/StaffLoginPage";
import AdminPanel from "./pages/admin/AdminPanel";
import CustomerMenu from "./pages/customer/CustomerMenu";
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import BillPage from "./pages/customer/BillPage";
import StaffDashboard from "./pages/staff/StaffDashboard";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import Demo from "./pages/Demo";

// Changes when the live application bundle needs a cache-safe deployment.
const LIVE_BUILD_ID = "2026-07-31-owner-live-data";

export default function TablelyApp() {
  return (
    <div data-live-build={LIVE_BUILD_ID}>
      <AuthProvider>
      <TierProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/demo" element={<Demo />} />

          {/* Customer portal — public (legacy, keep for backward compat) */}
          <Route path="/:restaurantId/order/:tableId" element={<CustomerMenu />} />

          {/* Customer dashboard flow */}
          <Route path="/:restaurantId/login" element={<CustomerLogin />} />
          <Route path="/:restaurantId/dashboard" element={<CustomerDashboard />} />

          {/* Public e-bill page */}
          <Route path="/:restaurantId/bill/:orderId" element={<BillPage />} />

          {/* Staff login — public */}
          <Route path="/:restaurantId/staff/login" element={<StaffLoginPage />} />

          {/* Owner portal — requires authenticated owner */}
          <Route
            path="/:restaurantId/owner"
            element={
              <ProtectedRoute requiredRole="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Staff portal — requires authenticated staff */}
          <Route
            path="/:restaurantId/staff"
            element={
              <ProtectedRoute requiredRole="staff">
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </TierProvider>
      </AuthProvider>
    </div>
  );
}
