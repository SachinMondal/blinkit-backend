const Address = require("../models/addressModel");

// ✅ 1. Add a New Address
const addNewAddress = async (req, res) => {
    try {
        const { firstName, lastName, streetAddress, city, state, zipCode, mobile } = req.body;
        const userId = req.user._id; 

      
        const newAddress = new Address({ 
            firstName, lastName, streetAddress, city, state, zipCode, mobile, user: userId 
        });
        await newAddress.save();

        res.status(201).json({ success: true, message: "Address added successfully", address: newAddress });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error adding address", error: error.message });
    }
};


const editAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const updates = req.body;

        const updatedAddress = await Address.findOneAndUpdate(
            { _id: addressId, user: req.user._id }, 
            updates,
            { new: true } 
        );

        if (!updatedAddress) {
            return res.status(404).json({ success: false, message: "Address not found or unauthorized" });
        }

        res.status(200).json({ success: true, message: "Address updated successfully", address: updatedAddress });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating address", error: error.message });
    }
};


const getAllAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.user._id });

        res.status(200).json({ success: true, addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching addresses", error: error.message });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const deletedAddress = await Address.findOneAndDelete({ _id: addressId, user: req.user._id });

        if (!deletedAddress) {
            return res.status(404).json({ success: false, message: "Address not found or unauthorized" });
        }

        res.status(200).json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting address", error: error.message });
    }
};

module.exports = { addNewAddress, editAddress, getAllAddresses, deleteAddress };
