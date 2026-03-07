import Hero from "../components/features/landing/Hero";
import Services from "../components/features/landing/Services";
import SocialFeed from "../components/features/landing/SocialFeed";
import Shop from "../components/features/landing/Shop";
import AIVet from "../components/features/landing/AIVet";
import Footer from "../components/layout/Footer";

export default function LandingPage() {
    return (
        <>
                <Hero />
                <Services />
                <SocialFeed />
                <Shop />
                <AIVet />
                <Footer />
        </>
    );
}