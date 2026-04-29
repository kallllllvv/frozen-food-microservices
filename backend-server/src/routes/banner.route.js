const express = require('express');
const router = express.Router();
const BannerController = require('../controllers/banner.controller');

router.get('/active', BannerController.getActiveBanners);

module.exports = router;