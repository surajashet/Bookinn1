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
      .select();

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
    const today = new Date().toISOString().split('T')[0];

    console.log("========== ROOM SERVICE REQUEST DEBUG ==========");
    console.log("1. Request body:", { room_id, task_type, description, priority });
    console.log("2. User ID from token:", raised_by_user_id);
    console.log("3. Today's date:", today);

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("Users")
      .select("user_id, username, email")
      .eq("user_id", raised_by_user_id)
      .maybeSingle();

    if (userError || !user) {
      console.log("❌ User not found:", raised_by_user_id);
      return res.status(403).json({
        success: false,
        error: "User not found. Please login again."
      });
    }
    console.log("✅ User found:", user.username);

    // FIRST: Check if user has ANY booking for this room (without date restrictions first)
    console.log("🔍 Checking for booking - room_id:", room_id, "user_id:", raised_by_user_id);
    
    const { data: anyBooking, error: anyBookingError } = await supabase
      .from("bookings")
      .select("booking_id, booking_status, check_in_date, check_out_date")
      .eq("user_id", raised_by_user_id)
      .eq("room_id", room_id)
      .maybeSingle();

    if (anyBookingError) {
      console.log("❌ Booking query error:", anyBookingError);
    }

    if (!anyBooking) {
      console.log("❌ No booking found for this user and room");
      return res.status(403).json({
        success: false,
        error: "No booking found for this room. Please make sure you have a confirmed booking."
      });
    }

    console.log("📅 Booking found:", {
      id: anyBooking.booking_id,
      status: anyBooking.booking_status,
      check_in: anyBooking.check_in_date,
      check_out: anyBooking.check_out_date
    });

    // Check if booking is active (not cancelled)
    if (anyBooking.booking_status === 'cancelled') {
      console.log("❌ Booking is cancelled");
      return res.status(403).json({
        success: false,
        error: "This booking has been cancelled. Room service is not available."
      });
    }

    // Check if within stay dates (flexible - allow confirmed bookings too)
    const isWithinDates = anyBooking.check_in_date <= today && anyBooking.check_out_date >= today;
    const isConfirmed = anyBooking.booking_status === 'confirmed';
    const isCheckedIn = anyBooking.booking_status === 'checked_in';
    
    console.log("📅 Date check:", {
      check_in: anyBooking.check_in_date,
      check_out: anyBooking.check_out_date,
      today: today,
      isWithinDates: isWithinDates,
      isConfirmed: isConfirmed,
      isCheckedIn: isCheckedIn
    });

    // Allow if either: within dates OR confirmed (for future bookings they can pre-order)
    if (!isWithinDates && !isConfirmed) {
      console.log("❌ Not eligible for room service");
      return res.status(403).json({
        success: false,
        error: `Room service is only available during your stay (${anyBooking.check_in_date} to ${anyBooking.check_out_date}).`
      });
    }

    // Get staff (try without availability filter first)
    console.log("🔍 Fetching staff...");
    let { data: staff, error: staffError } = await supabase
      .from("Users")
      .select("user_id, username")
      .eq("role", "staff");

    if (staffError) {
      console.log("❌ Staff fetch error:", staffError);
      return res.status(500).json({ 
        success: false,
        error: "Error fetching staff" 
      });
    }

    console.log("👥 Staff found:", staff?.length || 0);

    if (!staff || staff.length === 0) {
      console.log("❌ No staff in database");
      return res.status(400).json({ 
        success: false,
        error: "No staff available. Please contact front desk." 
      });
    }

    // Get task counts for workload balancing
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

    console.log("📊 Staff workload:", staffWorkload);

    // Find least busy staff (or pick first if all have same workload)
    let assigned_staff_id;
    if (Object.keys(staffWorkload).length > 0) {
      assigned_staff_id = Object.keys(staffWorkload).reduce((a, b) =>
        staffWorkload[a] < staffWorkload[b] ? a : b
      );
    } else {
      assigned_staff_id = staff[0].user_id;
    }

    console.log("✅ Assigned to staff ID:", assigned_staff_id);

    // Create task
    console.log("📝 Creating task...");
    const { data, error } = await supabase
      .from("Tasks")
      .insert([{
        room_id: parseInt(room_id),
        raised_by_user_id: parseInt(raised_by_user_id),
        assigned_staff_id: parseInt(assigned_staff_id),
        task_type,
        description: description || `Room service request: ${task_type}`,
        priority: priority || 'normal',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.log("❌ Task creation error:", error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }

    if (!data || data.length === 0) {
      console.log("❌ No data returned from task creation");
      return res.status(500).json({ 
        success: false,
        error: "Failed to create task" 
      });
    }

    console.log("✅ Task created successfully! Task ID:", data[0].task_id);
    console.log("========== REQUEST COMPLETE ==========");

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
    console.error("❌ Create service request error:", error);
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
        rooms:room_id (room_number, room_type)
      `)
      .eq("raised_by_user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get assigned staff names separately
    const staffIds = [...new Set(data?.map(t => t.assigned_staff_id).filter(id => id) || [])];
    let staffMap = {};
    
    if (staffIds.length > 0) {
      const { data: staff } = await supabase
        .from("Users")
        .select("user_id, username")
        .in("user_id", staffIds);
      staff.forEach(s => { staffMap[s.user_id] = s.username; });
    }

    const enrichedData = data?.map(task => ({
      ...task,
      assigned_staff_name: staffMap[task.assigned_staff_id] || null
    })) || [];

    res.json({
      success: true,
      data: enrichedData
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
        rooms:room_id (room_number, room_type)
      `)
      .eq("assigned_staff_id", staff_id)
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: false });

    if (tasksError) throw tasksError;

    // Get raised by user names
    const userIds = [...new Set(activeTasks?.map(t => t.raised_by_user_id).filter(id => id) || [])];
    let userMap = {};
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("Users")
        .select("user_id, username, email")
        .in("user_id", userIds);
      users.forEach(u => { userMap[u.user_id] = u; });
    }

    const enrichedTasks = activeTasks?.map(task => ({
      ...task,
      raised_by_user: userMap[task.raised_by_user_id] || null
    })) || [];

    // Get today's check-ins
    const today = new Date().toISOString().split('T')[0];
    const { data: checkIns, error: checkInError } = await supabase
      .from("bookings")
      .select(`
        *,
        rooms:room_id (room_number, room_type),
        Users (username, email)
      `)
      .eq("check_in_date", today)
      .eq("booking_status", "confirmed")
      .limit(10);

    if (checkInError) throw checkInError;

    res.json({
      success: true,
      data: {
        active_tasks: enrichedTasks || [],
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

// Get all tasks with filters (admin) - FIXED VERSION
export const getAllTasksWithFilters = async (req, res) => {
  try {
    const { status, priority, task_type, staff_id, room_id } = req.query;

    console.log("📋 Fetching all tasks - Admin request");

    // Build query for tasks only (no nested user joins to avoid duplication)
    let query = supabase
      .from("Tasks")
      .select(`
        *,
        rooms:room_id (room_number, room_type, floor_number)
      `);

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);
    if (task_type) query = query.eq("task_type", task_type);
    if (staff_id) query = query.eq("assigned_staff_id", staff_id);
    if (room_id) query = query.eq("room_id", room_id);

    query = query.order("created_at", { ascending: false });

    const { data: tasks, error } = await query;

    if (error) {
      console.error("❌ Tasks fetch error:", error);
      throw error;
    }

    if (!tasks || tasks.length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    // Get unique user IDs from tasks
    const raisedByUserIds = [...new Set(tasks.map(t => t.raised_by_user_id).filter(id => id))];
    const assignedStaffIds = [...new Set(tasks.map(t => t.assigned_staff_id).filter(id => id))];
    const allUserIds = [...new Set([...raisedByUserIds, ...assignedStaffIds])];

    // Fetch users separately
    let raisedByUsers = [];
    let assignedStaff = [];
    
    if (raisedByUserIds.length > 0) {
      const { data: users } = await supabase
        .from("Users")
        .select("user_id, username, email")
        .in("user_id", raisedByUserIds);
      raisedByUsers = users || [];
    }

    if (assignedStaffIds.length > 0) {
      const { data: staff } = await supabase
        .from("Users")
        .select("user_id, username, email")
        .in("user_id", assignedStaffIds);
      assignedStaff = staff || [];
    }

    // Map users to tasks
    const enrichedTasks = tasks.map(task => ({
      ...task,
      raised_by_user: raisedByUsers.find(u => u.user_id === task.raised_by_user_id),
      assigned_staff: assignedStaff.find(u => u.user_id === task.assigned_staff_id)
    }));

    console.log(`✅ Found ${enrichedTasks.length} tasks`);

    res.json({
      success: true,
      count: enrichedTasks.length,
      data: enrichedTasks
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
        rooms:room_id (room_number, room_type, floor_number)
      `)
      .eq("assigned_staff_id", staff_id);

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);

    query = query.order("created_at", { ascending: false });

    const { data: tasks, error } = await query;

    if (error) {
      console.log(error);
      return res.status(500).json(error);
    }

    // Get raised by user names
    const userIds = [...new Set(tasks?.map(t => t.raised_by_user_id).filter(id => id) || [])];
    let userMap = {};
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("Users")
        .select("user_id, username")
        .in("user_id", userIds);
      users.forEach(u => { userMap[u.user_id] = u.username; });
    }

    const enrichedTasks = tasks?.map(task => ({
      ...task,
      raised_by_username: userMap[task.raised_by_user_id] || null
    })) || [];

    return res.status(200).json({
      success: true,
      message: "Staff tasks fetched successfully",
      count: enrichedTasks.length,
      data: enrichedTasks
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

    const { data: tasks, error } = await supabase
      .from("Tasks")
      .select("*")
      .eq("room_id", room_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get user details separately
    const userIds = [...new Set([
      ...tasks?.map(t => t.raised_by_user_id),
      ...tasks?.map(t => t.assigned_staff_id)
    ].filter(id => id) || [])];
    
    let userMap = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("Users")
        .select("user_id, username")
        .in("user_id", userIds);
      users.forEach(u => { userMap[u.user_id] = u.username; });
    }

    const enrichedTasks = tasks?.map(task => ({
      ...task,
      raised_by_username: userMap[task.raised_by_user_id],
      assigned_staff_username: userMap[task.assigned_staff_id]
    })) || [];

    res.json({
      success: true,
      count: enrichedTasks.length,
      data: enrichedTasks
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
      .select("*");

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
        low: allTasks.filter(t => t.priority === 'low').length,
        normal: allTasks.filter(t => t.priority === 'normal').length
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

    res.json({
      success: true,
      data: {
        overview: stats
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