import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ShoppingCart } from "lucide-react";

export function ShopTopbar() {
  const [query, setQuery] = useState("");
  const cartCount = 2;

  const placeholder = useMemo(() => {
    return "Search food, toys, services...";
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-warm/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 pt-4 pb-3">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="shrink-0 font-extrabold tracking-tight text-ink"
            aria-label="Go to home"
          >
            PNetAI
          </Link>

          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-full bg-white px-4 py-2.5 text-sm text-ink shadow-sm ring-1 ring-sand placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-caramel/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-sand hover:bg-warm"
              aria-label="Set location"
            >
              <MapPin className="h-5 w-5 text-muted" />
            </button>

            <Link
              to="/cart"
              className="relative grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-sand hover:bg-warm"
              aria-label="Go to cart"
            >
              <ShoppingCart className="h-5 w-5 text-muted" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brown px-1 text-[11px] font-semibold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
