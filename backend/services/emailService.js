// ✅ Brevo Email Service (API based - works on Render)

class EmailService {
  constructor() {
    this.apiEnabled = !!process.env.BREVO_API_KEY;

    this.fromEmail = process.env.EMAIL_FROM || "ravin@growmoreparking.com";
    this.fromName = process.env.EMAIL_FROM_NAME || "Growmore Parking";

    if (this.apiEnabled) {
      console.log("✓ Email Service initialized (Brevo API mode ✅)");
    } else {
      console.log("⚠ Email Service running in MOCK mode (BREVO_API_KEY missing)");
    }
  }

  // ✅ Base send email via Brevo API
  async sendEmail(to, subject, html, text = null) {
    if (!this.apiEnabled) {
      console.log("\n📧 MOCK EMAIL:");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${text || html.substring(0, 200)}...`);
      console.log("─────────────────────────────\n");
      return { success: true, mock: true };
    }

    try {
      console.log("📨 [BREVO] Sending email...");
      console.log("To:", to);
      console.log("From:", this.fromEmail);
      console.log("Subject:", subject);

      const payload = {
        sender: {
          name: this.fromName,
          email: this.fromEmail,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || undefined,
      };

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("📩 [BREVO] Status:", response.status);
      console.log("📩 [BREVO] Response:", data);

      if (!response.ok) {
        console.error("❌ Brevo API error:", data);
        return {
          success: false,
          error: data.message || "Brevo API error",
          details: data,
          status: response.status,
        };
      }

      console.log(`✅ [BREVO] Email sent successfully to ${to}`);
      return { success: true, result: data };
    } catch (error) {
      console.error("❌ Brevo sendEmail exception:", error);
      return { success: false, error: error.message };
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
      <p>Thanks,<br/>Growmore Parking</p>
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
      <p>Thanks,<br/>Growmore Parking</p>
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
      <p>Thanks,<br/>Growmore Parking</p>
    `;

    return await this.sendEmail(toEmail, subject, html);
  }
}

module.exports = new EmailService();
