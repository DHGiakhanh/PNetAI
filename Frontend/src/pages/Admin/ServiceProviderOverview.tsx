import { useEffect, useState } from "react";
import { Boxes, Scissors, Users } from "lucide-react";
import apiClient from "@/utils/api.service";

type Card = {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
};

export const ServiceProviderOverview = () => {
  const [cards, setCards] = useState<Card[]>([
    { label: "Shop Products", value: 0, icon: Boxes },
    { label: "Shop Services", value: 0, icon: Scissors },
    { label: "Customers Booking", value: 0, icon: Users },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const [productsRes, servicesRes, customersRes] = await Promise.all([
          apiClient.get("/admin/products"),
          apiClient.get("/admin/services"),
          apiClient.get("/admin/customers-bookings"),
        ]);

        setCards([
          { label: "Shop Products", value: productsRes.data?.products?.length || 0, icon: Boxes },
          { label: "Shop Services", value: servicesRes.data?.services?.length || 0, icon: Scissors },
          { label: "Customers Booking", value: customersRes.data?.customers?.length || 0, icon: Users },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm via-cream to-warm p-6">
      <div className="mb-6">
        <h1 className="font-serif text-4xl font-bold italic text-ink">Service Provider Overview</h1>
        <p className="mt-2 text-sm text-muted">Quick summary of your catalog and customer bookings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-2xl border border-sand bg-white/90 p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-muted">{card.label}</p>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-warm ring-1 ring-sand">
                  <Icon className="h-5 w-5 text-brown" />
                </span>
              </div>
              <p className="text-3xl font-bold text-ink">{loading ? "..." : card.value}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
};
