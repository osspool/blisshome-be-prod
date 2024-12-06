import nodemailer from "nodemailer";
import { emailConfig } from "#src/config/emailConfig.js"; // Configuration for SMTP or SendGrid

// Create a transporter using Gmail SMTP service (change it for SendGrid or other services)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailConfig.user,  
    pass: emailConfig.pass,  
  }
});

// Send an email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: emailConfig.user,  // sender address
      to,                      // list of receivers
      subject,                 // Subject line
      text,                    // plain text body
      html,                    // HTML body
    });
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const orderConfirmationTemplate = (customerName, orderId) => {
    return `
      <h1>Order Confirmation</h1>
      <p>Hello ${customerName},</p>
      <p>Your order with Order ID: ${orderId} has been successfully placed. You will receive a shipping confirmation once your order is on its way!</p>
      <p>Thank you for shopping with us!</p>
    `;
  };
  

export { sendEmail, orderConfirmationTemplate };
