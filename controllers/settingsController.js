const Settings = require("../models/settingsModel");

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne().populate("lastUpdatedBy", "name email");

    if (!settings) {
      settings = await Settings.create({
        deliveryCharge: 0,
        handlingCharge: 0,
      });
    }

    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching settings." });
  }
};


exports.updateSettings = async (req, res) => {
  const { deliveryCharge, handlingCharge } = req.body;

  try {
    const updated = await Settings.findOneAndUpdate(
      {},
      { deliveryCharge, handlingCharge, lastUpdatedBy: req.user._id,  },
      { upsert: true, new: true }
    ).populate("lastUpdatedBy", "name email");

    res.status(200).json({ success: true, settings: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update charges." });
  }
};
