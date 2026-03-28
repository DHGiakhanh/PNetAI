export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-sand bg-gradient-to-r from-warm via-white to-cream">
      <div className="absolute -top-16 right-10 h-48 w-48 rounded-full bg-caramel/20 blur-3xl" />
      <div className="absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-sage/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="inline-flex items-center rounded-full border border-sand bg-white/80 px-3 py-1 text-xs font-semibold text-brown">
              🐾 PNetAI
            </p>
            <h3 className="mt-4 font-serif text-3xl font-bold italic text-ink">
              Better care for every pet, every day.
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Trusted products, smart booking, and a warm community for modern pet parents.
            </p>
          </div>

          <div className="md:col-span-7">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <p className="text-sm font-bold text-ink">Explore</p>
                <div className="mt-3 space-y-2 text-sm text-muted">
                  <a className="block transition hover:text-brown">Home</a>
                  <a className="block transition hover:text-brown">Shop</a>
                  <a className="block transition hover:text-brown">Services</a>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Support</p>
                <div className="mt-3 space-y-2 text-sm text-muted">
                  <a className="block transition hover:text-brown">Help Center</a>
                  <a className="block transition hover:text-brown">Contact</a>
                  <a className="block transition hover:text-brown">FAQs</a>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Legal</p>
                <div className="mt-3 space-y-2 text-sm text-muted">
                  <a className="block transition hover:text-brown">Privacy Policy</a>
                  <a className="block transition hover:text-brown">Terms of Service</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-sand pt-6 text-sm text-muted sm:flex-row">
          <p>© 2026 PNetAI. All rights reserved.</p>
          <p className="text-muted/80">Made with care for pet lovers.</p>
        </div>
      </div>
    </footer>
  );
}
