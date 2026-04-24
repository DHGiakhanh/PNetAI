const nodemailer = require('nodemailer');

const isRetryableSmtpError = (error) => {
    const code = error?.code;
    return ["ECONNRESET", "ETIMEDOUT", "ESOCKET", "ECONNREFUSED", "EPIPE"].includes(code);
};

const resolveFromAddress = () => {
    const configuredFrom = process.env.EMAIL_FROM;
    if (!configuredFrom || configuredFrom === "noreply@yourapp.com") {
        return process.env.EMAIL_USER || "no-reply@pnetai.local";
    }
    return configuredFrom;
};

// Create transporter
const createTransporter = async () => {
    // For development: use Ethereal fake SMTP if no real credentials
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
        console.log('⚠️  No email credentials found. Using Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }

    // Production: use real SMTP
    const port = Number(process.env.EMAIL_PORT || 587);
    const secure =
        process.env.EMAIL_SECURE === "true" ||
        (process.env.EMAIL_SECURE !== "false" && port === 465);

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port,
        secure,
        requireTLS: !secure,
        connectionTimeout: 20000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

let transporter = null;

const sendMailWithRetry = async (mailOptions) => {
    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
            if (!transporter) {
                transporter = await createTransporter();
            }

            return await transporter.sendMail(mailOptions);
        } catch (error) {
            lastError = error;
            const canRetry = isRetryableSmtpError(error) && attempt < 2;
            console.error(`❌ SMTP send attempt ${attempt} failed:`, error.message);

            transporter = null; // reset transporter for next attempt
            if (!canRetry) {
                throw error;
            }
        }
    }

    throw lastError;
};

