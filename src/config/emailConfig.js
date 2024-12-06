import dotenv from 'dotenv';
dotenv.config();

export const emailConfig = {
    user: process.env.EMAIL_USER,  // e.g., your Gmail address
    pass: process.env.EMAIL_PASS,  // app-specific password (for Gmail)
  };