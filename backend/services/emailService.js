const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.emailEnabled = !!(
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    );

    if (this.emailEnabled) {
      const port = Number(process.env.EMAIL_PORT || 465);

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, // smtpout.secureserver.net
        port,
        secure: port === 465, // ✅ MUST true for 465
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false, // ✅ IMPORTANT for cloud deploy (Render)
        },
      });

      this.fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      this.fromName = process.env.EMAIL_FROM_NAME || "Growmore Parking";

      // ✅ Verify SMTP config on startup
      this.transporter.verify((err, success) => {
        if (err) {
          console.error("❌ Email SMTP Verify Failed:", err.message);
        } else {
          console.log("✅ Email SMTP Verified successfully");
        }
      });

      console.log("✓ Email Service initialized");
    } else {
      console.log("⚠ Email Service running in MOCK mode");
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.emailEnabled) {
      console.log("\n📧 MOCK EMAIL:");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${(text || html).substring(0, 120)}...`);
      console.log("─────────────────────────────\n");
      return { success: true, mock: true };
    }

    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Email Error:", error);
      return { success: false, error: error.message };
    }
  }

  async sendOTP(email, otp, customerName = "Customer") {
    const subject = "Your Growmore Verification OTP";
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hello ${customerName}!</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p><b>Valid for 10 minutes.</b> Do not share this code with anyone.</p>
      </body>
      </html>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendBookingConfirmation(email, customerName, bookingId, recallLink, vehicleNumber, venue) {
    const subject = `Booking Confirmed - ${bookingId}`;
    const html = `
      <h2>Hello ${customerName}!</h2>
      <p>Your booking is confirmed.</p>
      <p><b>Booking ID:</b> ${bookingId}</p>
      <p><b>Vehicle:</b> ${vehicleNumber}</p>
      ${venue ? `<p><b>Venue:</b> ${venue}</p>` : ""}
      <p><a href="${recallLink}">Access booking</a></p>
    `;
    return this.sendEmail(email, subject, html);
  }

  async sendRecallNotification(email, customerName, bookingId, estimatedTime) {
    const subject = `Your Car is On the Way - ${bookingId}`;
    const html = `
      <h2>Hello ${customerName}!</h2>
      <p>Your car is being brought to you.</p>
      <h3>ETA: ${estimatedTime} minutes</h3>
    `;
    return this.sendEmail(email, subject, html);
  }

  async sendArrivalNotification(email, customerName, bookingId, otp) {
    const subject = `Your Car Has Arrived! - ${bookingId}`;
    const html = `
      <h2>Hello ${customerName}!</h2>
      <p>Your car has arrived at the pickup point.</p>
      <p>Share this OTP with valet:</p>
      <h2 style="letter-spacing: 5px;">${otp}</h2>
    `;
    return this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();
