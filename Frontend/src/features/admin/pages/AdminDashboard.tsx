import { useEffect, useState } from "react";
import { Users, Briefcase, Package, ShoppingBag } from "lucide-react";
import apiClient from "../../../utils/api.service";
import { StatCard } from "../components/StatCard";

interface Statistics {
  users: {
    total: number;
    verified: number;
    unverified: number;
  };
  sales: number;
  orders: number;
  products: number;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const res = await apiClient.get("/admin/statistics");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-cyan-50 p-8">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Dashboard Overview
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

          <StatCard
            title="Users"
            value={stats?.users.total || 0}
            subtitle={`${stats?.users.verified} verified`}
            icon={Users}
            color="pink"
          />

          <StatCard
            title="Sales"
            value={stats?.sales || 0}
            subtitle="Active"
            icon={Briefcase}
            color="cyan"
          />

          <StatCard
            title="Orders"
            value={stats?.orders || 0}
            subtitle="All time"
            icon={Package}
            color="purple"
          />

          <StatCard
            title="Products"
            value={stats?.products || 0}
            subtitle="Catalog"
            icon={ShoppingBag}
            color="orange"
          />

        </div>

        {/* Recent Users */}
        <div className="bg-white/60 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-lg">

          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Recent Users
          </h2>

          <div className="space-y-3">

            {stats?.recentUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-pink-50/40 transition"
              >

                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-cyan-400 flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0)}
                  </div>

                  <div>
                    <p className="font-medium text-gray-800">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>

                </div>

                <div className="text-right">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-red-100 text-red-700"
                        : user.role === "sale"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {user.role}
                  </span>

                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>

                </div>

              </div>
            ))}

          </div>

        </div>

      </div>
    </div>
  );
};