import { useEffect } from "react";
import {
  Hero,
  ServicesStrip,
  CareServices,
  AICareStory,
  FeaturedBreeding,
  FeaturedProducts,
  CommunityJournal,
  HomeCallToAction,
} from "../components/landing";
import Footer from "@/layout/Footer";

export default function LandingPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative bg-cream">
      <Hero />
      <ServicesStrip />
      <CareServices />
      <AICareStory />
      <FeaturedBreeding />
      <FeaturedProducts />
      <CommunityJournal />
      <HomeCallToAction />
      <Footer />
    </div>
  );
}
