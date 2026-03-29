import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import LandingPage from './pages/LandingPage';
import ClientDashboard from './pages/ClientDashboard';
import ClientRooms from './pages/ClientRooms';
import ClientBooking from './pages/ClientBooking';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientBookings from "./pages/ClientBookings";
import ClientBookRoom from "./pages/ClientBookRoom";
import BookinnChatbot from "../components/BookinnChatbot";
import StaffDashboard from './pages/StaffDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" />;
  
  return (
    <>
      {children}
      <BookinnChatbot />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            style: {
              background: '#4A7C72',
              color: '#fff',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#B45C5C',
              color: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
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
        
        {/* Staff Routes */}
        <Route 
          path="/staff/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;