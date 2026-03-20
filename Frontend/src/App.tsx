import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, ProtectedRoute } from './components';
import { ForgotPassword } from './features/auth/pages/ForgotPassword';
import { Login, Register, LandingPage, NotFound } from "./routes";
import { AdminLayout } from './layout/AdminLayout';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';
import { UserManagement } from './features/admin/pages/UserManagement';
import UserProfile from './features/profile/pages/UserProfile';


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
          {/* <Route
            path="/dashboard"
            element={
              <>
                <Header />
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </>
            }
          /> */}
          
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
