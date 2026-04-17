const nodemailer = require('nodemailer');

// Email service for sending notifications
class EmailService {
  constructor() {
    // Configure your email provider here (Gmail, SendGrid, AWS SES, etc.)
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendPasswordResetEmail(email, resetToken, firstName) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${firstName},</p>
        <p>We received a request to reset your password. Click the link below to proceed:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #1A56DB; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Reset Password
        </a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br/>ZANA Team</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request - ZANA',
        html: htmlContent,
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBookingConfirmation(email, booking, firstName) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmed!</h2>
        <p>Hello ${firstName},</p>
        <p>Your booking has been confirmed. Here are the details:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking Reference:</strong> ${booking.reference}</p>
          <p><strong>Service:</strong> ${booking.serviceName}</p>
          <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.startTime}</p>
          <p><strong>Location/Provider:</strong> ${booking.venueName || booking.providerName}</p>
          <p><strong>Amount:</strong> K ${booking.amount}</p>
        </div>
        <p>You can manage your bookings in the ZANA app.</p>
        <p>Best regards,<br/>ZANA Team</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Booking Confirmed - ${booking.reference}`,
        html: htmlContent,
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBookingCancellation(email, booking, firstName) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Cancelled</h2>
        <p>Hello ${firstName},</p>
        <p>Your booking has been cancelled. Here are the details:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking Reference:</strong> ${booking.reference}</p>
          <p><strong>Service:</strong> ${booking.serviceName}</p>
          <p><strong>Original Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
        </div>
        <p>If you have any questions, please contact support.</p>
        <p>Best regards,<br/>ZANA Team</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Booking Cancelled - ${booking.reference}`,
        html: htmlContent,
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendProviderBookingNotification(email, booking, firstName) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Booking!</h2>
        <p>Hello ${firstName},</p>
        <p>You have a new booking request:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Customer:</strong> ${booking.customerName}</p>
          <p><strong>Service:</strong> ${booking.serviceName}</p>
          <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.startTime}</p>
          <p><strong>Amount:</strong> K ${booking.amount}</p>
        </div>
        <p>Log in to the provider portal to confirm or decline this booking.</p>
        <p>Best regards,<br/>ZANA Team</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'New Booking Request',
        html: htmlContent,
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to send provider notification:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
