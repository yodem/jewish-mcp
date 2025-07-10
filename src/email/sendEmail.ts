import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  throw new Error('EMAIL_USER and EMAIL_PASS must be set in .env');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendEmail(subject: string, text: string, to: string = 'yotamfromm123@gmail.com') {
  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject,
    text,
  };
  await transporter.sendMail(mailOptions);
} 