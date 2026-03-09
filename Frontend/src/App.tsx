import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, ProtectedRoute } from './components';
import { LandingPage, Login, Register, Dashboard, NotFound } from './pages';
import { ForgotPassword } from './pages/ForgotPassword';
import UserProfile from "./pages/UserProfile";
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { UserManagement } from './pages/Admin/UserManagement';


function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900">
        <Routes>
          {/* Public routes with Header */}
          <Route path="/" element={<><Header /><LandingPage /></>} />
          <Route path="/login" element={<><Header /><Login /></>} />
          <Route path="/register" element={<><Header /><Register /></>} />
          <Route path="/forgot-password" element={<><Header /><ForgotPassword /></>} />
          
          {/* Protected routes with Header */}
          <Route path="/profile" element={<><Header /><UserProfile /></>} />
          <Route
            path="/dashboard"
            element={
              <>
                <Header />
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </>
            }
          />
          
          {/* Admin routes with AdminLayout (no Header) */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <UserManagement />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<><Header /><NotFound /></>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
