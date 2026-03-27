export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-pink-100 bg-gradient-to-r from-pink-50 via-white to-cyan-50">
      <div className="absolute -top-16 right-10 h-48 w-48 rounded-full bg-pink-200/30 blur-3xl" />
      <div className="absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="inline-flex items-center rounded-full border border-pink-200 bg-white/80 px-3 py-1 text-xs font-semibold text-pink-500">
              🐾 PNetAI
            </p>
            <h3 className="mt-4 text-2xl font-bold text-gray-900">
              Better care for every pet, every day.
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">
              Trusted products, smart booking, and a warm community for modern pet parents.
            </p>
          </div>

          <div className="md:col-span-7">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Explore</p>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <a className="block hover:text-pink-500">Home</a>
                  <a className="block hover:text-pink-500">Shop</a>
                  <a className="block hover:text-pink-500">Services</a>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Support</p>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <a className="block hover:text-pink-500">Help Center</a>
                  <a className="block hover:text-pink-500">Contact</a>
                  <a className="block hover:text-pink-500">FAQs</a>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Legal</p>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <a className="block hover:text-pink-500">Privacy Policy</a>
                  <a className="block hover:text-pink-500">Terms of Service</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-pink-100 pt-6 text-sm text-gray-500 sm:flex-row">
          <p>© 2026 PNetAI. All rights reserved.</p>
          <p className="text-gray-400">Made with care for pet lovers.</p>
        </div>
      </div>
    </footer>
  );
}
