import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addToCart,
    removeFromCart,
    getCart,
    clearCart,
    updateQuantity
} from "../controllers/cart.controller.js";

const router = Router();

// All cart routes are protected
router.use(verifyJWT);

router.post("/add", addToCart);
router.delete("/remove/:productId", removeFromCart);
router.get("/", getCart);
router.delete("/clear", clearCart);
router.patch("/quantity/:productId", updateQuantity);

export default router; 