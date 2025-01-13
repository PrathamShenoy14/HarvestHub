import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    clearWishlist,
    moveToCart
} from "../controllers/wishlist.controller.js";

const router = Router();

// All wishlist routes are protected
router.use(verifyJWT);

router.post("/add", addToWishlist);
router.delete("/remove/:productId", removeFromWishlist);
router.get("/", getWishlist);
router.delete("/clear", clearWishlist);
router.post("/move-to-cart/:productId", moveToCart);

export default router; 