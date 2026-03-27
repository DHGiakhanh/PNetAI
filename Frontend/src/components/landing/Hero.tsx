const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center bg-gradient-to-r from-pink-50 via-pink-50 to-cyan-50 pt-20 px-6 lg:px-24 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        <div className="z-10 animate-in fade-in slide-in-from-left duration-700">
          <div className="inline-flex items-center gap-2 bg-white border border-pink-100 px-4 py-1.5 rounded-full mb-8">
            <span className="text-pink-500 text-sm">✦</span>
            <span className="text-gray-700 text-[13px] font-medium tracking-tight">
              Over 2,000 authentic products
            </span>
          </div>

          <h1 className="font-serif text-[64px] lg:text-[88px] leading-[0.95] font-extrabold text-gray-900 mb-8 tracking-tight">
            Cherish <br />
            every small <br />
            <span className="text-pink-500 italic font-normal">moment</span>
          </h1>

          <p className="text-gray-600 text-[18px] leading-relaxed max-w-[460px] mb-12 font-sans font-light">
            Pet accessories, spa services, and a community for pet lovers - all in one warm and cozy place.
          </p>

          <div className="flex flex-wrap items-center gap-8">
            <button className="bg-pink-500 text-white px-10 py-4 rounded-full font-bold text-[15px] hover:bg-pink-600 transition-all duration-300 shadow-xl shadow-pink-200/70 group">
              Explore Now →
            </button>
            <button className="text-gray-800 font-bold text-[15px] flex items-center gap-1.5 hover:opacity-70 transition-opacity">
              Book a Spa ↗
            </button>
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end animate-in fade-in slide-in-from-right duration-1000 lg:pr-12">
          <div className="relative w-full max-w-[500px] aspect-[4/5.2]">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-pink-100 to-cyan-100 rounded-[60px] shadow-2xl overflow-hidden flex items-center justify-center group">
              <div className="relative opacity-80 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <div className="flex flex-col gap-2 translate-y-[-10px]">
                  <span className="text-[120px] drop-shadow-2xl">🐾</span>
                </div>
              </div>
            </div>

            <div className="absolute top-10 right-[-15px] bg-pink-500 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-xl z-20">
              <span className="text-lg">🛁</span>
              <span className="text-[13px] font-bold whitespace-nowrap tracking-tight">Spa available today!</span>
            </div>

            <div className="absolute left-[-70px] top-[25%] flex flex-col gap-4 z-20 hidden md:flex">
              <div className="bg-white p-6 rounded-[32px] shadow-2xl shadow-black/5 border border-pink-100 w-[140px] animate-in fade-in slide-in-from-left duration-700 delay-300">
                <div className="text-gray-900 text-[28px] font-bold font-serif leading-none italic">4.9</div>
                <div className="text-gray-500 text-[12px] font-medium mt-1">Ratings</div>
              </div>
              <div className="bg-white p-6 rounded-[32px] shadow-2xl shadow-black/5 border border-pink-100 w-[140px] animate-in fade-in slide-in-from-left duration-700 delay-500">
                <div className="text-gray-900 text-[28px] font-bold font-serif leading-none italic">12k</div>
                <div className="text-gray-500 text-[12px] font-medium mt-1">Customers</div>
              </div>
            </div>

            <div className="absolute bottom-10 left-[-30px] w-[320px] z-30 animate-in fade-in slide-in-from-bottom duration-1000 delay-700">
              <div className="bg-white p-5 rounded-[32px] shadow-2xl shadow-black/10 flex items-center gap-4 border border-pink-100/70">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl">🐕</div>
                <div>
                  <div className="text-gray-900 text-[16px] font-bold leading-tight">Mochi booked</div>
                  <div className="text-gray-500 text-[12px] mt-0.5">Grooming · 10:00 AM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-pink-200/25 rounded-full blur-[120px] -z-10" />
    </section>
  );
};

export { Hero };
export default Hero;
