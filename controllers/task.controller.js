import supabase from "../config/supabaseClient.js";

// Create task with workload balancing (admin/staff only)
export const createTask = async (req, res) => {
  try {
    const { room_id, raised_by_user_id, task_type, description, priority } = req.body;

    // 1️⃣ Get all staff
    const { data: staff, error: staffError } = await supabase
      .from("Users")
      .select("user_id, username")
      .eq("role", "staff");

    if (staffError) {
      console.log(staffError);
      return res.status(500).json({ error: "Failed to fetch staff" });
    }

    if (!staff || staff.length === 0) {
      return res.status(400).json({ error: "No staff available" });
    }

    // 2️⃣ Get task counts for each staff
    const { data: tasks } = await supabase
      .from("Tasks")
      .select("assigned_staff_id");

    let staffWorkload = {};

    staff.forEach(s => {
      staffWorkload[s.user_id] = 0;
    });

    tasks?.forEach(t => {
      if (staffWorkload[t.assigned_staff_id] !== undefined) {
        staffWorkload[t.assigned_staff_id]++;
      }
    });

    // 3️⃣ Find least busy staff
    let assigned_staff_id = Object.keys(staffWorkload).reduce((a, b) =>
      staffWorkload[a] < staffWorkload[b] ? a : b
    );

    // 4️⃣ Insert task
    const { data, error } = await supabase
      .from("Tasks")
      .insert([
        {
          room_id,
          raised_by_user_id,
          assigned_staff_id,
          task_type,
          description,
          priority,
          status: "pending"
        }
      ])
      .select(`
        *,
        rooms (*),
        Users!Tasks_raised_by_user_id_fkey (user_id, username),
        Users!Tasks_assigned_staff_id_fkey (user_id, username)
      `);

    if (error) {
      console.log(error);
      return res.status(500).json(error);
    }

    // Log activity
    await supabase
      .from("Activity Logs")
      .insert([{
        user_id: raised_by_user_id,
        action: "CREATE_TASK",
        entity_type: "task",
        description: `Task created for room ${room_id} - ${task_type}`
      }]);

    return res.status(201).json({
      success: true,
      message: "Task created and assigned successfully",
      data: data[0]
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};

// Create a service request (for customers to request room service)
export const createServiceRequest = async (req, res) => {
  try {
    const { room_id, task_type, description, priority } = req.body;
    const raised_by_user_id = req.user.id;

    // Check if the user has an active booking for this room
    const today = new Date().toISOString().split('T')[0];
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("booking_id, booking_status")
      .eq("user_id", raised_by_user_id)
      .eq("room_id", room_id)
      .in("booking_status", ["confirmed", "checked_in"])
      .gte("check_out_date", today)
      .maybeSingle();

    if (bookingError || !booking) {
      return res.status(403).json({
        success: false,
        error: "You can only request services for rooms you have an active booking for"
      });
    }

    // Get all available staff
    const { data: staff, error: staffError } = await supabase
      .from("Users")
      .select("user_id")
      .eq("role", "staff")
      .eq("availability", "available");

    if (staffError || !staff || staff.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "No staff available at the moment" 
      });
    }

    // Get current task counts for workload balancing
    const { data: tasks } = await supabase
      .from("Tasks")
      .select("assigned_staff_id")
      .in("status", ["pending", "in_progress"]);

    let staffWorkload = {};
    staff.forEach(s => { staffWorkload[s.user_id] = 0; });
    tasks?.forEach(t => {
      if (staffWorkload[t.assigned_staff_id] !== undefined) {
        staffWorkload[t.assigned_staff_id]++;
      }
    });

    // Find least busy staff
    let assigned_staff_id = Object.keys(staffWorkload).reduce((a, b) =>
      staffWorkload[a] < staffWorkload[b] ? a : b
    );

    // Create task
    const { data, error } = await supabase
      .from("Tasks")
      .insert([{
        room_id,
        raised_by_user_id,
        assigned_staff_id,
        task_type,
        description,
        priority: priority || 'normal',
        status: 'pending'
      }])
      .select(`
        *,
        rooms (*),
        Users!Tasks_raised_by_user_id_fkey (user_id, username, email),
        Users!Tasks_assigned_staff_id_fkey (user_id, username)
      `);

    if (error) throw error;

    // Log activity
    await supabase
      .from("Activity Logs")
      .insert([{
        user_id: raised_by_user_id,
        action: "CREATE_SERVICE_REQUEST",
        entity_type: "task",
        description: `Service request created for room ${room_id} - ${task_type}`
      }]);

    res.status(201).json({
      success: true,
      message: "Service request created successfully",
      data: data[0]
    });
  } catch (error) {
    console.error("Create service request error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get user's service requests (for customers)
export const getUserServiceRequests = async (req, res) => {
  try {
    const user_id = req.user.id;

    const { data, error } = await supabase
      .from("Tasks")
      .select(`
        *,
        rooms (room_number, room_type),
        Users!Tasks_assigned_staff_id_fkey (username)
      `)
      .eq("raised_by_user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error("Get user service requests error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get staff's assigned tasks (for staff dashboard)
export const getStaffAssignedTasks = async (req, res) => {
  try {
    const staff_id = req.user.id;

    // Get active tasks assigned to this staff
    const { data: activeTasks, error: tasksError } = await supabase
      .from("Tasks")
      .select(`
        *,
        rooms (room_number, room_type),
        Users!Tasks_raised_by_user_id_fkey (user_id, username, email)
      `)
      .eq("assigned_staff_id", staff_id)
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: false });

    if (tasksError) throw tasksError;

    // Get today's check-ins
    const today = new Date().toISOString().split('T')[0];
    const { data: checkIns, error: checkInError } = await supabase
      .from("bookings")
      .select(`
        *,
        rooms (room_number, room_type),
        Users (username, email)
      `)
      .eq("check_in_date", today)
      .eq("booking_status", "confirmed")
      .limit(10);

    if (checkInError) throw checkInError;

    res.json({
      success: true,
      data: {
        active_tasks: activeTasks || [],
        today_check_ins: checkIns || []
      }
    });
  } catch (error) {
    console.error("Get staff assigned tasks error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get all tasks with filters (admin)
export const getAllTasksWithFilters = async (req, res) => {
  try {
    const { status, priority, task_type, staff_id, room_id } = req.query;

    let query = supabase
      .from("Tasks")
      .select(`
        *,
        rooms (room_number, room_type, floor_number),
        Users!Tasks_raised_by_user_id_fkey (user_id, username),
        Users!Tasks_assigned_staff_id_fkey (user_id, username)
      `);

    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }
    if (task_type) {
      query = query.eq("task_type", task_type);
    }
    if (staff_id) {
      query = query.eq("assigned_staff_id", staff_id);
    }
    if (room_id) {
      query = query.eq("room_id", room_id);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error("Get all tasks error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get all tasks (with filters) - alias for backward compatibility
export const getAllTasks = getAllTasksWithFilters;

// Get tasks by staff ID
export const getTasksByStaff = async (req, res) => {
  try {
    const { staff_id } = req.params;
    const { status, priority } = req.query;

    let query = supabase
      .from("Tasks")
      .select(`
        *,
        rooms (room_number, room_type, floor_number),
        Users!Tasks_raised_by_user_id_fkey (username)
      `)
      .eq("assigned_staff_id", staff_id);

    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.log(error);
      return res.status(500).json(error);
    }

    return res.status(200).json({
      success: true,
      message: "Staff tasks fetched successfully",
      count: data.length,
      data
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err.message
    });
  }
};

// Get tasks by room ID
export const getTasksByRoom = async (req, res) => {
  try {
    const { room_id } = req.params;

    const { data, error } = await supabase
      .from("Tasks")
      .select(`
        *,
        Users!Tasks_raised_by_user_id_fkey (username),
        Users!Tasks_assigned_staff_id_fkey (username)
      `)
      .eq("room_id", room_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error("Get tasks by room error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid status" 
      });
    }

    const { data, error } = await supabase
      .from("Tasks")
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq("task_id", task_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Task ${status} successfully`,
      data
    });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get task statistics
export const getTaskStats = async (req, res) => {
  try {
    const { data: allTasks, error } = await supabase
      .from("Tasks")
      .select(`
        *,
        Users!Tasks_assigned_staff_id_fkey (username)
      `);

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      cancelled: allTasks.filter(t => t.status === 'cancelled').length,
      by_priority: {
        high: allTasks.filter(t => t.priority === 'high').length,
        medium: allTasks.filter(t => t.priority === 'medium').length,
        low: allTasks.filter(t => t.priority === 'low').length
      },
      by_type: {}
    };

    // Group by task type
    allTasks.forEach(task => {
      if (!stats.by_type[task.task_type]) {
        stats.by_type[task.task_type] = 0;
      }
      stats.by_type[task.task_type]++;
    });

    // Staff workload
    const staffWorkload = {};
    allTasks.forEach(task => {
      if (task.status === 'pending' || task.status === 'in_progress') {
        const staffName = task.Users_Tasks_assigned_staff_id_fkey?.username || 'Unknown';
        staffWorkload[staffName] = (staffWorkload[staffName] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: {
        overview: stats,
        staff_workload: staffWorkload
      }
    });
  } catch (error) {
    console.error("Get task stats error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Reassign task
export const reassignTask = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { new_staff_id, reassign_reason } = req.body;

    // Check if new staff exists
    const { data: staff, error: staffError } = await supabase
      .from("Users")
      .select("user_id, username")
      .eq("user_id", new_staff_id)
      .eq("role", "staff")
      .single();

    if (staffError || !staff) {
      return res.status(404).json({ 
        success: false,
        error: "Staff not found" 
      });
    }

    // Get current task
    const { data: currentTask } = await supabase
      .from("Tasks")
      .select("*")
      .eq("task_id", task_id)
      .single();

    // Update task
    const { data, error } = await supabase
      .from("Tasks")
      .update({ 
        assigned_staff_id: new_staff_id,
        updated_at: new Date().toISOString(),
        description: currentTask.description + `\n[Reassigned to ${staff.username}: ${reassign_reason || 'No reason provided'}]`
      })
      .eq("task_id", task_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Task reassigned successfully",
      data
    });
  } catch (error) {
    console.error("Reassign task error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};