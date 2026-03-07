export default function Hero() {
  return (
    <section className="bg-[#f5efe8] pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-6 text-center">

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">
          Welcome to Your{" "}
          <span className="relative">
            Pet’s
            <span className="absolute left-0 bottom-1 w-full h-3 bg-purple-200 -z-10 rounded"></span>
          </span>{" "}
          <br />
          Second Home!
        </h1>

        {/* Description */}
        <p className="mt-6 text-gray-600 max-w-xl mx-auto text-lg">
          From grooming to training, and more, we offer a full range of
          services to keep your pets happy.
        </p>

        {/* Images */}
        <div className="mt-16 grid grid-cols-3 gap-6 items-center">

          {/* Left Image */}
          <div className="overflow-hidden rounded-[40px] h-[420px]">
            <img
              src="https://images.unsplash.com/photo-1518717758536-85ae29035b6d"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Center Image */}
          <div className="relative overflow-hidden rounded-[40px] h-[460px]">

            <img
              src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7"
              className="w-full h-full object-cover"
            />

            {/* Badge */}
            <div className="absolute top-4 left-4 flex gap-3">
              <span className="bg-black/80 text-white px-4 py-1 rounded-full text-sm">
                8+ Years experience
              </span>

              <span className="bg-black/80 text-white px-4 py-1 rounded-full text-sm">
                4k+ Satisfied clients
              </span>
            </div>

            {/* Review */}
            <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-md flex items-center gap-3 text-left">
              <img
                src="https://randomuser.me/api/portraits/women/44.jpg"
                className="w-8 h-8 rounded-full"
              />

              <p className="text-sm text-gray-600">
                "They treated my dog like family, and the grooming was perfect!"
              </p>
            </div>
          </div>

          {/* Right Image */}
          <div className="overflow-hidden rounded-[40px] h-[420px]">
            <img
              src="https://images.unsplash.com/photo-1518791841217-8f162f1e1131"
              className="w-full h-full object-cover"
            />
          </div>

        </div>
      </div>
    </section>
  );
}