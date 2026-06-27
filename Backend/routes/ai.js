const express    = require("express");
const router     = express.Router();
const aiController = require("../controllers/aiController");

router.post("/generate-product", aiController.generateProduct);
router.post("/search-image",    aiController.searchImage);
router.post("/market-price",    aiController.searchMarketPrice);

module.exports = router;
