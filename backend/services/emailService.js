const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.emailEnabled = !!(
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    );

    if (this.emailEnabled) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      this.fromEmail = process.env.EMAIL_FROM || 'tech@growmoreparking.com';
      this.fromName = process.env.EMAIL_FROM_NAME || 'Valetez Parking';
      
      console.log('✓ Email Service initialized');
    } else {
      console.log('⚠ Email Service running in MOCK mode');
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (this.emailEnabled) {
      try {
        const mailOptions = {
          from: `${this.fromName} <${this.fromEmail}>`,
          to: to,
          subject: subject,
          html: html,
          text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
      } catch (error) {
        console.error('Email Error:', error.message);
        return { success: false, error: error.message };
      }
    } else {
      // Mock email for development
      console.log('\n📧 MOCK EMAIL:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${text || html.substring(0, 100)}...`);
      console.log('─────────────────────────────\n');
      return { success: true, mock: true };
    }
  }

  async sendOTP(email, otp, customerName = 'Customer') {
    const subject = 'Your Valetez Verification OTP';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Valetez Parking</h1>
          </div>
          <div class="content">
            <h2>Hello ${customerName}!</h2>
            <p>Your verification OTP for Valetez is:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p><strong>Valid for 10 minutes.</strong> Do not share this code with anyone.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2026 Valetez Parking Services. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail(email, subject, html);
  }

  async sendBookingConfirmation(email, customerName, bookingId, recallLink, vehicleNumber, venue) {
    const subject = `Booking Confirmed - ${bookingId}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #667eea; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hello ${customerName}!</h2>
            <p>Your parking booking has been confirmed. Here are your details:</p>
            
            <div class="booking-details">
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span> ${bookingId}
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle Number:</span> ${vehicleNumber}
              </div>
              ${venue ? `<div class="detail-row"><span class="detail-label">Venue:</span> ${venue}</div>` : ''}
              <div class="detail-row">
                <span class="detail-label">Status:</span> Parked
              </div>
            </div>

            <p><strong>Track and Recall Your Car:</strong></p>
            <a href="${recallLink}" class="button">🚗 Access Your Booking</a>
            
            <p style="font-size: 14px; color: #666;">Or copy this link: <br>${recallLink}</p>
            
            <p>Save this link to track your booking status and recall your car when needed!</p>
          </div>
          <div class="footer">
            <p>© 2026 Valetez Parking Services. All rights reserved.</p>
            <p>Need help? Contact us at tech@growmoreparking.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail(email, subject, html);
  }

  async sendRecallNotification(email, customerName, bookingId, estimatedTime) {
    const subject = `Your Car is On the Way - ${bookingId}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .eta-box { background: white; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .eta-time { font-size: 32px; font-weight: bold; color: #3B82F6; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Your Car is Coming!</h1>
          </div>
          <div class="content">
            <h2>Hello ${customerName}!</h2>
            <p>Good news! Your car (${bookingId}) is being brought to you.</p>
            
            <div class="eta-box">
              <p style="margin: 0; color: #666;">Estimated Arrival Time:</p>
              <div class="eta-time">${estimatedTime} minutes</div>
            </div>
            
            <p>Please be ready at the pickup point. Our valet will arrive shortly!</p>
          </div>
          <div class="footer">
            <p>© 2026 Valetez Parking Services. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail(email, subject, html);
  }

  async sendArrivalNotification(email, customerName, bookingId, otp) {
    const subject = `Your Car Has Arrived! - ${bookingId}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px solid #10B981; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 36px; font-weight: bold; color: #10B981; letter-spacing: 10px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Car Arrived!</h1>
          </div>
          <div class="content">
            <h2>Hello ${customerName}!</h2>
            <p>Your car (${bookingId}) has arrived at the pickup point!</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666;">Share this OTP with the valet:</p>
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>Share this OTP with our valet to collect your car</li>
              <li>Verify your vehicle condition before driving off</li>
              <li>Check for all your belongings</li>
            </ul>
            
            <p>Thank you for using Valetez! Have a safe journey!</p>
          </div>
          <div class="footer">
            <p>© 2026 Valetez Parking Services. All rights reserved.</p>
            <p>Rate your experience: tech@growmoreparking.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();
