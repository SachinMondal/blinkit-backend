const User=require("../models/userModel");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/mailHandler");



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
    await sendOtpEmail(email,otp);

    return res.status(200).json({ message: "OTP sent successfully"+otp });
  } catch (error) {
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

    // ✅ Check if OTP is expired
    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(email); // clear expired OTP
      return res.status(400).json({ message: "OTP has expired" });
    }

    // ✅ Check if OTP is correct
    if (storedOTP.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    otpStore.delete(email); // OTP verified, remove it

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = generateToken(user);
    user.verified = true;
    await user.save();

    return res.status(200).json({ message: "Login successful", user, token });
  } catch (error) {
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
      
      return res.status(500).json({ message: "Error updating user", error });
    }
  };

const getAllUser=async (req,res)=>{
  try{
const users=await User.find({});
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

const saveLocation = async (req, res) => {
  const userId = req.user._id;
  const { location, lat, lng } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        location: location,
        locationPin: {
          type: "Point",
          coordinates: [lng, lat],
        },
      },
      { new: true }
    );
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const loggedInUser=async(req,res)=>{
  const userId=req.userId;
  try{
    const user=await User.findById(userId);
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User fetched successfully", user });
  }catch(error){
    return res.status(500).json({ message: "Error fetching user", error });
  }
}
module.exports = { sendOTP, verifyOTP,updateUser,getAllUser,updateUserRole,saveLocation,loggedInUser };