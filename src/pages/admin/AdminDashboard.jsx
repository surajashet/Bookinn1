import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler
);

const BASE_URL = "http://localhost:3001";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomSearch, setRoomSearch] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [roomForm, setRoomForm] = useState({
    room_number: "",
    room_type: "",
    floor_number: "",
    capacity: "",
    base_price: "",
    description: "",
    image_url: ""
  });
  const [config, setConfig] = useState({
    taxRate: 18,
    cancellationPolicy: "24 hours before check-in for full refund",
    earlyCheckIn: "12:00 PM",
    lateCheckOut: "2:00 PM"
  });
  const [loading, setLoading] = useState({
    users: true,
    rooms: true,
    bookings: true,
    tasks: true
  });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(userData);
    
    fetchUsers();
    fetchRooms();
    fetchBookings();
    fetchTasks();
    fetchConfigurations();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(prev => ({ ...prev, rooms: false }));
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }));
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      } else if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  const fetchConfigurations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setConfig({
          taxRate: data.data.taxRate || 18,
          cancellationPolicy: data.data.cancellationPolicy || "24 hours before check-in for full refund",
          earlyCheckIn: data.data.earlyCheckIn || "12:00 PM",
          lateCheckOut: data.data.lateCheckOut || "2:00 PM"
        });
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
    }
  };

  const saveConfigurations = async () => {
    setSavingConfig(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/config/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          configurations: {
            taxRate: config.taxRate,
            cancellationPolicy: config.cancellationPolicy,
            earlyCheckIn: config.earlyCheckIn,
            lateCheckOut: config.lateCheckOut
          }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success("Configuration saved successfully!");
      } else {
        toast.error(data.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving configurations:", error);
      toast.error("Error saving configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`User role updated to ${newRole}`);
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Error updating role");
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const token = localStorage.getItem("token");
      const url = editingRoom 
        ? `${BASE_URL}/api/rooms/${editingRoom.room_id}`
        : `${BASE_URL}/api/rooms`;
      const method = editingRoom ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...roomForm,
          floor_number: parseInt(roomForm.floor_number),
          capacity: parseInt(roomForm.capacity),
          base_price: parseInt(roomForm.base_price)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const roomId = data.data.room_id || editingRoom?.room_id;
        
        if (imageFile) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64String = reader.result;
            
            const uploadResponse = await fetch(`${BASE_URL}/api/upload/room-image`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                file: base64String,
                room_id: roomId
              })
            });
            
            const uploadData = await uploadResponse.json();
            if (uploadData.success) {
              toast.success(editingRoom ? "Room updated with image!" : "Room created with image!");
            } else {
              toast.error("Room saved but image upload failed");
            }
            setUploading(false);
          };
          reader.readAsDataURL(imageFile);
        } else {
          toast.success(editingRoom ? "Room updated successfully!" : "Room created successfully!");
          setUploading(false);
        }
        
        setShowRoomModal(false);
        setEditingRoom(null);
        setImageFile(null);
        setRoomForm({
          room_number: "",
          room_type: "",
          floor_number: "",
          capacity: "",
          base_price: "",
          description: "",
          image_url: ""
        });
        fetchRooms();
      } else {
        toast.error(data.error || "Failed to save room");
        setUploading(false);
      }
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error("Error saving room: " + error.message);
      setUploading(false);
    }
  };

  const deleteRoom = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room? This cannot be undone.")) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success("Room deleted successfully!");
        fetchRooms();
      } else {
        toast.error(data.error || "Failed to delete room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Error deleting room");
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = roomSearch === "" || 
      room.room_number.toString().includes(roomSearch) ||
      room.room_type.toLowerCase().includes(roomSearch.toLowerCase());
    return matchesSearch;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tempPassword");
    toast.success("Logged out successfully!");
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  };

  // Calculate statistics for charts
  const roomTypes = rooms.reduce((acc, room) => {
    acc[room.room_type] = (acc[room.room_type] || 0) + 1;
    return acc;
  }, {});

  const bookingStatus = bookings.reduce((acc, booking) => {
    acc[booking.booking_status] = (acc[booking.booking_status] || 0) + 1;
    return acc;
  }, {});

  const taskStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  // Monthly bookings data (last 6 months)
  const getMonthlyBookings = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = new Array(6).fill(0);
    const now = new Date();
    
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.check_in_date);
      const monthDiff = (now.getFullYear() - bookingDate.getFullYear()) * 12 + (now.getMonth() - bookingDate.getMonth());
      if (monthDiff >= 0 && monthDiff < 6) {
        monthlyData[5 - monthDiff - 1] += 1;
      }
    });
    
    return {
      labels: months.slice(now.getMonth() - 5, now.getMonth() + 1),
      data: monthlyData
    };
  };

  const monthlyBookings = getMonthlyBookings();

  // Chart configurations
  const roomTypeChartData = {
    labels: Object.keys(roomTypes),
    datasets: [{
      data: Object.values(roomTypes),
      backgroundColor: ['#4A7C72', '#6A9E94', '#8BB8AE', '#A8CEC8', '#C4E0DA'],
      borderWidth: 0,
    }]
  };

  const bookingStatusChartData = {
    labels: Object.keys(bookingStatus).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [{
      data: Object.values(bookingStatus),
      backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'],
      borderWidth: 0,
    }]
  };

  const taskStatusChartData = {
    labels: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    datasets: [{
      data: [
        taskStatus.pending || 0,
        taskStatus.in_progress || 0,
        taskStatus.completed || 0,
        taskStatus.cancelled || 0
      ],
      backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#EF4444'],
      borderWidth: 0,
    }]
  };

  const monthlyBookingsChartData = {
    labels: monthlyBookings.labels,
    datasets: [{
      label: 'Bookings',
      data: monthlyBookings.data,
      backgroundColor: '#4A7C72',
      borderRadius: 8,
    }]
  };

  const revenueChartData = {
    labels: monthlyBookings.labels,
    datasets: [{
      label: 'Revenue (₹)',
      data: monthlyBookings.data.map(count => count * 5000), // Approximate revenue calculation
      borderColor: '#4A7C72',
      backgroundColor: 'rgba(74, 124, 114, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  const tabStyle = (tabName) => ({
    padding: "12px 24px",
    background: activeTab === tabName ? "#4A7C72" : "transparent",
    color: activeTab === tabName ? "white" : "#6B6560",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: activeTab === tabName ? "600" : "400",
    borderRadius: "8px",
    transition: "all 0.3s"
  });

  const getTaskStatusStyle = (status) => {
    const styles = {
      pending: { bg: "#FEF3C7", color: "#D97706", label: "Pending" },
      in_progress: { bg: "#DBEAFE", color: "#2563EB", label: "In Progress" },
      completed: { bg: "#D1FAE5", color: "#059669", label: "Completed" },
      cancelled: { bg: "#FEE2E2", color: "#DC2626", label: "Cancelled" }
    };
    return styles[status] || styles.pending;
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      high: { bg: "#FEE2E2", color: "#DC2626", label: "High" },
      normal: { bg: "#E0E7FF", color: "#4338CA", label: "Normal" },
      low: { bg: "#D1FAE5", color: "#059669", label: "Low" }
    };
    return styles[priority] || styles.normal;
  };

  if (loading.users && loading.rooms && loading.bookings) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading Admin Dashboard...</div>;
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
      <Toaster position="top-center" />
      
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <div>
          <h1 style={{ fontFamily: "'Soria', serif", fontSize: "32px", color: "#1E1C1A", marginBottom: "8px" }}>
            Admin Dashboard
          </h1>
          <p style={{ color: "#6B6560" }}>
            Welcome back, {currentUser?.username}!
          </p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            background: "#4A7C72",
            color: "white",
            border: "none",
            padding: "10px 24px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "20px",
        marginBottom: "40px"
      }}>
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E4DDD4", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4A7C72" }}>{users.length}</div>
          <div style={{ color: "#6B6560", marginTop: "8px" }}>Total Users</div>
        </div>
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E4DDD4", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4A7C72" }}>{rooms.length}</div>
          <div style={{ color: "#6B6560", marginTop: "8px" }}>Total Rooms</div>
        </div>
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E4DDD4", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4A7C72" }}>{bookings.length}</div>
          <div style={{ color: "#6B6560", marginTop: "8px" }}>Total Bookings</div>
        </div>
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E4DDD4", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4A7C72" }}>{tasks.length}</div>
          <div style={{ color: "#6B6560", marginTop: "8px" }}>Total Tasks</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        borderBottom: "1px solid #E4DDD4", 
        marginBottom: "30px",
        flexWrap: "wrap"
      }}>
        <button style={tabStyle("overview")} onClick={() => setActiveTab("overview")}>Overview</button>
        <button style={tabStyle("users")} onClick={() => setActiveTab("users")}>Users</button>
        <button style={tabStyle("rooms")} onClick={() => setActiveTab("rooms")}>Rooms</button>
        <button style={tabStyle("bookings")} onClick={() => setActiveTab("bookings")}>Bookings</button>
        <button style={tabStyle("tasks")} onClick={() => setActiveTab("tasks")}>Tasks</button>
        <button style={tabStyle("config")} onClick={() => setActiveTab("config")}>Configuration</button>
      </div>

      {/* Overview Tab with Charts */}
      {activeTab === "overview" && (
        <div>
          {/* Charts Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", 
            gap: "24px",
            marginBottom: "32px"
          }}>
            {/* Room Type Distribution */}
            <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E4DDD4" }}>
              <h3 style={{ marginBottom: "20px", color: "#1E1C1A" }}>Room Type Distribution</h3>
              <div style={{ maxWidth: "300px", margin: "0 auto" }}>
                <Pie data={roomTypeChartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </div>

            {/* Booking Status Distribution */}
            <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E4DDD4" }}>
              <h3 style={{ marginBottom: "20px", color: "#1E1C1A" }}>Booking Status</h3>
              <div style={{ maxWidth: "300px", margin: "0 auto" }}>
                <Pie data={bookingStatusChartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </div>

            {/* Task Status Distribution */}
            <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E4DDD4" }}>
              <h3 style={{ marginBottom: "20px", color: "#1E1C1A" }}>Task Status</h3>
              <div style={{ maxWidth: "300px", margin: "0 auto" }}>
                <Pie data={taskStatusChartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </div>

            {/* Monthly Bookings Trend */}
            <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E4DDD4" }}>
              <h3 style={{ marginBottom: "20px", color: "#1E1C1A" }}>Monthly Bookings Trend</h3>
              <Bar 
                data={monthlyBookingsChartData} 
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, grid: { color: '#E4DDD4' } } }
                }} 
              />
            </div>

            {/* Revenue Trend */}
            <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E4DDD4" }}>
              <h3 style={{ marginBottom: "20px", color: "#1E1C1A" }}>Revenue Trend (₹)</h3>
              <Line 
                data={revenueChartData} 
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' } },
                  scales: { y: { beginAtZero: true, grid: { color: '#E4DDD4' } } }
                }} 
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ 
            background: "linear-gradient(135deg, #4A7C72 0%, #6A9E94 100%)", 
            padding: "32px", 
            borderRadius: "16px", 
            color: "white"
          }}>
            <h3 style={{ marginBottom: "16px", color: "white" }}>Quick Actions</h3>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <button 
                onClick={() => setActiveTab("rooms")}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                + Add New Room
              </button>
              <button 
                onClick={() => setActiveTab("users")}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                Manage Users
              </button>
              <button 
                onClick={() => setActiveTab("config")}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                System Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <h2 style={{ marginBottom: "20px" }}>Manage Users</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #E4DDD4" }}>
              <thead>
                <tr style={{ background: "#FDFCFB", borderBottom: "1px solid #E4DDD4" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>ID</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Username</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Role</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.user_id} style={{ borderBottom: "1px solid #F0EBE4" }}>
                    <td style={{ padding: "12px" }}>{user.user_id}</td>
                    <td style={{ padding: "12px" }}>{user.username}</td>
                    <td style={{ padding: "12px" }}>{user.email}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        background: user.role === 'admin' ? '#4A7C72' : user.role === 'staff' ? '#6A9E94' : '#A09890',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        display: 'inline-block'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.user_id, e.target.value)}
                        disabled={user.user_id === currentUser?.user_id}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #E4DDD4",
                          background: "white",
                          cursor: user.user_id === currentUser?.user_id ? "not-allowed" : "pointer"
                        }}
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rooms Tab */}
      {activeTab === "rooms" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
            <div>
              <h2 style={{ marginBottom: "5px" }}>Manage Rooms</h2>
              <p style={{ color: "#6B6560", fontSize: "14px" }}>Total: {rooms.length} rooms</p>
            </div>
            <button 
              onClick={() => {
                setEditingRoom(null);
                setRoomForm({
                  room_number: "",
                  room_type: "",
                  floor_number: "",
                  capacity: "",
                  base_price: "",
                  description: "",
                  image_url: ""
                });
                setImageFile(null);
                setShowRoomModal(true);
              }}
              style={{
                background: "#4A7C72",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              + Add New Room
            </button>
          </div>

          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "15px",
            padding: "15px",
            background: "#FDFCFB",
            borderRadius: "12px",
            border: "1px solid #E4DDD4"
          }}>
            <div>
              <input
                type="text"
                placeholder="Search by room number or type..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #E4DDD4",
                  width: "250px",
                  fontSize: "14px"
                }}
              />
            </div>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", 
            gap: "20px"
          }}>
            {filteredRooms.map(room => {
              return (
                <div key={room.room_id} style={{
                  background: "white",
                  borderRadius: "16px",
                  border: "1px solid #E4DDD4",
                  overflow: "hidden"
                }}>
                  <div style={{
                    height: "180px",
                    background: room.image_url ? `url(${room.image_url}) center/cover` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    position: "relative"
                  }}>
                    {!room.image_url && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "48px" }}>🏨</div>}
                  </div>
                  
                  <div style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                      <div>
                        <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#1E1C1A" }}>
                          Room {room.room_number}
                        </h3>
                        <p style={{ color: "#6B6560", fontSize: "14px" }}>
                          {room.room_type} • Floor {room.floor_number}
                        </p>
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#4A7C72" }}>
                        ₹{room.base_price}<span style={{ fontSize: "12px" }}>/night</span>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: "13px", color: "#6B6560", marginBottom: "12px" }}>
                      👥 Capacity: {room.capacity} guests
                    </div>
                    
                    {room.description && (
                      <p style={{ color: "#6B6560", fontSize: "13px", marginBottom: "16px" }}>
                        {room.description}
                      </p>
                    )}
                    
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", borderTop: "1px solid #F0EBE4", paddingTop: "12px" }}>
                      <button 
                        onClick={() => {
                          setEditingRoom(room);
                          setRoomForm({
                            room_number: room.room_number,
                            room_type: room.room_type,
                            floor_number: room.floor_number,
                            capacity: room.capacity,
                            base_price: room.base_price,
                            description: room.description || "",
                            image_url: room.image_url || ""
                          });
                          setImageFile(null);
                          setShowRoomModal(true);
                        }}
                        style={{ 
                          flex: 1,
                          padding: "8px 16px",
                          background: "#6A9E94",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteRoom(room.room_id)}
                        style={{ 
                          flex: 1,
                          padding: "8px 16px",
                          background: "#B45C5C",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredRooms.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", color: "#6B6560" }}>
              No rooms found matching your criteria.
            </div>
          )}

          {/* Room Modal */}
          {showRoomModal && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}>
              <div style={{
                background: "white",
                padding: "30px",
                borderRadius: "12px",
                width: "500px",
                maxWidth: "90%",
                maxHeight: "90vh",
                overflowY: "auto"
              }}>
                <h2 style={{ marginBottom: "20px" }}>{editingRoom ? "Edit Room" : "Add New Room"}</h2>
                <form onSubmit={handleRoomSubmit}>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Room Number *</label>
                    <input
                      type="text"
                      value={roomForm.room_number}
                      onChange={(e) => setRoomForm({...roomForm, room_number: e.target.value})}
                      required
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E4DDD4" }}
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Room Type *</label>
                    <input
                      type="text"
                      value={roomForm.room_type}
                      onChange={(e) => setRoomForm({...roomForm, room_type: e.target.value})}
                      required
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E4DDD4" }}
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Floor Number *</label>
                    <input
                      type="number"
                      value={roomForm.floor_number}
                      onChange={(e) => setRoomForm({...roomForm, floor_number: e.target.value})}
                      required
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E4DDD4" }}
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Capacity (guests) *</label>
                    <input
                      type="number"
                      value={roomForm.capacity}
                      onChange={(e) => setRoomForm({...roomForm, capacity: e.target.value})}
                      required
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E4DDD4" }}
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Price per Night (₹) *</label>
                    <input
                      type="number"
                      value={roomForm.base_price}
                      onChange={(e) => setRoomForm({...roomForm, base_price: e.target.value})}
                      required
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E4DDD4" }}
                    />
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Description</label>
                    <textarea
                      value={roomForm.description}
                      onChange={(e) => setRoomForm({...roomForm, description: e.target.value})}
                      rows="3"
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E4DDD4" }}
                    />
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Room Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E4DDD4" }}
                    />
                    {editingRoom?.image_url && !imageFile && (
                      <div style={{ marginTop: "8px" }}>
                        <img src={editingRoom.image_url} alt="Current" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px" }} />
                        <p style={{ fontSize: "11px", color: "#6B6560" }}>Current image</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoomModal(false);
                        setEditingRoom(null);
                        setImageFile(null);
                      }}
                      style={{
                        padding: "8px 16px",
                        background: "#ccc",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      style={{
                        padding: "8px 16px",
                        background: uploading ? "#95B6B0" : "#4A7C72",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: uploading ? "not-allowed" : "pointer"
                      }}
                    >
                      {uploading ? "Saving..." : (editingRoom ? "Update Room" : "Create Room")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <div>
          <h2 style={{ marginBottom: "20px" }}>Manage Bookings</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #E4DDD4" }}>
              <thead>
                <tr style={{ background: "#FDFCFB" }}>
                  <th style={{ padding: "12px" }}>ID</th>
                  <th style={{ padding: "12px" }}>User ID</th>
                  <th style={{ padding: "12px" }}>Room ID</th>
                  <th style={{ padding: "12px" }}>Check In</th>
                  <th style={{ padding: "12px" }}>Check Out</th>
                  <th style={{ padding: "12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.booking_id} style={{ borderBottom: "1px solid #F0EBE4" }}>
                    <td style={{ padding: "12px" }}>{booking.booking_id}</td>
                    <td style={{ padding: "12px" }}>{booking.user_id}</td>
                    <td style={{ padding: "12px" }}>{booking.room_id}</td>
                    <td style={{ padding: "12px" }}>{booking.check_in_date}</td>
                    <td style={{ padding: "12px" }}>{booking.check_out_date}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        background: booking.booking_status === 'confirmed' ? '#D1FAE5' : '#FEF3C7',
                        color: booking.booking_status === 'confirmed' ? '#059669' : '#D97706',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px'
                      }}>
                        {booking.booking_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tasks Tab - VIEW ONLY for Admin */}
      {activeTab === "tasks" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2>Service Requests & Tasks</h2>
            <button 
              onClick={fetchTasks}
              style={{
                background: "#4A7C72",
                color: "white",
                padding: "8px 16px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              Refresh
            </button>
          </div>
          
          {loading.tasks ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "60px", 
              background: "#FDFCFB", 
              borderRadius: "12px",
              border: "1px solid #E4DDD4"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
              <div style={{ color: "#6B6560" }}>No tasks found</div>
              <div style={{ color: "#A09890", fontSize: "13px", marginTop: "8px" }}>
                Tasks will appear here when customers request room service
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Task Stats Summary */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(4, 1fr)", 
                gap: "12px",
                marginBottom: "8px"
              }}>
                {[
                  { label: "Pending", count: tasks.filter(t => t.status === "pending").length, color: "#F59E0B" },
                  { label: "In Progress", count: tasks.filter(t => t.status === "in_progress").length, color: "#3B82F6" },
                  { label: "Completed", count: tasks.filter(t => t.status === "completed").length, color: "#10B981" },
                  { label: "Total", count: tasks.length, color: "#4A7C72" }
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: "white",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #E4DDD4",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: stat.color }}>{stat.count}</div>
                    <div style={{ fontSize: "12px", color: "#6B6560" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Tasks List - No action buttons for admin */}
              {tasks.map(task => {
                const statusStyle = getTaskStatusStyle(task.status);
                const priorityStyle = getPriorityStyle(task.priority);
                
                return (
                  <div key={task.task_id} style={{
                    background: "white",
                    borderRadius: "12px",
                    border: "1px solid #E4DDD4",
                    padding: "16px",
                    transition: "all 0.2s ease"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                          <span style={{
                            fontFamily: "'Soria', serif",
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#1E1C1A"
                          }}>
                            {task.task_type?.replace(/_/g, " ") || "Service Request"}
                          </span>
                          <span style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "500"
                          }}>
                            {statusStyle.label}
                          </span>
                          <span style={{
                            background: priorityStyle.bg,
                            color: priorityStyle.color,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: "500"
                          }}>
                            {priorityStyle.label} Priority
                          </span>
                        </div>
                        
                        <p style={{ color: "#6B6560", fontSize: "13px", marginBottom: "12px", lineHeight: "1.5" }}>
                          {task.description || "No description provided"}
                        </p>
                        
                        <div style={{
                          display: "flex",
                          gap: "20px",
                          fontSize: "11px",
                          color: "#A09890",
                          flexWrap: "wrap"
                        }}>
                          <span>🏠 Room #{task.room_id || "—"}</span>
                          <span>👤 Requested by: {task.raised_by_user?.username || `User #${task.raised_by_user_id}`}</span>
                          <span>📅 {new Date(task.created_at).toLocaleString()}</span>
                          {task.completed_at && (
                            <span>✅ Completed: {new Date(task.completed_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === "config" && (
        <div>
          <h2 style={{ marginBottom: "20px" }}>System Configuration</h2>
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E4DDD4" }}>
            <h3>Hotel Settings</h3>
            <div style={{ marginTop: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Tax Rate (%)</label>
              <input 
                type="number" 
                value={config.taxRate} 
                style={{ width: "200px", padding: "8px", borderRadius: "6px", border: "1px solid #E4DDD4", marginBottom: "16px" }}
                onChange={(e) => setConfig({...config, taxRate: e.target.value})}
              />
              
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Cancellation Policy</label>
              <textarea 
                value={config.cancellationPolicy} 
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E4DDD4", marginBottom: "16px" }}
                onChange={(e) => setConfig({...config, cancellationPolicy: e.target.value})}
                rows="3"
              />
              
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Early Check-in Time</label>
              <input 
                type="text" 
                value={config.earlyCheckIn} 
                style={{ width: "200px", padding: "8px", borderRadius: "6px", border: "1px solid #E4DDD4", marginBottom: "16px" }}
                onChange={(e) => setConfig({...config, earlyCheckIn: e.target.value})}
              />
              
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Late Check-out Time</label>
              <input 
                type="text" 
                value={config.lateCheckOut} 
                style={{ width: "200px", padding: "8px", borderRadius: "6px", border: "1px solid #E4DDD4", marginBottom: "16px" }}
                onChange={(e) => setConfig({...config, lateCheckOut: e.target.value})}
              />
              
              <button 
                onClick={saveConfigurations}
                disabled={savingConfig}
                style={{
                  background: savingConfig ? "#95B6B0" : "#4A7C72",
                  color: "white",
                  padding: "10px 24px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: savingConfig ? "not-allowed" : "pointer",
                  marginTop: "20px"
                }}
              >
                {savingConfig ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}