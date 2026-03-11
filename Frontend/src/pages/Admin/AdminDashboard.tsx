import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, Package as PackageIcon, FileText } from 'lucide-react';
import apiClient from '../../services/api.service';

interface Statistics {
  users: {
    total: number;
    verified: number;
    unverified: number;
  };
  sales: number;
  admins: number;
  orders: number;
  products: number;
  blogs: number;
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
      const response = await apiClient.get('/admin/statistics');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          title="Total Orders"
          value={stats?.orders || 0}
          subtitle="All time"
          icon={PackageIcon}
          color="purple"
        />
        <StatCard
          title="Products"
          value={stats?.products || 0}
          subtitle="In catalog"
          icon={PackageIcon}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/admin/users"
          className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 hover:shadow-xl transition border border-pink-100 flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-pink-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">User Management</h3>
            <p className="text-gray-600 text-sm">
              Manage users, create sale accounts, and assign customers
            </p>
          </div>
        </Link>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-pink-100 flex items-start gap-4 opacity-50">
          <div className="w-12 h-12 rounded-xl bg-cyan-400 flex items-center justify-center flex-shrink-0">
            <PackageIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Product Management</h3>
            <p className="text-gray-600 text-sm">
              Coming soon...
            </p>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-pink-100 shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Recent Users</h2>
        <div className="space-y-3">
          {stats?.recentUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 bg-pink-50/50 rounded-xl hover:bg-pink-50 transition"
            >
              <div>
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin'
                      ? 'bg-red-100 text-red-700'
                      : user.role === 'sale'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
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
  const colorClasses = {
    pink: 'from-pink-400 to-pink-500',
    cyan: 'from-cyan-400 to-cyan-500',
    purple: 'from-purple-400 to-purple-500',
    orange: 'from-orange-400 to-orange-500',
  }[color];

  return (
    <div className={`bg-gradient-to-br ${colorClasses} rounded-2xl p-6 shadow-lg text-white`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white/90 text-sm font-medium">{title}</h3>
        <Icon className="w-6 h-6 text-white/90" />
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-white/70 text-xs">{subtitle}</p>
    </div>
  );
};
