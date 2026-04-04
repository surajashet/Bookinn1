import supabase from "../config/supabaseClient.js";

export const uploadRoomImage = async (req, res) => {
  try {
    console.log("=== UPLOAD REQUEST STARTED ===");
    const { file, room_id } = req.body;
    
    console.log("Room ID:", room_id);
    console.log("File received:", file ? "Yes" : "No");
    console.log("File type:", typeof file);
    
    if (!file || !room_id) {
      return res.status(400).json({
        success: false,
        error: "File and room_id are required"
      });
    }
    
    // Check if it's a valid base64 string
    if (!file.includes(',')) {
      console.error("Invalid base64 format - missing comma");
      return res.status(400).json({
        success: false,
        error: "Invalid image format"
      });
    }
    
    // Convert base64 to buffer
    const base64Data = file.split(',')[1];
    if (!base64Data) {
      console.error("No base64 data after comma");
      return res.status(400).json({
        success: false,
        error: "No image data found"
      });
    }
    
    const buffer = Buffer.from(base64Data, 'base64');
    console.log("Buffer size:", buffer.length, "bytes");
    
    // Generate unique filename
    const filename = `room_${room_id}_${Date.now()}.jpg`;
    console.log("Filename:", filename);
    
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log("Available buckets:", buckets?.map(b => b.name));
    
    const bucketExists = buckets?.some(b => b.name === 'room-images');
    console.log("Bucket 'room-images' exists:", bucketExists);
    
    if (!bucketExists) {
      return res.status(500).json({
        success: false,
        error: "Storage bucket 'room-images' does not exist. Please create it in Supabase."
      });
    }
    
    // Upload to Supabase Storage
    console.log("Uploading to Supabase...");
    const { data, error } = await supabase.storage
      .from('room-images')
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({
        success: false,
        error: `Upload failed: ${error.message}`
      });
    }
    
    console.log("Upload successful:", data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('room-images')
      .getPublicUrl(filename);
    
    console.log("Public URL:", publicUrl);
    
    // Update room with image URL
    console.log("Updating room in database...");
    const { error: updateError } = await supabase
      .from("rooms")
      .update({ image_url: publicUrl })
      .eq("room_id", room_id);
    
    if (updateError) {
      console.error("Database update error:", updateError);
      return res.status(500).json({
        success: false,
        error: `Database update failed: ${updateError.message}`
      });
    }
    
    console.log("Room updated successfully!");
    console.log("=== UPLOAD COMPLETE ===");
    
    res.json({
      success: true,
      message: "Image uploaded successfully",
      image_url: publicUrl
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};