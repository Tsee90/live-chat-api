const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async ({ type, to, code }) => {
  const url =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:5173/password-reset'
      : 'https://chizmiz.live/password-reset';

  const subject =
    type === 'email'
      ? 'Your Verification Code'
      : type === 'password'
      ? 'Reset your password'
      : null;

  const text =
    type === 'email'
      ? `Your Chizmiz.live verification code is: ${code}`
      : type === 'password'
      ? `Password reset link: ${url}/${code}?email=${encodeURIComponent(to)}`
      : null;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendVerificationEmail };
