const { Resend } = require("resend");

class EmailService {
  constructor() {
    this.emailEnabled = !!process.env.RESEND_API_KEY;

    this.fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
    this.fromName = process.env.EMAIL_FROM_NAME || "Growmore Parking";

    if (this.emailEnabled) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      console.log("✅ Email Service initialized (Resend API)");
    } else {
      console.log("⚠ Email Service running in MOCK mode (RESEND_API_KEY missing)");
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.emailEnabled) {
      console.log("\n📧 MOCK EMAIL:");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${(text || "").slice(0, 120)}...`);
      console.log("─────────────────────────────\n");
      return { success: true, mock: true };
    }

    try {
      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      });

      console.log("✅ Email sent:", result?.data?.id);
      return { success: true, id: result?.data?.id };
    } catch (error) {
      console.error("❌ Resend Email Error:", error.message);
      return { success: false, error: error.message };
    }
  }

  async sendOTP(email, otp, customerName = "Customer") {
    const subject = "Your Growmore Verification OTP";
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color:#111;">
        <div style="max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:12px;">
          <h2>Hello ${customerName} 👋</h2>
          <p>Your OTP is:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:6px;padding:12px 0;">
            ${otp}
          </div>
          <p><b>Valid for 10 minutes.</b> Do not share this code with anyone.</p>
          <p style="font-size:12px;color:#666;margin-top:30px;">
            © 2026 Growmore Parking
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendBookingConfirmation(email, customerName, bookingId, recallLink, vehicleNumber, venue) {
    const subject = `Booking Confirmed - ${bookingId}`;
    const html = `
      <h2>Hello ${customerName}!</h2>
      <p>Your parking booking has been confirmed ✅</p>
      <p><b>Booking ID:</b> ${bookingId}</p>
      <p><b>Vehicle:</b> ${vehicleNumber}</p>
      ${venue ? `<p><b>Venue:</b> ${venue}</p>` : ""}
      <p><a href="${recallLink}">Open Booking</a></p>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendRecallNotification(email, customerName, bookingId, estimatedTime) {
    const subject = `Your Car is On the Way - ${bookingId}`;
    const html = `
      <h2>Hello ${customerName}!</h2>
      <p>Your car is being brought to you 🚗</p>
      <h3>ETA: ${estimatedTime} minutes</h3>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendArrivalNotification(email, customerName, bookingId, otp) {
    const subject = `Your Car Has Arrived! - ${bookingId}`;
    const html = `
      <h2>Hello ${customerName}!</h2>
      <p>Your car has arrived at the pickup point ✅</p>
      <p>Share this OTP with the valet:</p>
      <h2 style="letter-spacing:6px;">${otp}</h2>
    `;

    return this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();
