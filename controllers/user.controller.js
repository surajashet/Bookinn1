import supabase from "../config/supabaseClient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Create a new user
export const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required"
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("Users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User with this email already exists" 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = "customer"; // default role

    const { data, error } = await supabase
      .from("Users")
      .insert([
        {
          username,
          email,
          password: hashedPassword,
          role,
          availability: "available",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select("user_id, username, email, role, availability, created_at, updated_at");

    if (error) {
      console.log("SUPABASE ERROR:", error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Generate token for auto-login after signup
    const token = jwt.sign(
      { id: data[0].user_id, email: data[0].email, role: data[0].role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: data[0]
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from("Users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.log("SUPABASE ERROR:", error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check if user is deleted/disabled
    if (user.availability === 'deleted') {
      return res.status(403).json({ 
        success: false,
        message: "This account has been deactivated" 
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get all users (excluding passwords)
export const getUsers = async (req, res) => {
  try {
    const { role, availability } = req.query;

    let query = supabase
      .from("Users")
      .select("user_id, username, email, role, availability, created_at, updated_at");

    if (role) {
      query = query.eq("role", role);
    }
    if (availability) {
      query = query.eq("availability", availability);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.log("SUPABASE ERROR:", error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get user by ID (excluding password)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("Users")
      .select("user_id, username, email, role, availability, created_at, updated_at")
      .eq("user_id", id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, availability } = req.body;

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from("Users")
      .select("user_id")
      .eq("user_id", id)
      .maybeSingle();

    if (checkError) {
      return res.status(500).json({
        success: false,
        error: checkError.message
      });
    }

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // If email is being updated, check if it's already taken
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }

      const { data: emailCheck, error: emailError } = await supabase
        .from("Users")
        .select("email")
        .eq("email", email)
        .neq("user_id", id)
        .maybeSingle();

      if (emailError) {
        return res.status(500).json({
          success: false,
          error: emailError.message
        });
      }

      if (emailCheck) {
        return res.status(400).json({
          success: false,
          message: "Email already in use by another user"
        });
      }
    }

    // Validate availability if provided
    if (availability) {
      const validStatuses = ['available', 'busy', 'offline', 'on_leave', 'deleted'];
      if (!validStatuses.includes(availability)) {
        return res.status(400).json({
          success: false,
          message: "Invalid availability status"
        });
      }
    }

    // Build update object
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (availability !== undefined) updates.availability = availability;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("Users")
      .update(updates)
      .eq("user_id", id)
      .select("user_id, username, email, role, availability, updated_at");

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: data[0]
    });

  } catch (err) {
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Check if the current user is admin (from token)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admins can change user roles"
      });
    }
    
    // Validate role
    const validRoles = ['customer', 'staff', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be: customer, staff, or admin"
      });
    }
    
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from("Users")
      .select("user_id, username, email, role")
      .eq("user_id", id)
      .maybeSingle();
      
    if (checkError || !existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Don't allow demoting the last admin
    if (existingUser.role === 'admin' && role !== 'admin') {
      const { data: adminCount, error: countError } = await supabase
        .from("Users")
        .select("user_id", { count: 'exact', head: false })
        .eq("role", "admin");
        
      if (adminCount && adminCount.length === 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot demote the only admin user"
        });
      }
    }
    
    // Update user role
    const { data, error } = await supabase
      .from("Users")
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", id)
      .select("user_id, username, email, role, updated_at");
      
    if (error) throw error;
    
    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: data[0]
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Delete user (soft delete by default, hard delete with ?permanent=true)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const { data: existingUser, error: checkError } = await supabase
      .from("Users")
      .select("user_id, role")
      .eq("user_id", id)
      .maybeSingle();

    if (checkError) {
      return res.status(500).json({
        success: false,
        error: checkError.message
      });
    }

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user has active bookings
    if (existingUser.role === 'customer') {
      const { data: activeBookings, error: bookingError } = await supabase
        .from("bookings")
        .select("booking_id")
        .eq("user_id", id)
        .in("booking_status", ["confirmed", "checked_in"])
        .maybeSingle();

      if (bookingError) {
        return res.status(500).json({
          success: false,
          error: bookingError.message
        });
      }

      if (activeBookings) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete user with active bookings"
        });
      }
    }

    if (permanent === 'true') {
      const { error } = await supabase
        .from("Users")
        .delete()
        .eq("user_id", id);

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: "User permanently deleted"
      });
    } else {
      const { data, error } = await supabase
        .from("Users")
        .update({ 
          availability: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq("user_id", id)
        .select("user_id, username, email, role, availability");

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: "User deactivated successfully",
        data: data[0]
      });
    }

  } catch (err) {
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get users by role
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    const { data, error } = await supabase
      .from("Users")
      .select("user_id, username, email, role, availability")
      .eq("role", role)
      .order("username");

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get staff members
export const getStaffUsers = async (req, res) => {
  try {
    const { availability } = req.query;

    let query = supabase
      .from("Users")
      .select("user_id, username, email, role, availability")
      .eq("role", "staff");

    if (availability) {
      query = query.eq("availability", availability);
    }

    const { data, error } = await query.order("username");

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Update staff availability
export const updateStaffAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    const validStatuses = ['available', 'busy', 'offline', 'on_leave'];
    if (!validStatuses.includes(availability)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability status. Must be: " + validStatuses.join(', ')
      });
    }

    const { data: existingUser, error: checkError } = await supabase
      .from("Users")
      .select("user_id, role")
      .eq("user_id", id)
      .eq("role", "staff")
      .maybeSingle();

    if (checkError) {
      return res.status(500).json({
        success: false,
        error: checkError.message
      });
    }

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    const { data, error } = await supabase
      .from("Users")
      .update({ 
        availability,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", id)
      .select("user_id, username, email, role, availability");

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff availability updated",
      data: data[0]
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("Users")
      .select("role, availability");

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    const stats = {
      total: users.length,
      by_role: {
        admin: users.filter(u => u.role === 'admin').length,
        staff: users.filter(u => u.role === 'staff').length,
        customer: users.filter(u => u.role === 'customer').length
      },
      by_availability: {
        available: users.filter(u => u.availability === 'available').length,
        busy: users.filter(u => u.availability === 'busy').length,
        offline: users.filter(u => u.availability === 'offline').length,
        on_leave: users.filter(u => u.availability === 'on_leave').length,
        deleted: users.filter(u => u.availability === 'deleted').length
      }
    };

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};