const BannerModel = require('../models/banner.model');

const getActiveBanners = async (req, res) => {
  try {
    const banners = await BannerModel.fetchActiveBanners();
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getActiveBanners,
};