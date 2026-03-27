import {
  Scissors,
  Stethoscope,
  Medal,
  Home
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Services() {
  const services = [
    {
      id: "gentle-oatmeal-wash",
      title: "Spa Day",
      desc: "Keep 'em fluffy and clean with top-rated groomers in your neighborhood.",
      icon: Scissors,
      bg: "bg-pink-100",
      text: "text-pink-700",
      iconColor: "text-pink-500"
    },
    {
      id: "vaccination",
      title: "Health Check",
      desc: "Book appointments at trusted local veterinary clinics instantly.",
      icon: Stethoscope,
      bg: "bg-green-100",
      text: "text-green-800",
      iconColor: "text-green-600"
    },
    {
      id: "full-grooming",
      title: "Good Boy Classes",
      desc: "Expert behavior classes and obedience training for puppies and adults.",
      icon: Medal,
      bg: "bg-blue-100",
      text: "text-blue-800",
      iconColor: "text-blue-600"
    },
    {
      id: "full-grooming",
      title: "Cozy Stays",
      desc: "Safe, fun, and comfortable boarding facilities while you're away.",
      icon: Home,
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      iconColor: "text-yellow-600"
    }
  ];

  return (
    <section className="py-24 bg-[#fafcff]">
      <div className="max-w-6xl mx-auto px-6">

        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800">
            Everything your pet needs
          </h2>

          <div className="text-3xl mt-3">🛁</div>

          <p className="text-gray-500 mt-6 max-w-xl mx-auto">
            From squeaky clean spa days to routine health checks, find and
            book the best local professionals with just a few taps.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8">

          {services.map((service, index) => {
            const Icon = service.icon;

            return (
              <Link
                key={index}
                to={`/services/${service.id}`}
                className={`${service.bg} p-10 rounded-[32px] flex gap-6 items-start`}
              >

                {/* Icon */}
                <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm">
                  <Icon className={`w-7 h-7 ${service.iconColor}`} />
                </div>

                {/* Text */}
                <div>
                  <h3 className={`text-xl font-semibold ${service.text}`}>
                    {service.title}
                  </h3>

                  <p className="text-gray-600 mt-2 leading-relaxed">
                    {service.desc}
                  </p>
                </div>

              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}