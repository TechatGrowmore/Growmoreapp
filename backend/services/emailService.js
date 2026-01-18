const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.emailEnabled = !!(
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    );

    if (this.emailEnabled) {
      // IMPORTANT (Render / cloud hosting):
      const port = parseInt(process.env.EMAIL_PORT || '587', 10);

      const secure = process.env.EMAIL_SECURE
        ? process.env.EMAIL_SECURE === 'true'
        : port === 465;

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port,
        secure,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED
            ? process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === 'true'
            : false
        },
        logger: process.env.EMAIL_DEBUG === 'true',
        debug: process.env.EMAIL_DEBUG === 'true'
      });

      this.fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      this.fromName = process.env.EMAIL_FROM_NAME || 'Valetez Parking';

      console.log(
        `✓ Email Service initialized (host=${process.env.EMAIL_HOST}, port=${port}, secure=${secure})`
      );
    } else {
      console.log('⚠ Email Service running in MOCK mode');
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (this.emailEnabled) {
      try {
        const mailOptions = {
          from: `${this.fromName} <${this.fromEmail}>`,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, '')
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
      } catch (error) {
        console.error('Email Error:', error);
        return { success: false, error: error.message };
      }
    } else {
      console.log('\n📧 MOCK EMAIL:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${text || html.substring(0, 100)}...`);
      console.log('─────────────────────────────\n');
      return { success: true, mock: true };
    }
  }
}

module.exports = new EmailService();
