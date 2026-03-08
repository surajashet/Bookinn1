import supabase from "../config/supabaseClient.js";
import bcrypt from "bcrypt";
export const createUser = async (req, res) => {
  try {

    const { username, email, password } = req.body;

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
          role
        }
      ])
      .select();

    if (error) {
      console.log("SUPABASE ERROR:", error);
      return res.status(500).json(error);
    }

    return res.status(201).json({
      message: "User created successfully",
      data
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    return res.status(500).json({
      error: err.message
    });
  }
};


export const getUsers = async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("Users")
      .select("*");

    if (error) {
      console.log("SUPABASE ERROR:", error);
      return res.status(500).json(error);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.log("SERVER ERROR:", err);
    return res.status(500).json({
      error: err.message
    });
  }
};
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("user_id", id)
      .single();

    if (error) {
      return res.status(500).json(error);
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body;

    const { data, error } = await supabase
      .from("Users")
      .update({
        username,
        email,
        role
      })
      .eq("user_id", id)
      .select();

    if (error) {
      return res.status(500).json(error);
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("Users")
      .delete()
      .eq("user_id", id);

    if (error) {
      return res.status(500).json(error);
    }

    return res.status(200).json({
      message: "User deleted successfully"
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};