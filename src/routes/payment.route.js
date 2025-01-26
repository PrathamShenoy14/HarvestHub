import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Middleware to verify JWT
import {
    initializePayment,
    verifyPayment,
    getPaymentDetails
} from "../controllers/payment.controller.js"; // Import payment controller functions

const router = Router();

// All payment routes are protected
router.use(verifyJWT);

// Route to initialize payment for multiple orders
router.post("/initialize", initializePayment);

// Route to verify payment after Razorpay transaction
router.post("/verify", verifyPayment);

// Route to get payment details for a specific order
router.get("/details/:orderId", getPaymentDetails);

export default router;
