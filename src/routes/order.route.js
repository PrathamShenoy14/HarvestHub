import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createOrder,
    getMyOrders,
    getFarmerOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder
} from "../controllers/order.controller.js";

const router = Router();

// All order routes are protected
router.use(verifyJWT);

router.post("/create", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/farmer-orders", getFarmerOrders);
router.get("/:orderId", getOrderById);
router.patch("/status/:orderId", updateOrderStatus);
router.patch("/cancel/:orderId", cancelOrder);

export default router; 