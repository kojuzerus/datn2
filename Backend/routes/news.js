const express   = require("express");
const router    = express.Router();
const adminAuth = require("../middleware/adminAuth");
const newsController = require("../controllers/newsController");

// ⚠️ Route cụ thể phải đặt TRƯỚC route có param /:slug
router.get("/admin/all", adminAuth, newsController.getAllAdmin);
router.get("/admin/:id", adminAuth, newsController.getOneAdmin);

router.get("/",       newsController.getPublished);
router.post("/",      adminAuth, newsController.create);
router.get("/:slug",  newsController.getBySlug);
router.put("/:id",    adminAuth, newsController.update);
router.delete("/:id", adminAuth, newsController.remove);

module.exports = router;
