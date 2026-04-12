import { Navigate, Outlet, useLocation } from "react-router-dom";

const resolveProviderStatus = (value?: string) => {
  if (
    value === "pending_sale_approval" ||
    value === "pending_legal_submission" ||
    value === "pending_legal_approval" ||
    value === "approved"
  ) {
    return value;
  }
  return "pending_sale_approval";
};

export default function ServiceProviderRoute() {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (user.role !== "service_provider" && user.role !== "shop") {
    return <Navigate to="/" />;
  }

  const status = resolveProviderStatus(user.providerOnboardingStatus);
  const isApproved = status === "approved";
  const isProfilePage = location.pathname === "/service-provider/profile";

  if (!isApproved && !isProfilePage) {
    return <Navigate to="/service-provider/profile?section=legal-documents" replace />;
  }

  return <Outlet />;
}
