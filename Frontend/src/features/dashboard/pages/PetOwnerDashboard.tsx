import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  photo?: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  dateTime: string;
  status: string;
  service: {
    name: string;
    price: number;
  };
  partner: {
    name: string;
    partnerType: string;
    address: string;
  };
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
      price: number;
    };
    quantity: number;
  }>;
}

interface DashboardData {
  overview: {
    totalPets: number;
    upcomingAppointments: number;
    recentOrders: number;
    unreadNotifications: number;
  };
  pets: Pet[];
  upcomingAppointments: Appointment[];
  recentOrders: Order[];
  aiConsultations: any[];
  notifications: any[];
}

export default function PetOwnerDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/petowner', {
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
      <h1 className="text-3xl font-bold text-white mb-8">Pet Owner Dashboard</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">My Pets</h3>
          <p className="text-3xl font-bold text-white">{dashboardData.overview.totalPets}</p>
          <Link to="/pets" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
            Manage Pets →
          </Link>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Upcoming Appointments</h3>
          <p className="text-3xl font-bold text-white">{dashboardData.overview.upcomingAppointments}</p>
          <Link to="/booking" className="text-green-400 hover:text-green-300 mt-2 inline-block">
            Book Appointment →
          </Link>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">Recent Orders</h3>
          <p className="text-3xl font-bold text-white">{dashboardData.overview.recentOrders}</p>
          <Link to="/orders" className="text-purple-400 hover:text-purple-300 mt-2 inline-block">
            View Orders →
          </Link>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Notifications</h3>
          <p className="text-3xl font-bold text-white">{dashboardData.overview.unreadNotifications}</p>
          <Link to="/notifications" className="text-yellow-400 hover:text-yellow-300 mt-2 inline-block">
            View All →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Pets */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">My Pets</h2>
          {dashboardData.pets.length === 0 ? (
            <p className="text-gray-400 mb-4">No pets registered yet</p>
          ) : (
            <div className="space-y-3">
              {dashboardData.pets.slice(0, 3).map((pet) => (
                <div key={pet.id} className="flex items-center space-x-4 p-3 bg-gray-700 rounded">
                  {pet.photo && (
                    <img src={pet.photo} alt={pet.name} className="w-12 h-12 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="text-white font-medium">{pet.name}</p>
                    <p className="text-gray-400 text-sm">{pet.species} • {pet.breed}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/pets" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            View All Pets →
          </Link>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Upcoming Appointments</h2>
          {dashboardData.upcomingAppointments.length === 0 ? (
            <p className="text-gray-400 mb-4">No upcoming appointments</p>
          ) : (
            <div className="space-y-3">
              {dashboardData.upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="p-3 bg-gray-700 rounded">
                  <p className="text-white font-medium">{appointment.service.name}</p>
                  <p className="text-gray-400 text-sm">{appointment.partner.name}</p>
                  <p className="text-gray-400 text-sm">
                    {new Date(appointment.dateTime).toLocaleDateString()}
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    appointment.status === 'confirmed' ? 'bg-green-600 text-white' :
                    appointment.status === 'pending' ? 'bg-yellow-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link to="/booking" className="text-green-400 hover:text-green-300 mt-4 inline-block">
            Book New Appointment →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/pets/add" className="p-4 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">
            Add New Pet
          </Link>
          <Link to="/booking" className="p-4 bg-green-600 text-white rounded hover:bg-green-700 text-center">
            Book Service
          </Link>
          <Link to="/products" className="p-4 bg-purple-600 text-white rounded hover:bg-purple-700 text-center">
            Shop Products
          </Link>
          <Link to="/ai-consultation" className="p-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-center">
            AI Consultation
          </Link>
        </div>
      </div>
    </div>
  );
}
