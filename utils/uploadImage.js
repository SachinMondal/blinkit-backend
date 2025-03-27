const cloudinary = require("../config/cloudinary");

// Function to upload image to Cloudinary
const uploadImage = async (imagePath) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "categories", 
      use_filename: true,
      unique_filename: false
    });
    return result.secure_url; 
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Image upload failed");
  }
};

module.exports = uploadImage;
