import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Appointment {
  id: string;
  dateTime: string;
  status: string;
  user: {
    name: string;
    email: string;
  };
  service: {
    name: string;
    price: number;
  };
}

interface DashboardData {
  partner: {
    name: string;
    email: string;
    partnerType: string;
    isVerified: boolean;
  };
  todayAppointments: Appointment[];
  pendingAppointments: Appointment[];
  recentOrders: any[];
  services: Service[];
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    totalServices: number;
    totalOrders: number;
  };
}

export default function PartnerDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/serviceprovider', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-white">
        <p>Failed to load dashboard data</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          {dashboardData.partner.name} Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            dashboardData.partner.isVerified 
              ? 'bg-green-600 text-white' 
              : 'bg-yellow-600 text-white'
          }`}>
            {dashboardData.partner.isVerified ? 'Verified' : 'Pending Verification'}
          </span>
          <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm capitalize">
            {dashboardData.partner.partnerType}
          </span>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Total Appointments</h3>
          <p className="text-3xl font-bold text-white">{dashboardData.stats.totalAppointments}</p>
          <p className="text-gray-400 text-sm mt-2">
            {dashboardData.stats.completedAppointments} completed
          </p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Today's Schedule</h3>
          <p className="text-3xl font-bold text-white">{dashboardData.todayAppointments.length}</p>
          <p className="text-gray-400 text-sm mt-2">
            {dashboardData.pendingAppointments.length} pending
          </p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">Services Offered</h3>
          <p className="text-3xl font-bold text-white">{dashboardData.stats.totalServices}</p>
          <Link to="/partner/services" className="text-purple-400 hover:text-purple-300 mt-2 inline-block">
            Manage Services →
          </Link>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-white">{dashboardData.stats.totalOrders}</p>
          <Link to="/partner/orders" className="text-yellow-400 hover:text-yellow-300 mt-2 inline-block">
            View Orders →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Appointments */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Today's Appointments</h2>
          {dashboardData.todayAppointments.length === 0 ? (
            <p className="text-gray-400 mb-4">No appointments scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {dashboardData.todayAppointments.map((appointment) => (
                <div key={appointment.id} className="p-3 bg-gray-700 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{appointment.service.name}</p>
                      <p className="text-gray-400 text-sm">{appointment.user.name}</p>
                      <p className="text-gray-400 text-sm">{appointment.user.email}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(appointment.dateTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      appointment.status === 'confirmed' ? 'bg-green-600 text-white' :
                      appointment.status === 'pending' ? 'bg-yellow-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/partner/appointments" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            View All Appointments →
          </Link>
        </div>

        {/* Pending Appointments */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Pending Confirmation</h2>
          {dashboardData.pendingAppointments.length === 0 ? (
            <p className="text-gray-400 mb-4">No pending appointments</p>
          ) : (
            <div className="space-y-3">
              {dashboardData.pendingAppointments.map((appointment) => (
                <div key={appointment.id} className="p-3 bg-gray-700 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{appointment.service.name}</p>
                      <p className="text-gray-400 text-sm">{appointment.user.name}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(appointment.dateTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                        Confirm
                      </button>
                      <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/partner/services/add" className="p-4 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">
            Add Service
          </Link>
          <Link to="/partner/schedule" className="p-4 bg-green-600 text-white rounded hover:bg-green-700 text-center">
            Manage Schedule
          </Link>
          <Link to="/partner/orders" className="p-4 bg-purple-600 text-white rounded hover:bg-purple-700 text-center">
            View Orders
          </Link>
          <Link to="/partner/profile" className="p-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-center">
            Business Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
