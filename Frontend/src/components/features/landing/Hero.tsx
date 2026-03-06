export default function Hero() {
  return (
    <header className="hero">
      <div className="container">

        <div className="hero-content">
          <div className="badge">
            ✨ Welcome to the pack!
          </div>

          <h1>A Social Home for You and Your Pets</h1>

          <p>
            Connect with fellow pet lovers, book trusted services,
            shop for pawsome goodies, and get instant advice from our AI Vet
            — all in one joyful place.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary">
              Join the Community
            </button>

            <button className="btn btn-secondary">
              Explore as Guest
            </button>
          </div>
        </div>

        <div className="hero-visual-wide">
          <img
            src="https://app.banani.co/image-fallback.png"
            alt="Pets playing in park"
          />
        </div>

      </div>
    </header>
  );
}