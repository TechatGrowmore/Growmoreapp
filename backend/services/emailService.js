const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.emailEnabled = !!(
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    );

    if (this.emailEnabled) {
      const port = parseInt(process.env.EMAIL_PORT || "587", 10);

      const secure = process.env.EMAIL_SECURE
        ? process.env.EMAIL_SECURE === "true"
        : port === 465;

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },

      // ✅ add these
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });


      this.fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      this.fromName = process.env.EMAIL_FROM_NAME || "Valetez Parking";

      console.log(
        `✓ Email Service initialized (host=${process.env.EMAIL_HOST}, port=${port}, secure=${secure})`
      );
    } else {
      console.log("⚠ Email Service running in MOCK mode");
    }
  }

  // ✅ Base send email function
  async sendEmail(to, subject, html, text = null) {
    if (this.emailEnabled) {
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
    } else {
      console.log("\n📧 MOCK EMAIL:");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${text || html.substring(0, 200)}...`);
      console.log("─────────────────────────────\n");
      return { success: true, mock: true };
    }
  }

  // ✅ 1) Booking confirmation email
  async sendBookingConfirmation(
    toEmail,
    customerName,
    bookingId,
    accessLink,
    vehicleNumber,
    venue
  ) {
    const subject = `Booking Confirmed ✅ (${bookingId})`;

    const html = `
      <h2>Booking Confirmed ✅</h2>
      <p>Hi <b>${customerName || "Customer"}</b>,</p>
      <p>Your parking booking has been created successfully.</p>
      <hr/>
      <p><b>Booking ID:</b> ${bookingId}</p>
      <p><b>Vehicle No:</b> ${vehicleNumber || "-"}</p>
      <p><b>Venue:</b> ${venue || "-"}</p>
      <br/>
      <p>You can track your booking here:</p>
      <p><a href="${accessLink}" target="_blank">${accessLink}</a></p>
      <br/>
      <p>Thanks,<br/>Valetez Parking</p>
    `;

    return await this.sendEmail(toEmail, subject, html);
  }

  // ✅ 2) Recall notification email
  async sendRecallNotification(toEmail, customerName, bookingId, estimatedMinutes) {
    const subject = `Car is On the Way 🚗 (${bookingId})`;

    const html = `
      <h2>Your Car Recall is in progress 🚗</h2>
      <p>Hi <b>${customerName || "Customer"}</b>,</p>
      <p>Your car has been recalled by the driver.</p>
      <hr/>
      <p><b>Booking ID:</b> ${bookingId}</p>
      <p><b>Estimated Arrival:</b> ${estimatedMinutes} minutes</p>
      <br/>
      <p>Thanks,<br/>Valetez Parking</p>
    `;

    return await this.sendEmail(toEmail, subject, html);
  }

  // ✅ 3) Arrival OTP email
  async sendArrivalNotification(toEmail, customerName, bookingId, otp) {
    const subject = `OTP for Car Handover 🔐 (${bookingId})`;

    const html = `
      <h2>Driver Arrived ✅</h2>
      <p>Hi <b>${customerName || "Customer"}</b>,</p>
      <p>Your driver has arrived. Share this OTP to verify and collect your car.</p>
      <hr/>
      <p><b>Booking ID:</b> ${bookingId}</p>
      <h1 style="letter-spacing: 4px;">${otp}</h1>
      <p><b>OTP Validity:</b> 10 minutes</p>
      <br/>
      <p><b>Note:</b> Do not share OTP with anyone except the driver.</p>
      <br/>
      <p>Thanks,<br/>Valetez Parking</p>
    `;

    return await this.sendEmail(toEmail, subject, html);
  }
}

module.exports = new EmailService();
