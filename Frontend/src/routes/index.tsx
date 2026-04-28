import { Routes, Route, Navigate } from "react-router-dom";

import { AdminLayout } from "@/layout/AdminLayout";
import MainLayout from "@/layout/MainLayout";
import ServiceProviderLayout from "@/layout/ServiceProviderLayout";

import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";
import ServiceProviderRoute from "@/routes/ServiceProviderRoute";
import SaleRoute from "@/routes/SaleRoute";

import { ForgotPassword } from "@/pages/Auth/ForgotPassword";
import OtpVerifyPage from "@/pages/Auth/OtpVerify";
import VerifyReactivation from "@/pages/Auth/VerifyReactivation";
import ResetPasswordPage from "@/pages/Auth/ResetPassword";
import MyPetsPage from "@/pages/Pets/MyPetsPage";
import UserProfile from "@/pages/Profile/UserProfile";
import BlogDetailPage from "@/pages/Blogs/BlogDetailPage";
import MyBlogsPage from "@/pages/Blogs/MyBlogsPage";
import BlogEditorPage from "@/pages/Blogs/BlogEditorPage";

import { AdminDashboard } from "@/pages/Admin/AdminDashboard";
import SalesManagementPage from "@/pages/Admin/Users/SalesManagementPage";
import ProvidersManagementPage from "@/pages/Admin/Users/ProvidersManagementPage";
import OwnersManagementPage from "@/pages/Admin/Users/OwnersManagementPage";
import FinanceTransactionsPage from "@/pages/Admin/Finance/FinanceTransactionsPage";

import { ProductCatalog as ProductManagement } from "@/pages/ServiceProvider/Atelier/ProductCatalog";
import { ClinicServices as ServiceManagement } from "@/pages/ServiceProvider/Atelier/ClinicServices";

import { ServiceProviderOverview } from "@/pages/ServiceProvider/Atelier/Overview";
import { CustomerDirectory as CustomerBookingsPage } from "@/pages/ServiceProvider/Atelier/CustomerDirectory";
import { AtelierProfile as ServiceProviderProfilePage } from "@/pages/ServiceProvider/Atelier/AtelierProfile";
import { Subscription as SubscriptionPage } from "@/pages/ServiceProvider/Atelier/Subscription";
import { CheckoutSuccess as SubscriptionSuccessPage } from "@/pages/ServiceProvider/Atelier/CheckoutSuccess";
import { CheckoutCancel as SubscriptionCancelPage } from "@/pages/ServiceProvider/Atelier/CheckoutCancel";
import { OrdersManagement as ServiceProviderOrdersPage } from "@/pages/ServiceProvider/Atelier/OrdersManagement";

import { Login } from "@/pages/Auth/Login";
import { Register } from "@/pages/Auth/Register";
import LandingPage from "@/pages/LandingPage";
import { NotFound } from "@/components/NotFound";
import ShopLayout from "@/layout/ShopLayout";
import ShopPage from "@/pages/Products/ShopPage";
import ProductDetailPage from "@/pages/Products/ProductDetailPage";
import ServiceBookingLayout from "@/layout/ServiceBookingLayout";
import ServiceBookingPage from "@/pages/Services/ServiceBookingPage";
import BookingSuccess from "@/pages/Services/BookingSuccess";
import BookingCancel from "@/pages/Services/BookingCancel";
import ServicesPage from "@/pages/Services/ServicesPage";
import BlogsPage from "@/pages/Blogs/BlogsPage";
import ServiceProviderApprovalsPage from "@/pages/Sale/ServiceProviderApprovalsPage";
import SalePendingApprovalsPage from "@/pages/Sale/SalePendingApprovalsPage";
import SaleLayout from "@/layout/SaleLayout";
import SaleProfilePage from "@/pages/Sale/SaleProfilePage";
import AdminBlogApprovalsPage from "@/pages/Admin/BlogApprovalsPage";
import RefundRequestsPage from "@/pages/Admin/RefundRequestsPage";
import MyBookingsPage from "@/pages/Orders/MyBookingsPage";
import PurchasedProductsPage from "@/pages/Orders/PurchasedProductsPage";
import CheckoutPage from "@/pages/Shop/CheckoutPage";
import CheckoutSuccessPage from "@/pages/Shop/CheckoutSuccessPage";
import CheckoutCancelPage from "@/pages/Shop/CheckoutCancelPage";
import AdminOrdersPage from "@/pages/Admin/AdminOrdersPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Admin */}
      <Route path="admin" element={<AdminLayout />}>
        <Route element={<AdminRoute />}>
          <Route index element={<AdminDashboard />} />
          <Route path="orders-ledger" element={<AdminOrdersPage />} />
          <Route path="users/sales" element={<SalesManagementPage />} />
          <Route path="users/providers" element={<ProvidersManagementPage />} />
          <Route path="users/owners" element={<OwnersManagementPage />} />
          <Route path="finance/transactions" element={<FinanceTransactionsPage />} />
          <Route path="finance/refunds" element={<RefundRequestsPage />} />
          <Route path="finance/payouts" element={<div className="p-20 text-center text-xs font-bold uppercase tracking-widest text-muted">Payout / Ledger Ledger Module Coming Soon</div>} />
          <Route path="blogs/approvals" element={<AdminBlogApprovalsPage />} />
          
          {/* Legacy or fallback */}
          <Route path="users" element={<Navigate to="/admin/users/owners" replace />} />
        </Route>
      </Route>

      {/* Service Provider */}
      <Route element={<ServiceProviderRoute />}>
        <Route path="service-provider" element={<ServiceProviderLayout />}>
          <Route index element={<ServiceProviderOverview />} />
          <Route path="orders" element={<ServiceProviderOrdersPage />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="services" element={<ServiceManagement />} />
          <Route path="customers" element={<CustomerBookingsPage />} />
          <Route path="profile" element={<ServiceProviderProfilePage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="subscription/success" element={<SubscriptionSuccessPage />} />
          <Route path="subscription/cancel" element={<SubscriptionCancelPage />} />
        </Route>
      </Route>

      {/* Sale */}
      <Route element={<SaleRoute />}>
        <Route path="sale" element={<SaleLayout />}>
          <Route index element={<ServiceProviderApprovalsPage />} />
          <Route path="providers" element={<ServiceProviderApprovalsPage />} />
          <Route path="approvals" element={<Navigate to="/sale/approvals/accounts" replace />} />
          <Route path="approvals/accounts" element={<SalePendingApprovalsPage mode="account" />} />
          <Route path="approvals/legal" element={<SalePendingApprovalsPage mode="legal" />} />
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
        <Route path="verify-reactivation" element={<VerifyReactivation />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="blogs" element={<BlogsPage />} />
        <Route path="blogs/:blogId" element={<BlogDetailPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<UserProfile />} />
          <Route path="my-pets" element={<MyPetsPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
          <Route path="purchased-products" element={<PurchasedProductsPage />} />
          <Route path="my-blogs" element={<MyBlogsPage />} />
          <Route path="blogs/new" element={<BlogEditorPage />} />
          <Route path="blogs/edit/:id" element={<BlogEditorPage />} />
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
        <Route path="checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="checkout/cancel" element={<CheckoutCancelPage />} />
      </Route>

      {/* Services booking */}
      <Route path="services" element={<ServiceBookingLayout />}>
        <Route index element={<ServicesPage />} />
        <Route path=":serviceId" element={<ServiceBookingPage />} />
        <Route path=":serviceId/booking/success" element={<BookingSuccess />} />
        <Route path=":serviceId/booking/cancel" element={<BookingCancel />} />
      </Route>

      {/* Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
