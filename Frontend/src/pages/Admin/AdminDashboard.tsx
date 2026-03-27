import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, Package as PackageIcon, Bot } from 'lucide-react';
import apiClient from '@/utils/api.service';

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-cyan-100 p-8">

      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Pet Admin Dashboard 🐾
      </h1>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">

        <StatCard
          title="Total Users"
          value={stats?.users.total || 0}
          subtitle={`${stats?.users.verified ?? 0} verified`}
          icon={Users}
          color="pink"
        />

        <StatCard
          title="Sale Team"
          value={stats?.sales || 0}
          subtitle="Active sales"
          icon={Briefcase}
          color="orange"
        />

        <StatCard
          title="Admins"
          value={stats?.admins || 0}
          subtitle="System admins"
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
          color="pink"
        />

      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* QUICK ACTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <Link
              to="/admin/users"
              className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 hover:shadow-xl transition border border-pink-100 flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">User Management</h3>
                <p className="text-sm text-gray-500">
                  Manage pet owners
                </p>
              </div>
            </Link>

            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-pink-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-400 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Partner System</h3>
                <p className="text-sm text-gray-500">
                  Vet & Pet shop management
                </p>
              </div>
            </div>

          </div>


          {/* PENDING PARTNERS */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-pink-100 shadow-lg">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                Pending Partner Approvals
              </h2>

              <button className="text-sm text-blue-500 hover:underline">
                View All
              </button>
            </div>

            {/* TABLE HEADER */}
            <div className="hidden md:grid grid-cols-12 text-xs text-gray-400 mb-2 px-2">
              <span className="col-span-4">NAME</span>
              <span className="col-span-2">CATEGORY</span>
              <span className="col-span-2">DATE</span>
              <span className="col-span-2">STATUS</span>
              <span className="col-span-2 text-right">ACTION</span>
            </div>

            {/* ROWS */}
            <div className="space-y-2">

              {pendingPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="p-4 rounded-xl hover:bg-pink-50/40 transition border border-transparent hover:border-pink-100"
                >

                  {/* MOBILE VIEW */}
                  <div className="md:hidden space-y-2">

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-cyan-400 flex items-center justify-center text-white font-semibold">
                        {partner.name.charAt(0)}
                      </div>

                      <div>
                        <p className="font-medium text-gray-800">
                          {partner.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {partner.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">

                      <span className="text-gray-400">
                        {new Date(partner.date).toLocaleDateString()}
                      </span>

                      <span
                        className={`px-2 py-1 rounded-full text-xs ${partner.status === "urgent"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {partner.status}
                      </span>

                    </div>

                    <button className="w-full bg-blue-100 text-blue-600 py-2 rounded-lg text-sm">
                      Review
                    </button>

                  </div>

                  {/* DESKTOP VIEW */}
                  <div className="hidden md:grid grid-cols-12 items-center">

                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-cyan-400 flex items-center justify-center text-white font-semibold">
                        {partner.name.charAt(0)}
                      </div>

                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {partner.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          ID: {partner.id}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2 text-sm text-gray-600">
                      {partner.category}
                    </div>

                    <div className="col-span-2 text-sm text-gray-400">
                      {new Date(partner.date).toLocaleDateString()}
                    </div>

                    <div className="col-span-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${partner.status === "urgent"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {partner.status}
                      </span>
                    </div>

                    <div className="col-span-2 text-right">
                      <button className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition">
                        Review
                      </button>
                    </div>

                  </div>
                </div>
              ))}

            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          {/* AI ACTIVITY */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-pink-100 shadow-lg space-y-5">

            {/* HEADER */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-800">
                AI Assistant
              </span>
            </div>

            {/* AI STAT */}
            <div className="flex items-center justify-between bg-purple-50 rounded-xl p-4">

              <div>
                <p className="text-sm text-gray-500">Total Queries</p>
                <p className="text-xl font-bold text-gray-800">
                  {stats?.blogs ?? 0}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-500" />
              </div>

            </div>

            {/* ACTIVITY */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Recent Questions
              </p>

              <div className="space-y-3 text-sm">

                <ActivityItem text="User asked about dog diet" />
                <ActivityItem text="Cat vaccination advice" />
                <ActivityItem text="Pet grooming tips" />

              </div>
            </div>

          </div>

          {/* SYSTEM STATUS */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-pink-100 shadow-lg">

            <h2 className="font-semibold mb-4">
              System Status
            </h2>

            <p className="text-green-500 text-sm">
              🟢 System running normally
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};



const ActivityItem = ({ text }: any) => (
  <div className="flex items-center gap-3">
    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
    <p className="text-gray-700">{text}</p>
  </div>
);

const pendingPartners = [
  {
    id: "1",
    name: "Happy Paws Clinic",
    category: "Veterinary",
    date: "2023-10-24",
    status: "pending",
  },
  {
    id: "2",
    name: "Whiskers Grooming",
    category: "Grooming",
    date: "2023-10-23",
    status: "urgent",
  },
  {
    id: "3",
    name: "PetStay Hotel",
    category: "Boarding",
    date: "2023-10-22",
    status: "pending",
  },
];


const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => {

  const colors: any = {
    pink: "bg-pink-100 text-pink-500",
    cyan: "bg-cyan-100 text-cyan-500",
    purple: "bg-purple-100 text-purple-500",
    orange: "bg-orange-100 text-orange-500",
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-pink-100 rounded-2xl p-5 shadow-md hover:shadow-xl transition">

      <div className="flex justify-between mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs text-green-500">{subtitle}</span>
      </div>

      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>

    </div>
  );
};

