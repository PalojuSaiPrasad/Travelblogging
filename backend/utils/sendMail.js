const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_ID, // Your email address
        pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
    },
});

async function sendMail(to, subject, text) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_ID, // Sender address
            to: to, // List of recipients
            subject: subject, // Subject line
            text: text, // Plain text body
        };

        // Send mail with defined transport object
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = {
    sendMail,
};