import { Navigate, Outlet } from "react-router-dom";

// Types for user roles
export type UserRole = 'admin' | 'sale' | 'petowner' | 'serviceprovider';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  partnerType?: string;
  isVerified: boolean;
  customerCode?: string;
  saleCode?: string;
  managedBy?: string;
}

// Hook to get current user
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

// Hook to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("token");
};

// Role-based route components
export function PetOwnerRoute() {
  const token = localStorage.getItem("token");
  const user = getCurrentUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'petowner') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export function PartnerRoute() {
  const token = localStorage.getItem("token");
  const user = getCurrentUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'serviceprovider') {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!user?.isVerified) {
    return <Navigate to="/partner-pending" replace />;
  }

  return <Outlet />;
}

export function SalesRoute() {
  const token = localStorage.getItem("token");
  const user = getCurrentUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'sale') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const token = localStorage.getItem("token");
  const user = getCurrentUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// Enhanced ProtectedRoute that works for all authenticated users
export function ProtectedRoute() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Route that allows specific roles
export function RoleRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const token = localStorage.getItem("token");
  const user = getCurrentUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
