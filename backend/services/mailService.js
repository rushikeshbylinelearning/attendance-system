// backend/services/mailService.js
const nodemailer = require('nodemailer');

// For development, we'll use a service like Ethereal to preview emails
// without needing a real email account.
// In production, you'd replace this with SendGrid, SES, etc.
const createTransporter = async () => {
    // If we don't have a real mail service configured, use Ethereal
    if (!process.env.MAIL_HOST) {
        let testAccount = await nodemailer.createTestAccount();
        console.log("************************************************************");
        console.log("NO MAIL SERVICE CONFIGURED - USING ETHEREAL FOR DEVELOPMENT");
        console.log("Preview emails at:", nodemailer.getTestMessageUrl(null));
        console.log(`Ethereal User: ${testAccount.user}`);
        console.log(`Ethereal Pass: ${testAccount.pass}`);
        console.log("************************************************************");
        
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    // Configuration for a real SMTP service (like SendGrid)
    return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: process.env.MAIL_SECURE === 'true',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });
};

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const transporter = await createTransporter();
        const info = await transporter.sendMail({
            from: `"Attendance System" <no-reply@yourcompany.com>`,
            to,
            subject,
            text,
            html,
        });

        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('Preview URL: %s', previewUrl);
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendEmail };