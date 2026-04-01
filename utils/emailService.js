import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';

// ── Transporter ───────────────────────────────────────────────────────────────
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

// ── Generate OTP ──────────────────────────────────────────────────────────────
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ── Generate Invoice HTML ─────────────────────────────────────────────────────
const generateInvoiceHTML = (booking, user, room, invoiceNumber) => {
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(booking.check_out_date) - new Date(booking.check_in_date)) /
        (1000 * 60 * 60 * 24)
    )
  );

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

  const INR = (n) =>
    Number(n).toLocaleString('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 2
    });

  const base_amount  = room.base_price * nights;
  const cgst_amount  = parseFloat((base_amount * 0.06).toFixed(2));
  const sgst_amount  = parseFloat((base_amount * 0.06).toFixed(2));
  const total_tax    = cgst_amount + sgst_amount;
  const total_amount = base_amount + total_tax;
  const serviceFee   = 150;
  const grand_total  = total_amount + serviceFee;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: #F7F3EE;
      color: #1E1C1A;
      padding: 40px;
    }
    .card {
      background: #FDFCFB;
      border-radius: 16px;
      overflow: hidden;
      max-width: 680px;
      margin: 0 auto;
      border: 1px solid #E4DDD4;
    }
    .header {
      background: #1E1C1A;
      padding: 32px 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-brand { color: #fff; }
    .header-brand .eyebrow {
      font-family: Arial, sans-serif;
      font-size: 8px;
      color: rgba(255,255,255,0.4);
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 8px;
    }
    .header-brand .brand-name {
      font-size: 28px;
      font-style: italic;
      color: #fff;
      line-height: 1;
      margin-bottom: 8px;
    }
    .header-brand .contact {
      font-family: Arial, sans-serif;
      font-size: 10px;
      color: rgba(255,255,255,0.3);
    }
    .header-inv { text-align: right; }
    .header-inv .inv-label {
      font-family: Arial, sans-serif;
      font-size: 8px;
      color: rgba(255,255,255,0.4);
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 6px;
    }
    .header-inv .inv-number {
      font-size: 24px;
      font-style: italic;
      color: #A8CEC8;
      line-height: 1;
      margin-bottom: 6px;
    }
    .header-inv .inv-date {
      font-family: Arial, sans-serif;
      font-size: 10px;
      color: rgba(255,255,255,0.3);
      margin-bottom: 10px;
    }
    .badge {
      display: inline-block;
      background: #e8f2ef;
      color: #2d6b5e;
      padding: 3px 12px;
      border-radius: 999px;
      font-family: Arial, sans-serif;
      font-size: 8px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .stripe {
      height: 3px;
      background: linear-gradient(90deg, #4A7C72, #6A9E94, #E4DDD4);
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-bottom: 1px solid #EDE7DE;
    }
    .info-cell {
      padding: 28px 40px;
    }
    .info-cell:first-child {
      border-right: 1px solid #EDE7DE;
    }
    .section-label {
      font-family: Arial, sans-serif;
      font-size: 8px;
      color: #4A7C72;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 12px;
    }
    .guest-name {
      font-size: 18px;
      font-style: italic;
      color: #1E1C1A;
      margin-bottom: 6px;
    }
    .guest-email {
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #6B6560;
      line-height: 1.8;
    }
    .stay-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 0;
    }
    .stay-item .label {
      font-family: Arial, sans-serif;
      font-size: 8px;
      color: #A09890;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 3px;
    }
    .stay-item .value {
      font-size: 14px;
      color: #1E1C1A;
    }
    .charges { padding: 32px 40px; }
    .col-headers {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr 1fr;
      padding: 8px 0;
      border-bottom: 1px solid #EDE7DE;
      margin-bottom: 4px;
    }
    .col-h {
      font-family: Arial, sans-serif;
      font-size: 8px;
      color: #A09890;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .col-h.right { text-align: right; }
    .line-item {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr 1fr;
      padding: 14px 0;
      border-bottom: 1px solid #F0EBE4;
      align-items: center;
    }
    .line-item:last-child { border-bottom: none; }
    .item-desc { font-size: 13px; font-style: italic; color: #1E1C1A; margin-bottom: 2px; }
    .item-sub  { font-family: Arial, sans-serif; font-size: 10px; color: #A09890; }
    .item-val  { font-family: Arial, sans-serif; font-size: 11px; color: #6B6560; text-align: right; }
    .item-amount { font-size: 13px; font-style: italic; color: #1E1C1A; text-align: right; }
    .total-band {
      margin: 0 40px 32px;
      background: #EBF3F1;
      border-radius: 12px;
      padding: 20px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-label {
      font-family: Arial, sans-serif;
      font-size: 8px;
      color: #4A7C72;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 4px;
    }
    .total-sub {
      font-family: Arial, sans-serif;
      font-size: 10px;
      color: #4A7C72;
    }
    .total-amount {
      font-size: 28px;
      font-style: italic;
      color: #4A7C72;
    }
    .divider { height: 1px; background: #EDE7DE; margin: 0 40px; }
    .policies {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 28px 40px;
    }
    .policy-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #F0EBE4;
      font-family: Arial, sans-serif;
      font-size: 11px;
    }
    .policy-key   { color: #A09890; }
    .policy-value { color: #1E1C1A; }
    .tax-breakdown {
      background: #EDE7DE;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 8px;
    }
    .tax-row {
      display: flex;
      justify-content: space-between;
      font-family: Arial, sans-serif;
      font-size: 11px;
      padding: 3px 0;
    }
    .tax-key   { color: #A09890; }
    .tax-value { color: #1E1C1A; }
    .footer {
      background: #EDE7DE;
      padding: 16px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-brand { font-size: 14px; font-style: italic; color: #6B6560; }
    .footer-copy  { font-family: Arial, sans-serif; font-size: 9px; color: #A09890; }
    .footer-inv   { font-family: 'Courier New', monospace; font-size: 9px; color: #A09890; }
  </style>
</head>
<body>
  <div class="card">

    <!-- header -->
    <div class="header">
      <div class="header-brand">
        <div class="eyebrow">Refined Hospitality</div>
        <div class="brand-name">BookInn</div>
        <div class="contact">bookinn.admin@gmail.com &nbsp;·&nbsp; +91 1234567890</div>
      </div>
      <div class="header-inv">
        <div class="inv-label">Invoice</div>
        <div class="inv-number">#${String(booking.booking_id).padStart(4, '0')}</div>
        <div class="inv-date">Issued ${fmtDate(booking.created_at)}</div>
        <span class="badge">Confirmed</span>
      </div>
    </div>

    <!-- teal stripe -->
    <div class="stripe"></div>

    <!-- billed to + stay details -->
    <div class="info-grid">
      <div class="info-cell">
        <div class="section-label">Billed To</div>
        <div class="guest-name">${user.username}</div>
        <div class="guest-email">${user.email}</div>
      </div>
      <div class="info-cell">
        <div class="section-label">Stay Details</div>
        <div class="stay-grid">
          <div class="stay-item">
            <div class="label">Room</div>
            <div class="value">${room.room_number} · ${room.room_type}</div>
          </div>
          <div class="stay-item">
            <div class="label">Guests</div>
            <div class="value">${booking.guests} persons</div>
          </div>
          <div class="stay-item">
            <div class="label">Check-in</div>
            <div class="value">${fmtDate(booking.check_in_date)}</div>
          </div>
          <div class="stay-item">
            <div class="label">Check-out</div>
            <div class="value">${fmtDate(booking.check_out_date)}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- charges -->
    <div class="charges">
      <div class="section-label" style="margin-bottom: 16px;">Charges</div>
      <div class="col-headers">
        <div class="col-h">Description</div>
        <div class="col-h right">Rate</div>
        <div class="col-h right">Qty</div>
        <div class="col-h right">Amount</div>
      </div>

      <div class="line-item">
        <div>
          <div class="item-desc">Room ${room.room_number} — ${room.room_type}</div>
          <div class="item-sub">${fmtDate(booking.check_in_date)} → ${fmtDate(booking.check_out_date)}</div>
        </div>
        <div class="item-val">${INR(room.base_price)}</div>
        <div class="item-val">${nights} night${nights > 1 ? 's' : ''}</div>
        <div class="item-amount">${INR(base_amount)}</div>
      </div>

      <div class="line-item">
        <div>
          <div class="item-desc">CGST</div>
          <div class="item-sub">6% on base amount</div>
        </div>
        <div class="item-val">6%</div>
        <div class="item-val">—</div>
        <div class="item-amount">${INR(cgst_amount)}</div>
      </div>

      <div class="line-item">
        <div>
          <div class="item-desc">SGST</div>
          <div class="item-sub">6% on base amount</div>
        </div>
        <div class="item-val">6%</div>
        <div class="item-val">—</div>
        <div class="item-amount">${INR(sgst_amount)}</div>
      </div>

      <div class="line-item">
        <div>
          <div class="item-desc">Service Fee</div>
          <div class="item-sub">Platform & amenity charge</div>
        </div>
        <div class="item-val">—</div>
        <div class="item-val">—</div>
        <div class="item-amount">${INR(serviceFee)}</div>
      </div>
    </div>

    <!-- total -->
    <div class="total-band">
      <div>
        <div class="total-label">Total Due</div>
        <div class="total-sub">Room + taxes + service fee</div>
      </div>
      <div class="total-amount">${INR(grand_total)}</div>
    </div>

    <div class="divider"></div>

    <!-- policies + tax -->
    <div class="policies">
      <div>
        <div class="section-label" style="margin-bottom: 12px;">Important Information</div>
        ${[
          ['Check-in',     '2:00 PM'],
          ['Check-out',    '11:00 AM'],
          ['Cancellation', 'Free up to 24 hrs'],
          ['Support',      '+91 1234567890'],
        ].map(([k, v]) => `
          <div class="policy-row">
            <span class="policy-key">${k}</span>
            <span class="policy-value">${v}</span>
          </div>
        `).join('')}
      </div>
      <div>
        <div class="section-label" style="margin-bottom: 12px;">Tax Summary</div>
        <div class="tax-breakdown">
          ${[
            ['Base Amount',  INR(base_amount)],
            ['CGST (6%)',    INR(cgst_amount)],
            ['SGST (6%)',    INR(sgst_amount)],
            ['Total Tax',    INR(total_tax)],
            ['Service Fee',  INR(serviceFee)],
          ].map(([k, v]) => `
            <div class="tax-row">
              <span class="tax-key">${k}</span>
              <span class="tax-value">${v}</span>
            </div>
          `).join('')}
        </div>
        <div style="background: #EBF3F1; border-radius: 10px; padding: 12px 16px;">
          <div class="tax-row">
            <span style="color: #4A7C72; font-family: Arial; font-size: 11px; font-weight: bold;">Grand Total</span>
            <span style="color: #4A7C72; font-size: 14px; font-style: italic;">${INR(grand_total)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- footer -->
    <div class="footer">
      <div class="footer-brand">BookInn</div>
      <div class="footer-copy">© 2026 BookInn. All rights reserved.</div>
      <div class="footer-inv">INV-${String(booking.booking_id).padStart(4, '0')}-${new Date(booking.created_at).getFullYear()}</div>
    </div>

  </div>
</body>
</html>
  `;
};

// ── Convert HTML → PDF Buffer ─────────────────────────────────────────────────
const generateInvoicePDF = async (htmlContent) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    return pdf;
  } finally {
    if (browser) await browser.close();
  }
};

// ── Send Verification Email ───────────────────────────────────────────────────
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
    console.error('❌ Verification email error:', error.message);
    return false;
  }
};

// ── Send Booking Confirmation Email (with Invoice PDF attached) ───────────────
export const sendBookingConfirmation = async (booking, user, room) => {
  console.log("📧 sendBookingConfirmation called for:", user?.email);
  try {
    const nights = Math.max(
      1,
      Math.ceil(
        (new Date(booking.check_out_date) - new Date(booking.check_in_date)) /
          (1000 * 60 * 60 * 24)
      )
    );

    const invoiceNumber = `INV-${String(booking.booking_id).padStart(4, '0')}-${new Date(booking.created_at).getFullYear()}`;

    // Generate invoice PDF
    console.log("🧾 Generating invoice PDF...");
    let pdfBuffer = null;
    try {
      const invoiceHTML = generateInvoiceHTML(booking, user, room, invoiceNumber);
      pdfBuffer = await generateInvoicePDF(invoiceHTML);
      console.log("✅ Invoice PDF generated");
    } catch (pdfErr) {
      console.error("⚠️ PDF generation failed (email will send without attachment):", pdfErr.message);
    }

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

          <h2 style="color: #1E1C1A;">Booking Confirmed! 🎉</h2>
          <p>Dear <strong>${user.username}</strong>,</p>
          <p>Your booking has been successfully confirmed. Here are your booking details:</p>

          <div style="background: #FDFCFB; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #E4DDD4;">
            <h3 style="color: #4A7C72; margin-top: 0;">Booking Details</h3>
            <p><strong>Booking ID:</strong> ${booking.booking_id}</p>
            <p><strong>Room:</strong> ${room.room_number} (${room.room_type})</p>
            <p><strong>Check-in:</strong> ${new Date(booking.check_in_date).toLocaleDateString('en-IN')}</p>
            <p><strong>Check-out:</strong> ${new Date(booking.check_out_date).toLocaleDateString('en-IN')}</p>
            <p><strong>Nights:</strong> ${nights}</p>
            <p><strong>Guests:</strong> ${booking.guests || 1}</p>
            <p><strong>Total Amount:</strong> ₹${booking.total_price?.toLocaleString('en-IN') || 0}</p>
          </div>

          <div style="background: #FDFCFB; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #E4DDD4;">
            <h3 style="color: #4A7C72; margin-top: 0;">Important Information</h3>
            <p>✅ Check-in time: 2:00 PM</p>
            <p>✅ Check-out time: 11:00 AM</p>
            <p>✅ Free cancellation up to 24 hours before check-in</p>
            <p>✅ Contact us: +91 1234567890</p>
          </div>

          <div style="background: #EBF3F1; padding: 16px 20px; border-radius: 12px; margin: 20px 0;">
            <p style="color: #4A7C72; margin: 0; font-size: 13px;">
              📎 Your invoice <strong>${invoiceNumber}</strong> is attached to this email as a PDF.
            </p>
          </div>

          <p>We look forward to welcoming you!</p>
          <p style="color: #6B6560; font-size: 12px; margin-top: 30px;">© 2026 BookInn. All rights reserved.</p>
        </div>
      `,
      // Attach PDF if generated successfully
      attachments: pdfBuffer
        ? [{
            filename: `${invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        : []
    };

    const t = getTransporter();
    await t.sendMail(mailOptions);
    console.log(`✅ Booking confirmation + invoice sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Booking confirmation email error:', {
      code: error.code,
      message: error.message,
      command: error.command
    });
    return false;
  }
};

// ── Send Booking Cancellation Email ──────────────────────────────────────────
export const sendBookingCancellation = async (user, booking, room) => {
  console.log("📧 sendBookingCancellation called for:", user?.email);
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
          <div style="background: #FDFCFB; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #E4DDD4;">
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
    console.error('❌ Cancellation email error:', error.message);
    return false;
  }
};