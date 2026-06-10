const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/auth");
const {
  getCart, addToCart, updateQuantity, removeItem, clearCart
} = require("../controllers/cartController");

router.get("/",                auth, getCart);
router.post("/add",            auth, addToCart);
router.put("/item/:itemId",    auth, updateQuantity);
router.delete("/item/:itemId", auth, removeItem);
router.delete("/clear",        auth, clearCart);

module.exports = router;