import { Routes, Route } from "react-router-dom";

import { AdminLayout } from "@/layout/AdminLayout";
import MainLayout from "@/layout/MainLayout";

import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";
import { PetOwnerRoute, PartnerRoute, SalesRoute } from "@/routes/RoleBasedRoutes";

import { ForgotPassword } from "@/features/auth/pages/ForgotPassword";
import UserProfile from "@/features/profile/pages/UserProfile";

import { AdminDashboard } from "@/features/admin/pages/AdminDashboard";
import { UserManagement } from "@/features/admin/pages/UserManagement";

import PetOwnerDashboard from "@/features/dashboard/pages/PetOwnerDashboard";
import PartnerDashboard from "@/features/dashboard/pages/PartnerDashboard";
import SalesDashboard from "@/features/dashboard/pages/SalesDashboard";

import Feed from "@/features/feed/pages/Feed";
import Pets from "@/features/pets/pages/Pets";
import Booking from "@/features/booking/pages/Booking";

import { Login } from "@/features/auth/pages/Login";
import { Register } from "@/features/auth/pages/Register";
import LandingPage from "@/features/landing/pages/LandingPage";
import { NotFound } from "@/components/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Admin */}
      <Route element={<AdminRoute />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
      </Route>

      {/* Main layout */}
      <Route path="/" element={<MainLayout />}>
        {/* Public */}
        <Route index element={<LandingPage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          {/* Role-based dashboards */}
          <Route element={<PetOwnerRoute />}>
            <Route path="dashboard" element={<PetOwnerDashboard />} />
          </Route>
          <Route element={<PartnerRoute />}>
            <Route path="serviceprovider/dashboard" element={<PartnerDashboard />} />
          </Route>
          <Route element={<SalesRoute />}>
            <Route path="sales/dashboard" element={<SalesDashboard />} />
          </Route>
          
          {/* Common routes */}
          <Route path="profile" element={<UserProfile />} />
          <Route path="feed" element={<Feed />} />
          <Route path="pets" element={<Pets />} />
          <Route path="booking" element={<Booking />} />
        </Route>
      </Route>

      {/* Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}