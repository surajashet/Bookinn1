import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:5000";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomFilter, setRoomFilter] = useState("all");
  const [roomSearch, setRoomSearch] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [roomForm, setRoomForm] = useState({
    room_number: "",
    room_type: "",
    floor_number: "",
    capacity: "",
    base_price: "",
    room_status: "available",
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
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
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
        alert(`User role updated to ${newRole}`);
        fetchUsers();
      } else {
        alert(data.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Error updating role");
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    console.log("=== Starting room submission ===");
    console.log("Image file present:", !!imageFile);
    console.log("Editing room:", editingRoom);
    
    try {
      const token = localStorage.getItem("token");
      const url = editingRoom 
        ? `${BASE_URL}/api/rooms/${editingRoom.room_id}`
        : `${BASE_URL}/api/rooms`;
      const method = editingRoom ? "PUT" : "POST";
      
      console.log("Saving room to:", url);
      
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
      console.log("Room save response:", data);
      
      if (data.success) {
        const roomId = data.data.room_id || editingRoom?.room_id;
        console.log("Room ID for image:", roomId);
        
        if (imageFile) {
          console.log("Image file detected, starting upload...");
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64String = reader.result;
            console.log("Image converted to base64, length:", base64String.length);
            
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
            console.log("Upload response:", uploadData);
            
            if (uploadData.success) {
              alert(editingRoom ? "Room updated with image!" : "Room created with image!");
            } else {
              console.error("Upload failed:", uploadData);
              alert("Room saved but image upload failed: " + (uploadData.error || "Unknown error"));
            }
            setUploading(false);
          };
          reader.readAsDataURL(imageFile);
        } else {
          console.log("No image file to upload");
          alert(editingRoom ? "Room updated successfully!" : "Room created successfully!");
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
          room_status: "available",
          description: "",
          image_url: ""
        });
        fetchRooms();
      } else {
        alert(data.error || "Failed to save room");
        setUploading(false);
      }
    } catch (error) {
      console.error("Error saving room:", error);
      alert("Error saving room: " + error.message);
      setUploading(false);
    }
  };

  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/rooms/${roomId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ room_status: newStatus })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Room status updated to ${newStatus}`);
        fetchRooms();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status");
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
        alert("Room deleted successfully!");
        fetchRooms();
      } else {
        alert(data.error || "Failed to delete room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Error deleting room");
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesFilter = roomFilter === "all" || room.room_status === roomFilter;
    const matchesSearch = roomSearch === "" || 
      room.room_number.toString().includes(roomSearch) ||
      room.room_type.toLowerCase().includes(roomSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
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

  if (loading.users) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading Admin Dashboard...</div>;
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
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
          <div style={{ color: "#6B6560", marginTop: "8px" }}>Active Tasks</div>
        </div>
      </div>

      <div style={{ 
        display: "flex", 
        gap: "10px", 
        borderBottom: "1px solid #E4DDD4", 
        marginBottom: "30px",
        flexWrap: "wrap"
      }}>
        <button style={tabStyle("users")} onClick={() => setActiveTab("users")}>Users</button>
        <button style={tabStyle("rooms")} onClick={() => setActiveTab("rooms")}>Rooms</button>
        <button style={tabStyle("bookings")} onClick={() => setActiveTab("bookings")}>Bookings</button>
        <button style={tabStyle("tasks")} onClick={() => setActiveTab("tasks")}>Tasks</button>
        <button style={tabStyle("config")} onClick={() => setActiveTab("config")}>Configuration</button>
      </div>

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
                  room_status: "available",
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
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {["all", "available", "occupied", "maintenance", "reserved"].map(filter => (
                <button
                  key={filter}
                  onClick={() => setRoomFilter(filter)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "20px",
                    border: "1px solid #E4DDD4",
                    background: roomFilter === filter ? "#4A7C72" : "white",
                    color: roomFilter === filter ? "white" : "#6B6560",
                    cursor: "pointer"
                  }}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
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
              const statusColors = {
                available: { bg: "#4A7C72", text: "Available" },
                occupied: { bg: "#B45C5C", text: "Occupied" },
                maintenance: { bg: "#E6B17E", text: "Maintenance" },
                cleaning: { bg: "#6A9E94", text: "Cleaning" },
                reserved: { bg: "#9B8E7C", text: "Reserved" }
              };
              const statusInfo = statusColors[room.room_status] || statusColors.available;
              
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
                    <span style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: statusInfo.bg,
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "white"
                    }}>
                      {statusInfo.text}
                    </span>
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
                      <select
                        value={room.room_status}
                        onChange={(e) => updateRoomStatus(room.room_id, e.target.value)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #E4DDD4",
                          background: "white",
                          cursor: "pointer"
                        }}
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="reserved">Reserved</option>
                      </select>
                      <button 
                        onClick={() => {
                          setEditingRoom(room);
                          setRoomForm({
                            room_number: room.room_number,
                            room_type: room.room_type,
                            floor_number: room.floor_number,
                            capacity: room.capacity,
                            base_price: room.base_price,
                            room_status: room.room_status,
                            description: room.description || "",
                            image_url: room.image_url || ""
                          });
                          setImageFile(null);
                          setShowRoomModal(true);
                        }}
                        style={{ 
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
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Status</label>
                    <select
                      value={roomForm.room_status}
                      onChange={(e) => setRoomForm({...roomForm, room_status: e.target.value})}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E4DDD4" }}
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="reserved">Reserved</option>
                    </select>
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

      {activeTab === "bookings" && (
        <div>
          <h2 style={{ marginBottom: "20px" }}>Manage Bookings</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #E4DDD4" }}>
              <thead>
                <tr style={{ background: "#FDFCFB" }}>
                  <th style={{ padding: "12px" }}>ID</th>
                  <th style={{ padding: "12px" }}>User</th>
                  <th style={{ padding: "12px" }}>Room</th>
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
                    <td style={{ padding: "12px" }}>{booking.booking_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div>
          <h2 style={{ marginBottom: "20px" }}>Manage Tasks</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #E4DDD4" }}>
              <thead>
                <tr style={{ background: "#FDFCFB" }}>
                  <th style={{ padding: "12px" }}>ID</th>
                  <th style={{ padding: "12px" }}>Description</th>
                  <th style={{ padding: "12px" }}>Assigned To</th>
                  <th style={{ padding: "12px" }}>Status</th>
                  <th style={{ padding: "12px" }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.task_id} style={{ borderBottom: "1px solid #F0EBE4" }}>
                    <td style={{ padding: "12px" }}>{task.task_id}</td>
                    <td style={{ padding: "12px" }}>{task.description}</td>
                    <td style={{ padding: "12px" }}>{task.assigned_staff_id}</td>
                    <td style={{ padding: "12px" }}>{task.status}</td>
                    <td style={{ padding: "12px" }}>{task.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              
              <button style={{
                background: "#4A7C72",
                color: "white",
                padding: "10px 24px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                marginTop: "20px"
              }}>
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}