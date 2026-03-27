import Hero from "../components/landing/Hero";
import Services from "../components/landing/Services";
import SocialFeed from "../components/landing/SocialFeed";
import Shop from "../components/landing/Shop";
import AIVet from "../components/landing/AIVet";
import Footer from "../layout/Footer";

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