const SiteSetting = require("../models/siteSettingModel");

// GET /api/settings  (public — frontend reads this)
exports.getSettings = async (req, res) => {
  try {
    let doc = await SiteSetting.findById("main");
    if (!doc) {
      doc = await SiteSetting.create({ _id: "main" });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/settings  (admin only)
exports.updateSettings = async (req, res) => {
  try {
    const allowed = ["siteName", "logoUrl", "faviconUrl", "phone", "email", "address", "description"];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const doc = await SiteSetting.findByIdAndUpdate(
      "main",
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
