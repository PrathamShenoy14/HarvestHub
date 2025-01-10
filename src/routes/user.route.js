import { Router } from 'express';
import { 
    loginUser,
    registerUser,
    refreshAccessToken,
    logout,
    updateAccountDetails,
    updateAvatar,
    updateFarmPhotos,
    changePassword
} from '../controllers/auth.controller.js';

import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Authentication routes (public)
router.post("/register", 
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "farmPhotos", maxCount: 5 }
    ]),
    registerUser
);

router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

// Protected routes (require authentication)
router.use(verifyJWT); // Apply verifyJWT middleware to all routes below

router.post("/logout", logout);

// Account management
router.patch("/update-account", updateAccountDetails);

router.patch("/update-avatar",
    upload.single("avatar"),
    updateAvatar
);

router.patch("/update-farm-photos",
    upload.array("farmPhotos", 5),
    updateFarmPhotos
);

router.patch("/change-password", changePassword);

// Optional: Get user profile
router.get("/profile", async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("-password -refreshToken");

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error fetching profile"
        });
    }
});

export default router;
