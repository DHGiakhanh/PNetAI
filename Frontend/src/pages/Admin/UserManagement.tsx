import { useState, useEffect } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import toast from "react-hot-toast";
import apiClient from '../../utils/api.service';
import Pagination from "@/components/common/Pagination";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
  saleCode?: string;
  managedBy?: {
    name: string;
    email: string;
  };
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, [filter, search, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'all') params.role = filter;
      if (search) params.search = search;
      params.page = currentPage;
      params.limit = pageSize;

      const response = await apiClient.get('/admin/users', { params });
      setUsers(response.data.users || []);
      setTotalPages(response.data?.pagination?.pages || 1);
      setTotalUsers(response.data?.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiClient.delete(`/admin/users/${userId}`);
      toast.success("User deleted successfully.");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/admin/users/${userId}`, {
        isVerified: !currentStatus
      });
      toast.success("User status updated successfully.");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2.5 bg-brown hover:bg-brown-dark text-white font-semibold rounded-full shadow-md transition"
        >
          + Create Sale Account
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 mb-6 border border-sand shadow-lg">
        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'user', label: 'Users' },
              { value: 'sale', label: 'Sales' },
              { value: 'service_provider', label: 'Service Providers' },
              { value: 'shop', label: 'Shops (Legacy)' },
              { value: 'admin', label: 'Admins' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-xl capitalize font-medium transition ${
                  filter === f.value 
                    ? 'bg-brown text-white shadow-md' 
                    : 'bg-warm text-gray-700 hover:bg-warm'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 bg-warm/60 border border-sand rounded-xl focus:outline-none focus:ring-2 focus:ring-caramel text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-sand shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm/70">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Role</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Managed By</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Created</th>
                <th className="px-4 py-3 text-right text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-t border-sand hover:bg-warm/40 transition">
                    <td className="px-4 py-3 text-gray-800 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        user.role === 'service_provider' ? 'bg-amber-100 text-amber-700' :
                        user.role === 'shop' ? 'bg-amber-100 text-amber-700' :
                        user.role === 'sale' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role === 'service_provider' ? 'Service Provider' : user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVerify(user._id, user.isVerified)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          user.isVerified 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {user.managedBy ? user.managedBy.name : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-3 py-1.5 text-brown hover:bg-warm border border-sand hover:border-caramel rounded-lg text-sm font-medium transition flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="px-3 py-1.5 text-red-500 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg text-sm font-medium transition flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalUsers}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {showCreateModal && (
        <CreateSaleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
        />
      )}

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

const CreateSaleModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    saleCode: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/admin/users/sale', formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create sale account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full border border-sand shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Create Sale Account</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-warm/60 border border-sand rounded-xl focus:outline-none focus:ring-2 focus:ring-caramel text-gray-700 placeholder:text-gray-400"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-warm/60 border border-sand rounded-xl focus:outline-none focus:ring-2 focus:ring-caramel text-gray-700 placeholder:text-gray-400"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Sale Code *</label>
            <input
              type="text"
              value={formData.saleCode}
              onChange={(e) => setFormData({ ...formData, saleCode: e.target.value })}
              className="w-full px-4 py-2.5 bg-warm/60 border border-sand rounded-xl focus:outline-none focus:ring-2 focus:ring-caramel text-gray-700 placeholder:text-gray-400"
              placeholder="SALE001"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Unique code that customers will use to register under this sale
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 bg-warm/60 border border-sand rounded-xl focus:outline-none focus:ring-2 focus:ring-caramel text-gray-700 placeholder:text-gray-400"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-warm/60 border border-sand rounded-xl focus:outline-none focus:ring-2 focus:ring-caramel text-gray-700 placeholder:text-gray-400"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-warm/60 border border-sand rounded-xl focus:outline-none focus:ring-2 focus:ring-caramel text-gray-700 placeholder:text-gray-400"
              placeholder="123 Main St, City, Country"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-brown hover:bg-brown-dark disabled:bg-brown/60 text-white font-semibold rounded-full shadow-md transition"
            >
              {loading ? 'Creating...' : 'Create Sale Account'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-full transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserDetailModal = ({ user, onClose }: { user: User; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 max-w-lg w-full border border-sand shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-sand">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-caramel to-brown flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                user.role === 'admin' ? 'bg-red-100 text-red-700' :
                user.role === 'service_provider' ? 'bg-amber-100 text-amber-700' :
                user.role === 'shop' ? 'bg-amber-100 text-amber-700' :
                user.role === 'sale' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {user.role === 'service_provider' ? 'Service Provider' : user.role}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                user.isVerified 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {user.isVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>

            {user.phone && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <p className="text-gray-800">{user.phone}</p>
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Created At</label>
              <p className="text-gray-800">{new Date(user.createdAt).toLocaleString()}</p>
            </div>

            {/* Show Sale Code only for sale role */}
            {user.role === 'sale' && user.saleCode && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Sale Code</label>
                <p className="text-gray-800 font-mono bg-warm px-3 py-2 rounded-xl">{user.saleCode}</p>
              </div>
            )}

            {/* Show Managed By for regular users */}
            {user.role === 'user' && user.managedBy && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Managed By</label>
                <div className="bg-warm rounded-xl p-3">
                  <p className="text-gray-800 font-medium">{user.managedBy.name}</p>
                  <p className="text-gray-600 text-sm">{user.managedBy.email}</p>
                  {user.saleCode && (
                    <p className="text-gray-500 text-xs mt-1">Sale Code: <span className="font-mono">{user.saleCode}</span></p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-sand">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-brown hover:bg-brown-dark text-white font-semibold rounded-full shadow-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
