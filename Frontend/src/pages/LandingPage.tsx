import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hero,
  ServicesStrip,
  Features,
  FeaturedProducts,
  SpaBooking,
  Testimonials,
  Newsletter,
} from "../components/landing";
import Footer from "@/layout/Footer";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative bg-gradient-to-b from-white to-warm">
      <Hero />
      <ServicesStrip />
      <Features />
      <FeaturedProducts onProductClick={(productId) => navigate(`/products/${productId}`)} />
      <SpaBooking />
      <Testimonials />
      <Newsletter />
      <Footer />
    </div>
  );
}
