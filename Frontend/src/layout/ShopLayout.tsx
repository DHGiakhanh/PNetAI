import { Outlet } from "react-router-dom";
import { AppNavbar } from "@/layout/AppNavbar";

export default function ShopLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-warm to-cream">
      <AppNavbar />
      <Outlet />
    </div>
  );
}
