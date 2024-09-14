const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Copyright Rzkymlna
 * @param {string} email
 * @param {string} pin 
 */
function sendEmailVerification(email, pin) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification',
    text: `Please use the following PIN to verify your email: ${pin}`
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmailVerification };