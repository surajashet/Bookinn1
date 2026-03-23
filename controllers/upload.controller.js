import supabase from "../config/supabaseClient.js";

export const uploadRoomImage = async (req, res) => {
  try {
    console.log("Upload request received");
    const { file, room_id } = req.body;
    
    console.log("Room ID:", room_id);
    console.log("File received:", file ? "Yes" : "No");
    
    if (!file || !room_id) {
      return res.status(400).json({
        success: false,
        error: "File and room_id are required"
      });
    }
    
    // Convert base64 to buffer
    const base64Data = file.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const filename = `room_${room_id}_${Date.now()}.jpg`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('room-images')
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('room-images')
      .getPublicUrl(filename);
    
    // Update room with image URL
    const { error: updateError } = await supabase
      .from("rooms")
      .update({ image_url: publicUrl })
      .eq("room_id", room_id);
    
    if (updateError) throw updateError;
    
    res.json({
      success: true,
      message: "Image uploaded successfully",
      image_url: publicUrl
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};