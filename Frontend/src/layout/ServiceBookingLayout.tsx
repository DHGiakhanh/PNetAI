import { Outlet } from "react-router-dom";
import { AppNavbar } from "@/layout/AppNavbar";

export default function ServiceBookingLayout() {
  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <AppNavbar />
      <Outlet />
    </div>
  );
}
