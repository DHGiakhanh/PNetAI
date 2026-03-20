import Hero from "../components/Hero";
import Services from "../components/Services";
import SocialFeed from "../components/SocialFeed";
import Shop from "../components/Shop";
import AIVet from "../components/AIVet";
import Footer from "../../../layout/Footer";

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