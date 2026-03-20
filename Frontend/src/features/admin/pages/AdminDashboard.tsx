import { useState, useEffect } from "react";
import { Users, Briefcase, Package, ShoppingBag } from "lucide-react";
import apiClient from "../../auth/services/api.service";

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
      const response = await apiClient.get("/admin/statistics");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-cyan-50 p-8">

      <div className="max-w-7xl mx-auto">

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Admin Dashboard
        </h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

          <StatCard
            title="Total Users"
            value={stats?.users.total || 0}
            subtitle={`${stats?.users.verified || 0} verified`}
            icon={Users}
            color="pink"
          />

          <StatCard
            title="Sales Team"
            value={stats?.sales || 0}
            subtitle="Active sales"
            icon={Briefcase}
            color="cyan"
          />

          <StatCard
            title="Orders"
            value={stats?.orders || 0}
            subtitle="All orders"
            icon={Package}
            color="purple"
          />

          <StatCard
            title="Products"
            value={stats?.products || 0}
            subtitle="In catalog"
            icon={ShoppingBag}
            color="orange"
          />

        </div>

        {/* Recent Users */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-pink-100 shadow-lg">

          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Users
          </h2>

          <div className="space-y-3">

            {stats?.recentUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-pink-50/40 transition"
              >

                {/* User info */}
                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-cyan-400 flex items-center justify-center text-white text-sm font-semibold">
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

                {/* Role */}
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





const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: any;
  color: string;
}) => {

  const colors: any = {
    pink: "bg-pink-100 text-pink-500",
    cyan: "bg-cyan-100 text-cyan-500",
    purple: "bg-purple-100 text-purple-500",
    orange: "bg-orange-100 text-orange-500",
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-pink-100 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

      <div className="flex items-center justify-between mb-2">

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}
        >
          <Icon className="w-5 h-5" />
        </div>

      </div>

      <p className="text-gray-500 text-sm">{title}</p>

      <p className="text-2xl font-bold text-gray-800 mt-1">
        {value}
      </p>

      <p className="text-xs text-gray-400 mt-1">
        {subtitle}
      </p>

    </div>
  );
};