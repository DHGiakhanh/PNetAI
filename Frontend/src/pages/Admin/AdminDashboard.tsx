import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Shapes, ShoppingBag, Users } from "lucide-react";
import apiClient from "@/utils/api.service";

type Statistics = {
  users: { total: number; verified: number; unverified: number };
  sales: number;
  admins: number;
  orders: number;
  products: number;
  blogs: number;
};

const cards = [
  { key: "users", label: "Users", icon: Users },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "products", label: "Products", icon: Package },
  { key: "sales", label: "Sale Team", icon: Users },
] as const;

export const AdminDashboard = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await apiClient.get("/admin/statistics");
        setStats(response.data);
      } finally {
        setLoading(false);
      }
    };
    fetchStatistics();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm via-cream to-warm p-6">
      <div className="mb-6">
        <h1 className="font-serif text-4xl font-bold italic text-ink">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Overview of users, orders, products and catalog setup.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = loading ? "..." : Number((stats as any)?.[card.key] || 0);
          return (
            <div key={card.key} className="rounded-2xl border border-sand bg-white/90 p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-muted">{card.label}</p>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-warm ring-1 ring-sand">
                  <Icon className="h-4 w-4 text-brown" />
                </span>
              </div>
              <p className="text-3xl font-bold text-ink">{value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/users"
          className="rounded-2xl border border-sand bg-white/90 p-5 shadow-sm transition hover:bg-warm/50"
        >
          <Users className="mb-3 h-5 w-5 text-brown" />
          <p className="text-lg font-semibold text-ink">User Management</p>
          <p className="mt-1 text-sm text-muted">Manage admins, sales and customers.</p>
        </Link>

        <Link
          to="/admin/products"
          className="rounded-2xl border border-sand bg-white/90 p-5 shadow-sm transition hover:bg-warm/50"
        >
          <Package className="mb-3 h-5 w-5 text-brown" />
          <p className="text-lg font-semibold text-ink">Product Management</p>
          <p className="mt-1 text-sm text-muted">Create, update and remove products.</p>
        </Link>

        <Link
          to="/admin/categories"
          className="rounded-2xl border border-sand bg-white/90 p-5 shadow-sm transition hover:bg-warm/50"
        >
          <Shapes className="mb-3 h-5 w-5 text-brown" />
          <p className="text-lg font-semibold text-ink">Category Management</p>
          <p className="mt-1 text-sm text-muted">Maintain store category structure.</p>
        </Link>
      </div>
    </div>
  );
};

