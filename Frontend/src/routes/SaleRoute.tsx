import { Navigate, Outlet } from "react-router-dom";

export default function SaleRoute() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (user.role !== "sale") {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}

