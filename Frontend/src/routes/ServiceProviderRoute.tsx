import { Navigate, Outlet } from "react-router-dom";

export default function ServiceProviderRoute() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (user.role !== "service_provider" && user.role !== "shop") {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}

