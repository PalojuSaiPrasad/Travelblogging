const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'traveltalesmailer@gmail.com',
        pass: 'rgpc epgx xljd lysg'
    }
});

const sendMail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: '"Travel Tales" <saiprasadpaloju@gmail.com>',
            to,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
                    <h2 style="color: #333;">Travel Tales - Email Verification</h2>
                    <p style="font-size: 16px; color: #666;">Your verification code is:</p>
                    <h1 style="color: #ff6b6b; font-size: 32px; letter-spacing: 5px;">${text.match(/\d+/)[0]}</h1>
                    <p style="color: #666;">This code will expire in 10 minutes.</p>
                    <p style="color: #999; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send email: ' + error.message);
    }
};

// Test connection
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP connection error:', error);
    } else {
        console.log('SMTP server is ready to send emails');
    }
});

module.exports = { sendMail };