export default function Services() {
  const services = [
    {
      title: "Spa Day",
      description:
        "Keep 'em fluffy and clean with top-rated groomers in your neighborhood.",
      icon: "✂️",
    },
    {
      title: "Health Check",
      description:
        "Book appointments at trusted local veterinary clinics instantly.",
      icon: "🩺",
    },
    {
      title: "Good Boy Classes",
      description:
        "Expert behavior classes and obedience training for puppies and adults.",
      icon: "🏅",
    },
    {
      title: "Cozy Stays",
      description:
        "Safe, fun, and comfortable boarding facilities while you're away.",
      icon: "🏠",
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <h2>Everything your pet needs 🛁</h2>
          <p>
            From squeaky clean spa days to routine health checks, find and book
            the best local professionals with just a few taps.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card-wide">
              <div className="service-icon">{service.icon}</div>

              <div className="service-text">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}