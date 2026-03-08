import supabase from "../config/supabaseClient.js";

export const createTask = async (req, res) => {
  try {
    const { room_id, raised_by_user_id, task_type, description, priority } = req.body;

    // 1️⃣ Get all staff
    const { data: staff, error: staffError } = await supabase
      .from("Users")
      .select("user_id")
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

    tasks.forEach(t => {
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

    return res.status(201).json({
      message: "Task created and assigned successfully",
      data
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};
export const getTasksByStaff = async (req, res) => {
    try {
  
      const { staff_id } = req.params;
  
      const { data, error } = await supabase
        .from("Tasks")
        .select("*")
        .eq("assigned_staff_id", staff_id)
        .order("created_at", { ascending: false });
  
      if (error) {
        console.log(error);
        return res.status(500).json(error);
      }
  
      return res.status(200).json({
        message: "Staff tasks fetched successfully",
        data
      });
  
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        error: err.message
      });
    }
  };