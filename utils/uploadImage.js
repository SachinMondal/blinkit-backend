const cloudinary = require("../config/Cloudinary");

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
const deleteImage = async (imageUrl) => {
  try {
    const publicId = imageUrl.split("/").pop().split(".")[0]; 
    await cloudinary.uploader.destroy(publicId);
    console.log("Image deleted successfully:", publicId);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};
module.exports = {uploadImage, deleteImage};
