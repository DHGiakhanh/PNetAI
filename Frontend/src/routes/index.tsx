import { Routes, Route } from "react-router-dom";

import { AdminLayout } from "@/layout/AdminLayout";
import MainLayout from "@/layout/MainLayout";
import ServiceProviderLayout from "@/layout/ServiceProviderLayout";

import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";
import ServiceProviderRoute from "@/routes/ServiceProviderRoute";
import SaleRoute from "@/routes/SaleRoute";

import { ForgotPassword } from "@/pages/Auth/ForgotPassword";
import OtpVerifyPage from "@/pages/Auth/OtpVerify";
import ResetPasswordPage from "@/pages/Auth/ResetPassword";
import MyPetsPage from "@/pages/Pets/MyPetsPage";
import UserProfile from "@/pages/Profile/UserProfile";
import BlogDetailPage from "@/pages/Blogs/BlogDetailPage";

import { AdminDashboard } from "@/pages/Admin/AdminDashboard";
import { UserManagement } from "@/pages/Admin/UserManagement";
import { ProductManagement } from "@/pages/Admin/ProductManagement";
import { ServiceManagement } from "@/pages/Admin/ServiceManagement";
import { ServiceProviderOverview } from "@/pages/Admin/ServiceProviderOverview";
import { CustomerBookingsPage } from "@/pages/Admin/CustomerBookingsPage";
import ServiceProviderProfilePage from "@/pages/ServiceProvider/ServiceProviderProfilePage";

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
import ServiceProviderApprovalsPage from "@/pages/Sale/ServiceProviderApprovalsPage";
import SalePendingApprovalsPage from "@/pages/Sale/SalePendingApprovalsPage";
import SaleLayout from "@/layout/SaleLayout";
import SaleProfilePage from "@/pages/Sale/SaleProfilePage";
import MyBookingsPage from "@/pages/Orders/MyBookingsPage";
import PurchasedProductsPage from "@/pages/Orders/PurchasedProductsPage";
import CheckoutPage from "@/pages/Shop/CheckoutPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Admin */}
      <Route path="admin" element={<AdminLayout />}>
        <Route element={<AdminRoute />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
      </Route>

      {/* Service Provider */}
      <Route element={<ServiceProviderRoute />}>
        <Route path="service-provider" element={<ServiceProviderLayout />}>
          <Route index element={<ServiceProviderOverview />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="services" element={<ServiceManagement />} />
          <Route path="bookings" element={<CustomerBookingsPage />} />
          <Route path="profile" element={<ServiceProviderProfilePage />} />
        </Route>
      </Route>

      {/* Sale */}
      <Route element={<SaleRoute />}>
        <Route path="sale" element={<SaleLayout />}>
          <Route index element={<ServiceProviderApprovalsPage />} />
          <Route path="providers" element={<ServiceProviderApprovalsPage />} />
          <Route path="approvals" element={<SalePendingApprovalsPage />} />
          <Route path="profile" element={<SaleProfilePage />} />
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
        <Route path="blogs/:blogId" element={<BlogDetailPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<UserProfile />} />
          <Route path="my-pets" element={<MyPetsPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
          <Route path="purchased-products" element={<PurchasedProductsPage />} />
        </Route>
      </Route>

      {/* Shop */}
      <Route path="products" element={<ShopLayout />}>
        <Route index element={<ShopPage />} />
        <Route path=":productId" element={<ProductDetailPage />} />
      </Route>

      {/* Checkout */}
      <Route element={<ProtectedRoute />}>
        <Route path="checkout" element={<CheckoutPage />} />
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
