import { Outlet } from "react-router-dom";
import { ShopTopbar } from "@/features/products/components/ShopTopbar";

export default function ShopLayout() {
  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <ShopTopbar />
      <Outlet />
    </div>
  );
}

