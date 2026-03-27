import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export default function ShopLayout() {
  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <Header />
      <Outlet />
    </div>
  );
}

