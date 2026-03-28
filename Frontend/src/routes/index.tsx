import { Routes, Route } from "react-router-dom";

import { AdminLayout } from "@/layout/AdminLayout";
import MainLayout from "@/layout/MainLayout";

import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";

import { ForgotPassword } from "@/pages/Auth/ForgotPassword";
import OtpVerifyPage from "@/pages/Auth/OtpVerify";
import ResetPasswordPage from "@/pages/Auth/ResetPassword";
import MyPetsPage from "@/pages/Pets/MyPetsPage";

import { AdminDashboard } from "@/pages/Admin/AdminDashboard";
import { UserManagement } from "@/pages/Admin/UserManagement";

import { Login } from "@/pages/Auth/Login";
import { Register } from "@/pages/Auth/Register";
import LandingPage from "@/pages/LandingPage";
import { NotFound } from "@/components/NotFound";
import ShopLayout from "@/layout/ShopLayout";
import ShopPage from "@/pages/Products/ShopPage";
import ProductDetailPage from "@/pages/Products/ProductDetailPage";
import ServiceBookingLayout from "@/layout/ServiceBookingLayout";
import ServiceBookingPage from "@/pages/Services/ServiceBookingPage";
import ServicesPage from "@/pages/Services/ServicesPage";
import BlogsPage from "@/pages/Blogs/BlogsPage";

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
        <Route path="otp-verify" element={<OtpVerifyPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="blogs" element={<BlogsPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<MyPetsPage />} />
          <Route path="my-pets" element={<MyPetsPage />} />
        </Route>
      </Route>

      {/* Shop */}
      <Route path="products" element={<ShopLayout />}>
        <Route index element={<ShopPage />} />
        <Route path=":productId" element={<ProductDetailPage />} />
      </Route>

      {/* Services booking */}
      <Route path="services" element={<ServiceBookingLayout />}>
        <Route index element={<ServicesPage />} />
        <Route path=":serviceId" element={<ServiceBookingPage />} />
      </Route>

      {/* Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
