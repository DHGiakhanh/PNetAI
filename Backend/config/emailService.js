const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = async () => {
    // For development: use Ethereal fake SMTP if no real credentials
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
        console.log('⚠️  No email credentials found. Using Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransporter({
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
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

let transporter = null;

// Send verification email
const sendVerificationEmail = async (email, token) => {
    if (!transporter) {
        transporter = await createTransporter();
    }

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email',
        html: `
            <h1>Email Verification</h1>
            <p>Thank you for registering. Please click the link below to verify your email:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
            <p>This link will expire in 24 hours.</p>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
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
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent to:', email);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};
