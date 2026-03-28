import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ClientDashboard from './pages/ClientDashboard';
import ClientRooms from './pages/ClientRooms';
import ClientBooking from './pages/ClientBooking';
import ClientBookings from './pages/ClientBookings';
import AdminDashboard from './pages/admin/AdminDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<VerifyEmail />} />
        
        {/* Client Routes */}
        <Route 
          path="/client/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <ClientDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/client/rooms" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <ClientRooms />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/client/book" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <ClientBooking />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/client/bookings" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <ClientBookings />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;