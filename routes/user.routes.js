import express from "express";
import { 
  createUser, 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getUsersByRole,
  getStaffUsers,
  updateStaffAvailability,
  getUserStats,
  loginUser,
  updateUserRole
} from "../controllers/user.controller.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.middleware.js";
import supabase from "../config/supabaseClient.js";  // Add this import

const router = express.Router();

// ========== TEMPORARY: CREATE ADMIN USER (REMOVE AFTER) ==========
router.post("/create-admin", async (req, res) => {
  try {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.default.hash('admin123', 10);
    
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from("Users")
      .select("email")
      .eq("email", "admin@bookinn.com")
      .maybeSingle();
      
    if (existingAdmin) {
      return res.json({ 
        success: false, 
        message: "Admin already exists", 
        user: existingAdmin 
      });
    }
    
    const { data, error } = await supabase
      .from("Users")
      .insert([{
        username: "admin",
        email: "admin@bookinn.com",
        password: hashedPassword,
        role: "admin",
        availability: "available",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
      
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: "Admin created successfully!", 
      user: data[0] 
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========== AUTH ROUTES ==========
router.post("/login", loginUser);

// ========== USER CRUD ROUTES ==========
router.post("/", createUser);
router.get("/", authenticateToken, authorizeAdmin, getUsers);
router.get("/stats", authenticateToken, authorizeAdmin, getUserStats);
router.get("/role/:role", authenticateToken, authorizeAdmin, getUsersByRole);
router.get("/staff", authenticateToken, authorizeAdmin, getStaffUsers);
router.get("/:id", authenticateToken, authorizeAdmin, getUserById);
router.put("/:id", authenticateToken, authorizeAdmin, updateUser);
router.patch("/:id/role", authenticateToken, authorizeAdmin, updateUserRole);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteUser);

// ========== STAFF SPECIFIC ROUTES ==========
router.patch("/staff/:id/availability", authenticateToken, authorizeAdmin, updateStaffAvailability);

export default router;