import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getAllProducts,
    getMyProducts,
    updateProductImages,
    deleteProductPhoto
} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.get("/", getAllProducts);
router.get("/detail/:productId", getProductById);

// Protected routes
router.use(verifyJWT);

router.get("/my-products", getMyProducts);

router.post(
    "/create",
    upload.fields([
        { name: "productImages", maxCount: 5 }
    ]),
    createProduct
);

router.patch("/update/:productId", updateProduct);

router.patch(
    "/update-images/:productId",
    upload.fields([
        { name: "productImages", maxCount: 5 }
    ]),
    updateProductImages
);

router.delete("/delete/:productId", deleteProduct);

router.delete("/delete-photo/:productId", deleteProductPhoto);

export default router;


