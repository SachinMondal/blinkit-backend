const User=require("../models/userModel");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");



const generateOTP = () => crypto.randomInt(10000, 99999).toString();

const generateToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });
  };
const otpStore = new Map(); 

// 1. Send OTP
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const otp = generateOTP();
    const expiresAt = Date.now() + 30000;

    otpStore.set(email, { otp, expiresAt });
    let user=await User.findOne({ email: email});
    if(!user){
        user=await User.create({ email: email });
    }
    // Send OTP via email
    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: "Your OTP Code",
    //   text: `Your OTP is ${otp}. It will expire in 30 seconds.`,
    // });

    return res.status(200).json({ message: "OTP sent successfully"+otp });
  } catch (error) {
    console.log(error.stack);
    return res.status(500).json({ message: "Error sending OTP", error });
  }
};

// Verify OTP & Signup/Login
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const storedOTP = otpStore.get(email);

    if (!storedOTP) return res.status(400).json({ message: "OTP expired or not found" });

    if (storedOTP.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    otpStore.delete(email); 

    let user = await User.findOne({ email });
    if(!user){
        return res.status(404).json({ message: "user not found" });
    }
    const token = generateToken(user);
    user.verified = true;
    await user.save();
    return res.status(200).json({ message: "Login successful", user,token:token });
  } catch (error) {
    console.log(error.stack);
    return res.status(500).json({ message: "Error verifying OTP", error });
  }
};

const updateUser = async (req, res) => {
    try {
      const { name, mobileNo } = req.body;
      const userId = req.userId 
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      if (name) user.name = name;
      if (mobileNo) user.mobileNo = mobileNo;
  
      await user.save();
  
      return res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
      console.log(error.stack);
      return res.status(500).json({ message: "Error updating user", error });
    }
  };

const getAllUser=async (req,res)=>{
  try{
const users=await User.find({});
console.log(users);
    return res.status(200).json({ success: true, users });
  }catch(error){
    return res.status(500).json({ message: "Error fetching users", error });
  }
}

const updateUserRole=async(req,res)=>{
  try{
    const { userId, role } = req.body;
    const user=await User.findById(userId);
    if(!user){
        return res.status(404).json({ message: "User not found" });
    }
    user.role=role;
    await user.save();
    return res.status(200).json({ message: "User role updated successfully", user });
  }catch(error){
    return res.status(500).json({ message: "Error updating user role", error });
  }
}
module.exports = { sendOTP, verifyOTP,updateUser,getAllUser,updateUserRole };