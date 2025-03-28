const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const roleBasedAccess = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // ✅ Skip authentication if no roles are required (allow public access)
      if (allowedRoles.length === 0) {
        return next();
      }

      const token = req.headers["authorization"]?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ success: false, message: "Token required" });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.SECRET_KEY);
      } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
      }

      req.userId = decoded.id;
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if (!allowedRoles.includes(user.role) || user.verified === false) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      req.user = user;
      req.role = user.role;
      next();
    } catch (error) {
      console.error("Error in role-based access middleware:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
};

module.exports = roleBasedAccess;
