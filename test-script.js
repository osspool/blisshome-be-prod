import dotenv from 'dotenv';
dotenv.config();

import { sendEmail, orderConfirmationTemplate } from "#src/services/emailService.js";

const customerName = "John Doe";
const orderId = "123456";
const email = "sadman923@gmail.com"
const subject = "Order Confirmation";
const html = `<h1>Order Confirmation</h1>`

const text = orderConfirmationTemplate(customerName, orderId);
// send test email 

try {

    await sendEmail(email, subject, text, text, html);
}

catch (error) {
    console.error(error);
}
