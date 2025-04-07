const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (to, otp) => {
  try {
    const mailOptions = {
      from: `"MyApp Support" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>OTP Verification</h2>
          <p>Your OTP is:</p>
          <h3 style="color: #2e86de;">${otp}</h3>
          <p>This OTP is valid for 30 seconds. Please do not share it with anyone.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending OTP to ${to}:`, error.message);
  }
};

module.exports = { sendOtpEmail };
