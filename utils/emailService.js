import nodemailer from 'nodemailer';

// Lazy load transporter - only create when needed
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    console.log("📧 Creating email transporter...");
    console.log("📧 EMAIL_USER:", process.env.EMAIL_USER);
    console.log("📧 EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
    
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
};

// Generate OTP (6-digit code)
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send Verification Email
export const sendVerificationEmail = async (email, username, otp) => {
  console.log("📧 sendVerificationEmail called to:", email);
  
  try {
    const mailOptions = {
      from: `"BookInn" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - BookInn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E4DDD4; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4A7C72; font-size: 28px;">BOOKINN</h1>
            <p style="color: #6B6560;">Refined Hospitality</p>
          </div>
          
          <h2>Welcome to BookInn, ${username}! 🎉</h2>
          <p>Please verify your email address to complete your registration.</p>
          
          <div style="background: #FDFCFB; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <p style="font-size: 14px; margin-bottom: 10px;">Your verification code is:</p>
            <h1 style="color: #4A7C72; font-size: 48px; letter-spacing: 8px; margin: 10px 0;">${otp}</h1>
            <p style="font-size: 12px; color: #6B6560;">This code expires in 10 minutes</p>
          </div>
          
          <p>Enter this code on the verification page to activate your account.</p>
          <p style="color: #6B6560; font-size: 12px; margin-top: 30px;">If you didn't create an account, please ignore this email.</p>
        </div>
      `
    };
    
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return false;
  }
};

// Send Booking Confirmation Email
export const sendBookingConfirmation = async (booking, user, room) => {
  console.log("📧 sendBookingConfirmation called");
  console.log("📧 Recipient:", user?.email);
  console.log("📧 EMAIL_USER:", process.env.EMAIL_USER);
  console.log("📧 EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
  
  try {
    const nights = Math.ceil((new Date(booking.check_out_date) - new Date(booking.check_in_date)) / (1000 * 60 * 60 * 24));
    
    const mailOptions = {
      from: `"BookInn" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Booking Confirmation - Room ${room.room_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E4DDD4; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4A7C72; font-size: 28px;">BOOKINN</h1>
            <p style="color: #6B6560;">Refined Hospitality</p>
          </div>
          
          <h2>Booking Confirmed! 🎉</h2>
          <p>Dear <strong>${user.username}</strong>,</p>
          <p>Your booking has been successfully confirmed. Here are your booking details:</p>
          
          <div style="background: #FDFCFB; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="color: #4A7C72; margin-top: 0;">Booking Details</h3>
            <p><strong>Booking ID:</strong> ${booking.booking_id}</p>
            <p><strong>Room:</strong> ${room.room_number} (${room.room_type})</p>
            <p><strong>Check-in:</strong> ${new Date(booking.check_in_date).toLocaleDateString('en-IN')}</p>
            <p><strong>Check-out:</strong> ${new Date(booking.check_out_date).toLocaleDateString('en-IN')}</p>
            <p><strong>Nights:</strong> ${nights}</p>
            <p><strong>Guests:</strong> ${booking.guests || 1}</p>
            <p><strong>Total Amount:</strong> ₹${booking.total_price?.toLocaleString('en-IN') || 0}</p>
          </div>
          
          <div style="background: #FDFCFB; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="color: #4A7C72; margin-top: 0;">Important Information</h3>
            <p>✅ Check-in time: 2:00 PM</p>
            <p>✅ Check-out time: 11:00 AM</p>
            <p>✅ Free cancellation up to 24 hours before check-in</p>
            <p>✅ Contact us: +91 1234567890</p>
          </div>
          
          <p>We look forward to welcoming you!</p>
          <p style="color: #6B6560; font-size: 12px; margin-top: 30px;">© 2026 BookInn. All rights reserved.</p>
        </div>
      `
    };
    
    console.log("📧 Sending email...");
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Booking confirmation sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error details:', {
      code: error.code,
      message: error.message,
      command: error.command
    });
    return false;
  }
};

// Send Booking Cancellation Email
export const sendBookingCancellation = async (user, booking, room) => {
  console.log("📧 sendBookingCancellation called");
  
  try {
    const mailOptions = {
      from: `"BookInn" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Booking Cancellation - Room ${room.room_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E4DDD4; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4A7C72;">BOOKINN</h1>
          </div>
          
          <h2>Booking Cancelled</h2>
          <p>Dear <strong>${user.username}</strong>,</p>
          <p>Your booking has been cancelled as requested.</p>
          
          <div style="background: #FDFCFB; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${booking.booking_id}</p>
            <p><strong>Room:</strong> ${room.room_number}</p>
            <p><strong>Check-in:</strong> ${new Date(booking.check_in_date).toLocaleDateString('en-IN')}</p>
            <p><strong>Check-out:</strong> ${new Date(booking.check_out_date).toLocaleDateString('en-IN')}</p>
          </div>
          
          <p>We hope to see you again soon!</p>
        </div>
      `
    };
    
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Cancellation email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return false;
  }
};