// Send verification email
const sendVerificationEmail = async (email, otpCode) => {
    const mailOptions = {
        from: resolveFromAddress(),
        to: email,
        subject: 'Your Verification Code',
        html: `
            <h1>Email Verification</h1>
            <p>Use the 6-digit code below to verify your account:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 16px 0;">
                ${otpCode}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `
    };

    try {
        const info = await sendMailWithRetry(mailOptions);
        console.log('✅ Verification email sent to:', email);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('❌ Error sending verification email:', error.message);
        throw error;
    }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
    
    const mailOptions = {
        from: resolveFromAddress(),
        to: email,
        subject: 'Reset Your Password',
        html: `
            <h1>Password Reset</h1>
            <p>You requested to reset your password. Click the link below to reset it:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
    };

    try {
        const info = await sendMailWithRetry(mailOptions);
        console.log('✅ Password reset email sent to:', email);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (email, bookingData) => {
    const { serviceTitle, petName, date, time, totalAmount } = bookingData;
    
    const mailOptions = {
        from: resolveFromAddress(),
        to: email,
        subject: 'Booking Confirmed!',
        html: `
            <div style="font-family: 'Serif', 'Georgia', serif; padding: 20px; color: #1a1a1a;">
                <h1 style="border-bottom: 2px solid #e2d1c3; padding-bottom: 10px;">Booking Confirmed! 🐾</h1>
                <p>Hello,</p>
                <p>Your booking for <strong>${serviceTitle}</strong> has been successfully confirmed.</p>
                
                <div style="background-color: #fcf9f6; padding: 20px; border-radius: 12px; border: 1px solid #e2d1c3; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Appointment Details</h3>
                    <p><strong>Pet:</strong> ${petName}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p><strong>Total Amount:</strong> $${totalAmount}</p>
                </div>
                
                <p>We look forward to seeing you and your furry friend!</p>
                <p style="font-size: 0.8em; color: #666;">If you need to change your appointment, please contact us at least 24 hours in advance.</p>
                <p>Best regards,<br>The PNetAI Team</p>
            </div>
        `
    };

    try {
        await sendMailWithRetry(mailOptions);
        console.log('✅ Booking confirmation email sent to:', email);
    } catch (error) {
        console.error('❌ Error sending booking confirmation email:', error.message);
    }
};

// Send appointment reminder email
const sendAppointmentReminderEmail = async (email, reminderData) => {
    const { serviceTitle, petName, date, time } = reminderData;
    
    const mailOptions = {
        from: resolveFromAddress(),
        to: email,
        subject: 'Upcoming Appointment Reminder',
        html: `
            <div style="font-family: 'Serif', 'Georgia', serif; padding: 20px; color: #1a1a1a;">
                <h1 style="border-bottom: 2px solid #e2d1c3; padding-bottom: 10px;">Appointment Reminder 🗓️</h1>
                <p>Hi there,</p>
                <p>This is a friendly reminder of your upcoming appointment for <strong>${petName}</strong>.</p>
                
                <div style="background-color: #fcf9f6; padding: 20px; border-radius: 12px; border: 1px solid #e2d1c3; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Appointment Details</h3>
                    <p><strong>Service:</strong> ${serviceTitle}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                </div>
                
                <p>See you soon!</p>
                <p>Best regards,<br>The PNetAI Team</p>
            </div>
        `
    };

    try {
        await sendMailWithRetry(mailOptions);
        console.log('✅ Appointment reminder email sent to:', email);
    } catch (error) {
        console.error('❌ Error sending appointment reminder email:', error.message);
    }
};

// Send notification to provider about new booking request
const sendNewBookingNotificationToProvider = async (email, bookingData) => {
    const { serviceTitle, petName, date, time, totalAmount, customerName } = bookingData;
    
    const mailOptions = {
        from: resolveFromAddress(),
        to: email,
        subject: 'New Booking Request - Action Required',
        html: `
            <div style="font-family: 'Serif', 'Georgia', serif; padding: 20px; color: #1a1a1a;">
                <h1 style="border-bottom: 2px solid #e2d1c3; padding-bottom: 10px;">New Booking Alert! 🚨</h1>
                <p>Hello,</p>
                <p>You have received a new booking request for <strong>${serviceTitle}</strong> from <strong>${customerName}</strong>.</p>
                
                <div style="background-color: #fcf9f6; padding: 20px; border-radius: 12px; border: 1px solid #e2d1c3; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Request Details</h3>
                    <p><strong>Service:</strong> ${serviceTitle}</p>
                    <p><strong>Customer:</strong> ${customerName}</p>
                    <p><strong>Pet:</strong> ${petName}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p><strong>Total Amount:</strong> $${totalAmount}</p>
                </div>
                
                <p>Please log in to your dashboard to approve or decline this request.</p>
                <p>Best regards,<br>The PNetAI Team</p>
            </div>
        `
    };

    try {
        await sendMailWithRetry(mailOptions);
        console.log('✅ New booking notification sent to provider:', email);
    } catch (error) {
        console.error('❌ Error sending provider notification email:', error.message);
    }
};

// Send cancellation email to user
const sendBookingCancellationEmailToUser = async (email, bookingData) => {
    const { serviceTitle, date, time, reason = "Provider availability change" } = bookingData;
    
    const mailOptions = {
        from: resolveFromAddress(),
        to: email,
        subject: 'Appointment Cancelled - Refund Processing',
        html: `
            <div style="font-family: 'Serif', 'Georgia', serif; padding: 20px; color: #1a1a1a;">
                <h1 style="border-bottom: 2px solid #fecaca; padding-bottom: 10px; color: #dc2626;">Appointment Cancelled ⚠️</h1>
                <p>Hello,</p>
                <p>We regret to inform you that your booking for <strong>${serviceTitle}</strong> on <strong>${date}</strong> at <strong>${time}</strong> has been cancelled by the service provider.</p>
                
                <div style="background-color: #fef2f2; padding: 20px; border-radius: 12px; border: 1px solid #fecaca; margin: 20px 0;">
                    <p><strong>Reason:</strong> ${reason}</p>
                    <p><strong>Refund Status:</strong> Initiated. Our admin team has been notified to process your refund immediately.</p>
                </div>
                
                <p>We apologize for any inconvenience caused. You can browse other available slots or clinics in our registry.</p>
                <p>Best regards,<br>The PNetAI Team</p>
            </div>
        `
    };

    try {
        await sendMailWithRetry(mailOptions);
        console.log('✅ Cancellation email sent to user:', email);
    } catch (error) {
        console.error('❌ Error sending cancellation email:', error.message);
    }
};

// Send refund request notification to Admin
const sendRefundRequestToAdmin = async (bookingData) => {
    const { bookingId, customerName, totalAmount, providerName } = bookingData;
    const adminEmail = process.env.ADMIN_EMAIL || "admin@pnetai.local";

    const mailOptions = {
        from: resolveFromAddress(),
        to: adminEmail,
        subject: 'ACTION REQUIRED: Refund Request for Cancelled Booking',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a;">
                <h1 style="color: #dc2626;">Refund Request 💸</h1>
                <p>An appointment has been cancelled by the provider, necessitating a manual refund for the customer.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr style="background-color: #f3f4f6;">
                        <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Detail</th>
                        <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Value</th>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">Booking ID</td>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">${bookingId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">Customer</td>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">${customerName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">Provider</td>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">${providerName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">Amount to Refund</td>
                        <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">$${totalAmount}</td>
                    </tr>
                </table>
                
                <p style="margin-top: 20px;">Please process this refund via the PayOS dashboard or your payment gateway and update the internal transaction status.</p>
            </div>
        `
    };

    try {
        await sendMailWithRetry(mailOptions);
        console.log('✅ Refund request sent to Admin');
    } catch (error) {
        console.error('❌ Error sending refund request to Admin:', error.message);
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendBookingConfirmationEmail,
    sendAppointmentReminderEmail,
    sendNewBookingNotificationToProvider,
    sendBookingCancellationEmailToUser,
    sendRefundRequestToAdmin
};
