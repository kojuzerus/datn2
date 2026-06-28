const express    = require("express");
const router     = express.Router();
const aiController = require("../controllers/aiController");
const adminAuth  = require("../middleware/adminAuth");

router.post("/generate-product", adminAuth, aiController.generateProduct);
router.post("/search-image",    adminAuth, aiController.searchImage);
router.post("/market-price",    adminAuth, aiController.searchMarketPrice);

module.exports = router;
