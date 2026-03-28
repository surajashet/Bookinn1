import supabase from "../config/supabaseClient.js";
import { generateOTP, sendVerificationEmail } from "../utils/emailService.js";

// Send verification OTP
export const sendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log("📧 sendVerificationOTP called for:", email);
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    
    // Check if user exists
    const { data: user, error } = await supabase
      .from("Users")
      .select("user_id, username, email_verified")
      .eq("email", email)
      .single();
    
    if (error || !user) {
      console.log("❌ User not found:", email);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    if (user.email_verified) {
      console.log("✅ Email already verified:", email);
      return res.status(400).json({
        success: false,
        message: "Email already verified"
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes from now
    
    console.log("🔑 Generated OTP:", otp);
    console.log("⏰ Current local time:", new Date().toString());
    console.log("⏰ Expires at local:", expiresAt.toString());
    console.log("⏰ Expires at UTC:", expiresAt.toISOString());
    
    // Store OTP in database
    const { error: updateError } = await supabase
      .from("Users")
      .update({
        verification_token: otp,
        token_expires: expiresAt.toISOString()
      })
      .eq("user_id", user.user_id);
    
    if (updateError) {
      console.error("❌ Database update error:", updateError);
      throw updateError;
    }
    
    console.log("✅ OTP stored in database");
    
    // Send email
    const emailSent = await sendVerificationEmail(email, user.username, otp);
    
    if (emailSent) {
      console.log("✅ Verification email sent to:", email);
      res.json({
        success: true,
        message: "Verification code sent to your email"
      });
    } else {
      console.log("❌ Failed to send email to:", email);
      res.status(500).json({
        success: false,
        message: "Failed to send email. Please try again."
      });
    }
  } catch (error) {
    console.error("❌ Send OTP error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log("🔐 Verify OTP request:", { email, otp });
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }
    
    const { data: user, error } = await supabase
      .from("Users")
      .select("user_id, verification_token, token_expires, email_verified")
      .eq("email", email)
      .single();
    
    if (error || !user) {
      console.log("❌ User not found:", email);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    console.log("👤 User found:", { 
      user_id: user.user_id, 
      token: user.verification_token,
      expires: user.token_expires,
      verified: user.email_verified 
    });
    
    if (user.email_verified) {
      console.log("✅ Email already verified:", email);
      return res.status(400).json({
        success: false,
        message: "Email already verified"
      });
    }
    
    // Compare dates correctly - parse the stored ISO string
    const now = new Date();
    const expiresAt = new Date(user.token_expires);
    
    console.log("⏰ Time comparison:", {
      now: now.toString(),
      nowISO: now.toISOString(),
      expiresAt: expiresAt.toString(),
      expiresAtISO: expiresAt.toISOString(),
      isExpired: now > expiresAt
    });
    
    if (now > expiresAt) {
      console.log("❌ OTP expired");
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one."
      });
    }
    
    // Verify OTP
    if (user.verification_token !== otp) {
      console.log("❌ OTP mismatch:", { expected: user.verification_token, received: otp });
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }
    
    console.log("✅ OTP verified successfully");
    
    // Mark email as verified
    const { error: updateError } = await supabase
      .from("Users")
      .update({
        email_verified: true,
        verification_token: null,
        token_expires: null
      })
      .eq("user_id", user.user_id);
    
    if (updateError) {
      console.error("❌ Database update error:", updateError);
      throw updateError;
    }
    
    console.log("✅ Email marked as verified for:", email);
    
    res.json({
      success: true,
      message: "Email verified successfully! You can now login."
    });
  } catch (error) {
    console.error("❌ Verify OTP error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};