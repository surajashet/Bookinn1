import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

// Lazy load transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    console.log("📧 Creating email transporter...");
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

// ── Generate PDF invoice as a Buffer (in memory, no file on disk) ─────────────
const generateInvoicePDF = (booking, user, room, invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const nights = Math.max(1, Math.ceil(
      (new Date(booking.check_out_date) - new Date(booking.check_in_date)) / 86400000
    ));
    const roomCharge  = Number(booking.total_price) || 0;
    const taxes       = Math.round(roomCharge * 0.12);
    const serviceFee  = 150;
    const total       = roomCharge + taxes + serviceFee;

    const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const fmtINR = (n) => `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const teal   = '#4A7C72';
    const dark   = '#1E1C1A';
    const grey   = '#6B6560';
    const light  = '#F7F3EE';
    const W      = 595 - 100; // usable width (A4 minus margins)

    // ── Header background ──
    doc.rect(0, 0, 595, 110).fill('#1E1C1A');

    // BookInn name
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#ffffff')
       .text('BookInn', 50, 30);
    doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.5)')
       .text('Refined Hospitality', 50, 62);
    doc.fontSize(9).fillColor('rgba(255,255,255,0.4)')
       .text('bookinn.admin@gmail.com  ·  +91 1234567890', 50, 78);

    // Invoice number (top right)
    doc.font('Helvetica').fontSize(9).fillColor('rgba(255,255,255,0.5)')
       .text('INVOICE', 400, 30, { width: 145, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#A8CEC8')
       .text(`#${String(booking.booking_id).padStart(4, '0')}`, 400, 44, { width: 145, align: 'right' });
    doc.font('Helvetica').fontSize(9).fillColor('rgba(255,255,255,0.4)')
       .text(`Issued: ${fmtDate(booking.created_at || new Date())}`, 400, 72, { width: 145, align: 'right' });

    // Status badge area
    const statusText = (booking.booking_status || 'confirmed').toUpperCase().replace('_', ' ');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#A8CEC8')
       .text(statusText, 400, 88, { width: 145, align: 'right' });

    // ── Teal accent stripe ──
    doc.rect(0, 110, 595, 4).fill(teal);

    let y = 130;

    // ── Billed To + Stay Details (2 columns) ──
    doc.font('Helvetica').fontSize(8).fillColor(teal)
       .text('BILLED TO', 50, y, { characterSpacing: 1.5 });
    doc.font('Helvetica').fontSize(8).fillColor(teal)
       .text('STAY DETAILS', 320, y, { characterSpacing: 1.5 });

    y += 16;
    doc.font('Helvetica-Bold').fontSize(14).fillColor(dark)
       .text(user.username || user.name || 'Guest', 50, y);
    doc.font('Helvetica').fontSize(10).fillColor(grey)
       .text(user.email || '—', 50, y + 18);

    // Stay details grid
    const stayItems = [
      ['Room',      `${room.room_number} · ${room.room_type}`],
      ['Guests',    `${booking.guests || 1} person(s)`],
      ['Check-in',  fmtDate(booking.check_in_date)],
      ['Check-out', fmtDate(booking.check_out_date)],
      ['Nights',    `${nights}`],
    ];
    let sy = y;
    stayItems.forEach(([label, val]) => {
      doc.font('Helvetica').fontSize(8).fillColor(grey)
         .text(label.toUpperCase(), 320, sy, { characterSpacing: 1 });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(dark)
         .text(val, 420, sy);
      sy += 18;
    });

    y = Math.max(y + 50, sy + 8);

    // Divider
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#E4DDD4').lineWidth(1).stroke();
    y += 20;

    // ── Charges table ──
    doc.font('Helvetica').fontSize(8).fillColor(teal)
       .text('CHARGES', 50, y, { characterSpacing: 1.5 });
    y += 16;

    // Table header
    doc.rect(50, y, W, 24).fill('#EDE7DE');
    doc.font('Helvetica').fontSize(8).fillColor(grey);
    doc.text('DESCRIPTION', 58, y + 8);
    doc.text('RATE', 330, y + 8, { width: 70, align: 'right' });
    doc.text('QTY', 408, y + 8, { width: 60, align: 'right' });
    doc.text('AMOUNT', 476, y + 8, { width: 65, align: 'right' });
    y += 28;

    const rows = [
      {
        desc: `Room ${room.room_number} — ${room.room_type}`,
        sub:  `${fmtDate(booking.check_in_date)} → ${fmtDate(booking.check_out_date)}`,
        rate: fmtINR(roomCharge / nights),
        qty:  `${nights} night${nights > 1 ? 's' : ''}`,
        amt:  fmtINR(roomCharge),
      },
      {
        desc: 'GST & Taxes',
        sub:  '12% on room charge',
        rate: '12%',
        qty:  '—',
        amt:  fmtINR(taxes),
      },
      {
        desc: 'Service Fee',
        sub:  'Platform & amenity charge',
        rate: '—',
        qty:  '—',
        amt:  fmtINR(serviceFee),
      },
    ];

    rows.forEach((row, i) => {
      if (i % 2 === 0) doc.rect(50, y - 4, W, 36).fill('#FDFCFB');
      doc.font('Helvetica-Bold').fontSize(10).fillColor(dark).text(row.desc, 58, y);
      doc.font('Helvetica').fontSize(8).fillColor(grey).text(row.sub, 58, y + 13);
      doc.font('Helvetica').fontSize(10).fillColor(grey)
         .text(row.rate, 330, y + 4, { width: 70, align: 'right' });
      doc.font('Helvetica').fontSize(10).fillColor(grey)
         .text(row.qty, 408, y + 4, { width: 60, align: 'right' });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(dark)
         .text(row.amt, 476, y + 4, { width: 65, align: 'right' });
      y += 40;
    });

    y += 8;

    // ── Total box ──
    doc.rect(50, y, W, 52).fill('#EBF3F1');
    doc.font('Helvetica').fontSize(9).fillColor(teal)
       .text('TOTAL ' + (booking.booking_status === 'pending' ? 'DUE' : 'PAID'), 58, y + 10, { characterSpacing: 1.2 });
    doc.font('Helvetica').fontSize(9).fillColor(teal)
       .text('Room charge + taxes + service fee', 58, y + 24);
    doc.font('Helvetica-Bold').fontSize(22).fillColor(teal)
       .text(fmtINR(total), 320, y + 12, { width: 215, align: 'right' });
    y += 66;

    // ── Payment receipt section ──
    if (invoice) {
      y += 10;
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#E4DDD4').lineWidth(1).stroke();
      y += 16;

      doc.font('Helvetica').fontSize(8).fillColor(teal)
         .text('PAYMENT RECEIPT', 50, y, { characterSpacing: 1.5 });
      y += 16;

      doc.rect(50, y, W, 28).fill('#EDE7DE');
      const payItems = [
        ['Invoice No.',    invoice.invoice_number || `INV-${String(booking.booking_id).padStart(4,'0')}-2026`],
        ['Method',         invoice.payment_methods || 'Razorpay'],
        ['Status',         (invoice.payment_state || 'paid').toUpperCase()],
        ['Amount Paid',    fmtINR(invoice.total_amount || total)],
      ];

      let px = 58;
      const colW = W / payItems.length;
      payItems.forEach(([label, val]) => {
        doc.font('Helvetica').fontSize(7).fillColor(grey)
           .text(label.toUpperCase(), px, y + 4, { width: colW - 10 });
        doc.font('Helvetica-Bold').fontSize(9).fillColor(dark)
           .text(val, px, y + 14, { width: colW - 10 });
        px += colW;
      });
      y += 38;
    }

    // ── Policies + footer ──
    y += 10;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#E4DDD4').lineWidth(1).stroke();
    y += 16;

    const policies = [
      ['Check-in',     '2:00 PM'],
      ['Check-out',    '11:00 AM'],
      ['Cancellation', 'Free up to 24 hrs before'],
      ['Support',      '+91 1234567890'],
    ];

    doc.font('Helvetica').fontSize(8).fillColor(teal)
       .text('IMPORTANT INFORMATION', 50, y, { characterSpacing: 1.5 });
    y += 14;
    policies.forEach(([k, v]) => {
      doc.font('Helvetica').fontSize(9).fillColor(grey).text(`${k}:`, 50, y, { width: 100 });
      doc.font('Helvetica').fontSize(9).fillColor(dark).text(v, 160, y);
      y += 14;
    });

    y += 16;
    // Footer strip
    doc.rect(0, y, 595, 36).fill('#EDE7DE');
    doc.font('Helvetica').fontSize(9).fillColor(grey)
       .text('BookInn', 50, y + 12);
    doc.font('Helvetica').fontSize(8).fillColor(grey)
       .text('© 2026 BookInn. All rights reserved.', 200, y + 13, { align: 'center', width: 195 });
    doc.font('Helvetica').fontSize(8).fillColor(grey)
       .text(`-${String(booking.booking_id).padStart(4,'0')}-${new Date().getFullYear()}`, 430, y + 13, { width: 110, align: 'right' });

    doc.end();
  });
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
    const t = getTransporter();
    await t.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return false;
  }
};

