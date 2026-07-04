const express   = require("express");
const router    = express.Router();
const auth      = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const newsController = require("../controllers/newsController");

// ⚠️ Route cụ thể phải đặt TRƯỚC route có param /:slug
router.get("/admin/all", adminAuth, newsController.getAllAdmin);
router.get("/admin/:id", adminAuth, newsController.getOneAdmin);

// Bình luận: admin trả lời / xóa
router.put("/comments/:commentId/reply", adminAuth, newsController.replyComment);
router.delete("/comments/:commentId",    adminAuth, newsController.deleteComment);

// Thích + bình luận theo bài viết
router.post("/:id/like",     auth, newsController.toggleLike);
router.get("/:id/comments",  newsController.getComments);
router.post("/:id/comments", auth, newsController.addComment);

router.get("/",       newsController.getPublished);
router.post("/",      adminAuth, newsController.create);
router.get("/:slug",  newsController.getBySlug);
router.put("/:id",    adminAuth, newsController.update);
router.delete("/:id", adminAuth, newsController.remove);

module.exports = router;
