import { Outlet } from "react-router-dom";
import { ShopTopbar } from "@/components/products/ShopTopbar";

export default function ShopLayout() {
  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <ShopTopbar />
      <Outlet />
    </div>
  );
}

