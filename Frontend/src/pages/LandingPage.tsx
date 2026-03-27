import { useState, useEffect } from "react";
import {
  Hero,
  ServicesStrip,
  Features,
  FeaturedProducts,
  SpaBooking,
  Testimonials,
  Newsletter,
  ProductDetail,
} from "../components/landing";

export default function LandingPage() {
  const [activePage, setActivePage] = useState<"home" | "product">("home");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage]);

  return (
    <div className="relative">
      <div className={activePage === "home" ? "block" : "hidden"}>
        <Hero />
        <ServicesStrip />
        <Features />
        <FeaturedProducts onProductClick={() => setActivePage("product")} />
        <SpaBooking />
        <Testimonials />
        <Newsletter />
      </div>

      <div className={activePage === "product" ? "block" : "hidden"}>
        <ProductDetail />
      </div>
    </div>
  );
}
