import { Routes, Route } from "react-router-dom";

import { AdminLayout } from "@/layout/AdminLayout";
import MainLayout from "@/layout/MainLayout";

import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";

import { ForgotPassword } from "@/features/auth/pages/ForgotPassword";
import UserProfile from "@/features/profile/pages/UserProfile";

import { AdminDashboard } from "@/features/admin/pages/AdminDashboard";
import { UserManagement } from "@/features/admin/pages/UserManagement";

import { Login } from "@/features/auth/pages/Login";
import { Register } from "@/features/auth/pages/Register";
import LandingPage from "@/features/landing/pages/LandingPage";
import { NotFound } from "@/components/NotFound";
import ShopLayout from "@/layout/ShopLayout";
import ShopPage from "@/features/products/pages/ShopPage";
import ProductDetailPage from "@/features/products/pages/ProductDetailPage";
import ServiceBookingLayout from "@/layout/ServiceBookingLayout";
import ServiceBookingPage from "@/features/services/pages/ServiceBookingPage";

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
          <Route path="profile" element={<UserProfile />} />
        </Route>
      </Route>

      {/* Shop */}
      <Route path="products" element={<ShopLayout />}>
        <Route index element={<ShopPage />} />
        <Route path=":productId" element={<ProductDetailPage />} />
      </Route>

      {/* Services booking */}
      <Route path="services" element={<ServiceBookingLayout />}>
        <Route path=":serviceId" element={<ServiceBookingPage />} />
      </Route>

      {/* Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}