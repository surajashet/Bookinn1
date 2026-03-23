import supabase from "../config/supabaseClient.js";

// Create task with workload balancing
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

// Get all tasks (with filters)
export const getAllTasks = async (req, res) => {
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

// Get tasks by staff ID (your existing function enhanced)
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