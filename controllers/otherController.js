const Banner = require("../models/bannerModel");
const { uploadImage, deleteImage } = require("../utils/uploadImage");

const uploadBanner = async (req, res) => {

    try {
        const { alt } = req.fields; 
        let imageUrl = "";

        if (req.files && req.files.image) {
            try {
                imageUrl = await uploadImage(req.files.image.path);
            } catch (error) {
                return res.status(500).json({ message: "Image upload failed", error: error.message });
            }
        }

        const banner = new Banner({ image: imageUrl, alt });
        await banner.save();
        
        res.status(201).json({ success: true, banner });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: "Banner not found" });
        }

        try {
            if (banner.image) {
                await deleteImage(banner.image);
            }
        } catch (error) {
            console.error("Error deleting image:", error);
        } finally {
            await Banner.findByIdAndDelete(req.params.id);
        }

        res.status(200).json({ success: true, message: "Banner deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find();
        res.status(200).json({ success: true, data: banners });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    uploadBanner,
    deleteBanner,
    getAllBanners
};
