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
    <header className="sticky top-0 z-50 bg-[#fbfaf7]/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 pt-4 pb-3">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="shrink-0 font-extrabold tracking-tight text-slate-800"
            aria-label="Go to home"
          >
            PNetAI
          </Link>

          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-full bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              aria-label="Set location"
            >
              <MapPin className="h-5 w-5 text-slate-600" />
            </button>

            <Link
              to="/cart"
              className="relative grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              aria-label="Go to cart"
            >
              <ShoppingCart className="h-5 w-5 text-slate-600" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-pink-500 px-1 text-[11px] font-semibold text-white">
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

