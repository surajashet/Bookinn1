import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./assets/client.css"; 

import ClientLayout from "./layouts/ClientLayout";
import ClientDashboard from "./pages/ClientDashboard";
import ClientRoom from "./pages/ClientRoom";
import ClientBookings from "./pages/ClientBookings";
import ClientPayment from "./pages/ClientPayment";
import ClientInvoice from "./pages/ClientInvoice";
import ClientServices from "./pages/ClientServices";
import Login from "./pages/Login"; // Ensure these files exist
import Signup from "./pages/Signup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Client App Routes */}
        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="rooms" element={<ClientRoom />} />
          <Route path="bookings" element={<ClientBookings />} />
          <Route path="payments" element={<ClientPayment />} />
          <Route path="invoices" element={<ClientInvoice />} />
          <Route path="services" element={<ClientServices />} />
        </Route>

        {/* Global Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;