// ── Send Booking Confirmation Email with PDF invoice attached ─────────────────
export const sendBookingConfirmation = async (booking, user, room, invoice = null) => {
  console.log("📧 sendBookingConfirmation called");
  console.log("📧 Recipient:", user?.email);

  try {
    const nights = Math.ceil(
      (new Date(booking.check_out_date) - new Date(booking.check_in_date)) / (1000 * 60 * 60 * 24)
    );
    const roomCharge = Number(booking.total_price) || 0;
    const taxes      = Math.round(roomCharge * 0.12);
    const serviceFee = 150;
    const total      = roomCharge + taxes + serviceFee;

    // Generate PDF in memory
    console.log("📄 Generating PDF invoice...");
    const pdfBuffer = await generateInvoicePDF(booking, user, room, invoice);
    console.log("📄 PDF generated, size:", pdfBuffer.length, "bytes");

    const invoiceNumber = invoice?.invoice_number
      || `INV-${String(booking.booking_id).padStart(4, '0')}-${new Date().getFullYear()}`;

    const mailOptions = {
      from: `"BookInn" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Booking Confirmed — Room ${room.room_number} | ${invoiceNumber}`,

      // ── HTML email body ──
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F7F3EE;">

          <!-- Header -->
          <div style="background: #1E1C1A; padding: 32px 40px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">BookInn</h1>
            <p style="color: rgba(255,255,255,0.45); margin: 4px 0 0; font-size: 12px; letter-spacing: 2px;">REFINED HOSPITALITY</p>
          </div>
          <div style="height: 4px; background: linear-gradient(90deg, #4A7C72, #6A9E94, #E4DDD4);"></div>

          <!-- Body -->
          <div style="padding: 32px 40px; background: #FDFCFB;">
            <h2 style="color: #1E1C1A; margin-top: 0;">Booking Confirmed! 🎉</h2>
            <p style="color: #6B6560;">Dear <strong style="color: #1E1C1A;">${user.username}</strong>,</p>
            <p style="color: #6B6560;">Your booking has been confirmed and payment received. Your invoice PDF is attached to this email.</p>

            <!-- Booking details card -->
            <div style="background: #EBF3F1; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h3 style="color: #4A7C72; margin: 0 0 16px; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">Booking Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 6px 0; color: #A09890; width: 140px;">Booking ID</td><td style="color: #1E1C1A; font-weight: bold;">#${String(booking.booking_id).padStart(4,'0')}</td></tr>
                <tr><td style="padding: 6px 0; color: #A09890;">Room</td><td style="color: #1E1C1A;">${room.room_number} — ${room.room_type}</td></tr>
                <tr><td style="padding: 6px 0; color: #A09890;">Check-in</td><td style="color: #1E1C1A;">${new Date(booking.check_in_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>
                <tr><td style="padding: 6px 0; color: #A09890;">Check-out</td><td style="color: #1E1C1A;">${new Date(booking.check_out_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>
                <tr><td style="padding: 6px 0; color: #A09890;">Nights</td><td style="color: #1E1C1A;">${nights}</td></tr>
                <tr><td style="padding: 6px 0; color: #A09890;">Guests</td><td style="color: #1E1C1A;">${booking.guests || 1}</td></tr>
              </table>
            </div>

            <!-- Payment summary -->
            <div style="background: #F7F3EE; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #E4DDD4;">
              <h3 style="color: #4A7C72; margin: 0 0 16px; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">Payment Summary</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 5px 0; color: #6B6560;">Room charge</td><td style="text-align: right; color: #1E1C1A;">₹${roomCharge.toLocaleString('en-IN')}</td></tr>
                <tr><td style="padding: 5px 0; color: #6B6560;">GST (12%) + Service fee</td><td style="text-align: right; color: #6B6560;">₹${(taxes + serviceFee).toLocaleString('en-IN')}</td></tr>
                <tr style="border-top: 1px solid #E4DDD4;">
                  <td style="padding: 10px 0 5px; font-weight: bold; color: #1E1C1A;">Total Paid</td>
                  <td style="text-align: right; font-weight: bold; color: #4A7C72; font-size: 18px;">₹${total.toLocaleString('en-IN')}</td>
                </tr>
              </table>
              ${invoice ? `<p style="color: #A09890; font-size: 12px; margin: 12px 0 0;">Invoice: ${invoiceNumber} · Paid via Razorpay</p>` : ''}
            </div>

            <!-- Important info -->
            <div style="background: #FDFCFB; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #E4DDD4;">
              <h3 style="color: #4A7C72; margin: 0 0 12px; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">Important Information</h3>
              <p style="margin: 6px 0; font-size: 14px; color: #6B6560;">✅ Check-in time: <strong style="color: #1E1C1A;">2:00 PM</strong></p>
              <p style="margin: 6px 0; font-size: 14px; color: #6B6560;">✅ Check-out time: <strong style="color: #1E1C1A;">11:00 AM</strong></p>
              <p style="margin: 6px 0; font-size: 14px; color: #6B6560;">✅ Free cancellation up to 24 hours before check-in</p>
              <p style="margin: 6px 0; font-size: 14px; color: #6B6560;">✅ Contact us: <strong style="color: #1E1C1A;">+91 1234567890</strong></p>
            </div>

            <!-- PDF note -->
            <div style="background: #EBF3F1; border-radius: 8px; padding: 14px 18px; margin: 16px 0; display: flex; align-items: center;">
              <p style="margin: 0; font-size: 13px; color: #4A7C72;">📎 <strong>Your invoice PDF is attached</strong> — save it for your records.</p>
            </div>

            <p style="color: #6B6560; margin-top: 24px;">We look forward to welcoming you, <strong>${user.username?.split(' ')[0] || 'Guest'}</strong>!</p>
          </div>

          <!-- Footer -->
          <div style="background: #EDE7DE; padding: 16px 40px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #A09890; font-size: 11px; margin: 0;">© 2026 BookInn. All rights reserved.</p>
          </div>
        </div>
      `,

      // ── PDF attachment ──
      attachments: [
        {
          filename: `BookInn-Invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }
      ]
    };

    console.log("📧 Sending confirmation email with PDF attachment...");
    const t = getTransporter();
    await t.sendMail(mailOptions);
    console.log(`✅ Booking confirmation + PDF sent to ${user.email}`);
    return true;

  } catch (error) {
    console.error('❌ Email send error:', {
      code: error.code,
      message: error.message,
      command: error.command
    });
    return false;
  }
};

// ── Send Booking Cancellation Email ──────────────────────────────────────────
export const sendBookingCancellation = async (user, booking, room) => {
  console.log("📧 sendBookingCancellation called");
  try {
    const mailOptions = {
      from: `"BookInn" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Booking Cancelled — Room ${room.room_number}`,
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
          <p style="color: #6B6560; font-size: 12px; margin-top: 30px;">© 2026 BookInn. All rights reserved.</p>
        </div>
      `
    };
    const t = getTransporter();
    await t.sendMail(mailOptions);
    console.log(`✅ Cancellation email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return false;
  }
};