import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Customer {
  id: string;
  name: string;
  email: string;
  customerCode: string;
  createdAt: string;
}

interface Lead {
  id: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  partnerType: string;
  stage: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  createdBy: {
    name: string;
    email: string;
    customerCode: string;
  };
  updatedAt: string;
}

interface DashboardData {
  salesProfile: {
    name: string;
    email: string;
    saleCode: string;
  };
  customers: Customer[];
  leads: Lead[];
  tickets: SupportTicket[];
  stats: {
    totalCustomers: number;
    totalLeads: number;
    openTickets: number;
    newCustomersThisMonth: number;
  };
}

export default function SalesDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/sales', {
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
        <h1 className="text-3xl font-bold text-white">Sales Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
            Sales Code: {dashboardData.salesProfile.saleCode}
          </span>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Total Customers</h3>
          <p className="text-3xl font-bold text-white">{dashboardData.stats.totalCustomers}</p>
          <p className="text-gray-400 text-sm mt-2">
            +{dashboardData.stats.newCustomersThisMonth} this month
          </p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Active Leads</h3>
          <p className="text-3xl font-bold text-white">{dashboardData.stats.totalLeads}</p>
          <Link to="/sales/leads" className="text-green-400 hover:text-green-300 mt-2 inline-block">
            Manage Leads →
          </Link>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">Open Tickets</h3>
          <p className="text-3xl font-bold text-white">{dashboardData.stats.openTickets}</p>
          <Link to="/sales/tickets" className="text-purple-400 hover:text-purple-300 mt-2 inline-block">
            View Tickets →
          </Link>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold text-white">
            {dashboardData.stats.totalCustomers > 0 
              ? Math.round((dashboardData.stats.totalCustomers / (dashboardData.stats.totalLeads + dashboardData.stats.totalCustomers)) * 100)
              : 0}%
          </p>
          <p className="text-gray-400 text-sm mt-2">Customer acquisition</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Customers */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Customers</h2>
          {dashboardData.customers.length === 0 ? (
            <p className="text-gray-400 mb-4">No customers yet</p>
          ) : (
            <div className="space-y-3">
              {dashboardData.customers.slice(0, 5).map((customer) => (
                <div key={customer.id} className="p-3 bg-gray-700 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{customer.name}</p>
                      <p className="text-gray-400 text-sm">{customer.email}</p>
                      <p className="text-gray-400 text-sm">Code: {customer.customerCode}</p>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/sales/customers" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            View All Customers →
          </Link>
        </div>

        {/* Recent Leads */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Leads</h2>
          {dashboardData.leads.length === 0 ? (
            <p className="text-gray-400 mb-4">No leads yet</p>
          ) : (
            <div className="space-y-3">
              {dashboardData.leads.slice(0, 5).map((lead) => (
                <div key={lead.id} className="p-3 bg-gray-700 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{lead.businessName}</p>
                      <p className="text-gray-400 text-sm">{lead.contactName}</p>
                      <p className="text-gray-400 text-sm">{lead.contactEmail}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded ${
                        lead.stage === 'new' ? 'bg-blue-600 text-white' :
                        lead.stage === 'contacted' ? 'bg-yellow-600 text-white' :
                        lead.stage === 'qualified' ? 'bg-green-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {lead.stage}
                      </span>
                      <p className="text-gray-400 text-sm mt-1">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/sales/leads" className="text-green-400 hover:text-green-300 mt-4 inline-block">
            Manage All Leads →
          </Link>
        </div>
      </div>

      {/* Support Tickets */}
      <div className="mt-8 bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Support Tickets</h2>
        {dashboardData.tickets.length === 0 ? (
          <p className="text-gray-400 mb-4">No support tickets assigned</p>
        ) : (
          <div className="space-y-3">
            {dashboardData.tickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="p-3 bg-gray-700 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">{ticket.subject}</p>
                    <p className="text-gray-400 text-sm">{ticket.createdBy.name}</p>
                    <p className="text-gray-400 text-sm">Code: {ticket.createdBy.customerCode}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded ${
                      ticket.status === 'open' ? 'bg-red-600 text-white' :
                      ticket.status === 'in_progress' ? 'bg-yellow-600 text-white' :
                      ticket.status === 'resolved' ? 'bg-green-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {ticket.status}
                    </span>
                    <p className="text-gray-400 text-sm mt-1">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link to="/sales/tickets" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
          View All Tickets →
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/sales/leads/add" className="p-4 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">
            Add Lead
          </Link>
          <Link to="/sales/customers/add" className="p-4 bg-green-600 text-white rounded hover:bg-green-700 text-center">
            Register Customer
          </Link>
          <Link to="/sales/tickets" className="p-4 bg-purple-600 text-white rounded hover:bg-purple-700 text-center">
            Support Tickets
          </Link>
          <Link to="/sales/reports" className="p-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-center">
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
