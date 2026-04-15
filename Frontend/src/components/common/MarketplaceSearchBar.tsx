import { Search, X } from "lucide-react";

type MarketplaceSearchBarProps = {
  mode: "products" | "services";
  value: string;
  placeholder: string;
  loading: boolean;
  resultCount: number;
  activeCategoryLabel?: string;
  hasResults: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
};

const modeStyles = {
  products: {
    shell:
      "border-sand/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(251,244,236,0.92))] shadow-[0_28px_90px_rgba(92,63,40,0.1)]",
    badge: "bg-brown/[0.08] text-brown ring-1 ring-brown/10 shadow-sm",
    input:
      "border-sand/70 bg-[linear-gradient(180deg,rgba(255,251,247,0.95),rgba(246,235,222,0.9))] text-ink placeholder:text-muted focus-within:border-caramel focus-within:ring-caramel/25",
    icon: "text-brown",
    clear:
      "border-sand/80 bg-white/90 text-muted hover:border-caramel hover:text-brown hover:shadow-sm",
    meta: "text-brown",
    support: "text-brown/80",
    glow: "from-caramel/20 via-transparent to-transparent",
    dot: "bg-caramel",
  },
  services: {
    shell:
      "border-emerald-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(240,249,255,0.95))] shadow-[0_28px_90px_rgba(14,116,144,0.12)]",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-100 shadow-sm",
    input:
      "border-sky-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(240,249,255,0.95))] text-slate-900 placeholder:text-slate-400 focus-within:border-sky-400 focus-within:ring-sky-200/70",
    icon: "text-sky-600",
    clear:
      "border-slate-200 bg-white/95 text-slate-500 hover:border-sky-300 hover:text-sky-700 hover:shadow-sm",
    meta: "text-sky-700",
    support: "text-slate-500",
    glow: "from-sky-200/50 via-transparent to-transparent",
    dot: "bg-sky-500",
  },
} as const;

export function MarketplaceSearchBar({
  mode,
  value,
  placeholder,
  loading,
  resultCount,
  activeCategoryLabel,
  hasResults,
  onChange,
  onClear,
}: MarketplaceSearchBarProps) {
  const styles = modeStyles[mode];
  const label = mode === "products" ? "Product search" : "Service search";
  const resultNoun = mode === "products" ? "results" : "services";
  const searchingCopy =
    mode === "products"
      ? "Searching product catalog..."
      : "Searching service availability...";

  return (
    <section
      className={`relative overflow-hidden rounded-[28px] border p-4 sm:p-5 ${styles.shell}`}
      aria-label={label}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${styles.glow}`}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${styles.badge}`}
          >
            {label}
          </span>
          {activeCategoryLabel ? (
            <span className="inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-black/5">
              In {activeCategoryLabel}
            </span>
          ) : null}
        </div>

        <div className={`flex items-center gap-2 text-sm font-semibold ${styles.meta}`}>
          {loading ? (
            <span className={`h-2 w-2 rounded-full animate-pulse ${styles.dot}`} />
          ) : null}
          {loading
            ? searchingCopy
            : hasResults
              ? `${resultCount} ${resultNoun} found`
              : `0 ${resultNoun} found`}
        </div>
      </div>

      <div
        className={`relative mt-4 flex min-h-16 items-center gap-3 rounded-[24px] border px-4 py-3 transition duration-300 focus-within:-translate-y-[1px] focus-within:ring-4 sm:px-5 ${styles.input}`}
      >
        <div className="grid h-11 w-11 place-items-center rounded-full bg-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
          <Search className={`h-5 w-5 ${styles.icon}`} />
        </div>

        <div className="min-w-0 flex-1">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="w-full border-0 bg-transparent p-0 text-sm font-semibold outline-none sm:text-[15px]"
          />
        </div>

        {value ? (
          <button
            type="button"
            onClick={onClear}
            className={`inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-bold uppercase tracking-[0.14em] transition ${styles.clear}`}
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        ) : null}
      </div>
    </section>
  );
}
