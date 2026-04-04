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

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};
