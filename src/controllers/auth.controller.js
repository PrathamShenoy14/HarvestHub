import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { getPublicIdFromURL } from "../utils/cloudinary.js";


const generateTokens = async (user) => {
    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        // Attach refresh token to user
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        
        return { accessToken, refreshToken };
        
    } catch (error) {
        throw new Error("Error while generating tokens");
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user and include password field
        const user = await User.findOne({ email }).select("+password");
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = await generateTokens(user);

        // Remove sensitive info
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        // Set cookies
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "development"
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                success: true,
                user: loggedInUser,
                accessToken,
                refreshToken
            });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while logging in"
        });
    }
}

export const refreshAccessToken = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token not found"
            });
        }

        // Verify refresh token
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken?._id).select("+refreshToken");
        
        if (!user || incomingRefreshToken !== user?.refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        // Generate new tokens
        const { accessToken, refreshToken } = await generateTokens(user);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                success: true,
                accessToken,
                refreshToken
            });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while refreshing token"
        });
    }
}

export const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: { refreshToken: 1 }
            },
            { new: true }
        );

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json({
                success: true,
                message: "Logged out successfully"
            });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while logging out"
        });
    }
}

export const registerUser = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            role,
            contactNumber,
            addresses
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email ? 
                    "Email already registered" : 
                    "Username already taken"
            });
        }

        // Handle avatar upload
        const avatarLocalPath = req.files?.avatar[0]?.path;
        if(!avatarLocalPath){
            return res.status(400).json({
                success: false,
                message: "Avatar is required"
            });
        }
        const avatar = await uploadOnCloudinary(avatarLocalPath);

        // Create user object based on role
        const userData = {
            username,
            email,
            password,
            role: role || "customer",
            contactNumber,
            avatar: avatar?.url,
            addresses: addresses || [],
            isActive: true
        };

        // If registering as farmer, validate farm details
        if (role === "farmer") {
            const { farmName, location, description} = req.body;
            
            if (!farmName || !location || !description) {
                return res.status(400).json({
                    success: false,
                    message: "Farm details are required for farmer registration"
                });
            }

            // Validate location details
            if (!location.address || !location.city || 
                !location.state || !location.pincode) {
                return res.status(400).json({
                    success: false,
                    message: "Complete farm location details are required"
                });
            }

            // Handle farm photos upload
            const farmPhotosLocalPath = req.files?.farmPhotos[0]?.path;
            if(!farmPhotosLocalPath){
                return res.status(400).json({
                    success: false,
                    message: "Farm photos are required"
                });
            }
            const farmPhotos = await uploadOnCloudinary(farmPhotosLocalPath);

            userData.farmDetails = {
                farmName,
                location: {
                    address: location.address,
                    city: location.city,
                    state: location.state,
                    pincode: location.pincode,
                    coordinates: location.coordinates || undefined
                },
                description,
                farmPhotos: farmPhotos?.url || []
            };
        }

        // Create user
        const user = await User.create(userData);

        // Generate tokens
        const { accessToken, refreshToken } = await generateTokens(user);

        // Get user without sensitive info
        const registeredUser = await User.findById(user._id)
            .select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        };

        return res
            .status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                success: true,
                user: registeredUser,
                message: "User registered successfully"
            });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while registering user"
        });
    }
};

// Update account details (except password and avatar)
export const updateAccountDetails = async (req, res) => {
    try {
        const { 
            username, 
            email, 
            contactNumber, 
            addresses,
            // For farmers
            farmDetails 
        } = req.body;

        if (!username || !email || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing"
            });
        }

        // Check if username/email is already taken by another user
        const existingUser = await User.findOne({
            $or: [
                { email, _id: { $ne: req.user._id } },
                { username, _id: { $ne: req.user._id } }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email ? 
                    "Email already registered with another account" : 
                    "Username already taken"
            });
        }

        // Prepare update object
        const updateData = {
            username,
            email,
            contactNumber
        };

        // Add addresses if provided
        if (addresses) {
            updateData.addresses = addresses;
        }

        // If user is farmer and farmDetails are provided
        if (req.user.role === "farmer" && farmDetails) {
            const { farmName, location, description } = farmDetails;

            if (!farmName || !location || !description) {
                return res.status(400).json({
                    success: false,
                    message: "All farm details are required"
                });
            }

            // Validate location details
            if (!location.address || !location.city || 
                !location.state || !location.pincode) {
                return res.status(400).json({
                    success: false,
                    message: "Complete farm location details are required"
                });
            }

            updateData.farmDetails = {
                farmName,
                location: {
                    address: location.address,
                    city: location.city,
                    state: location.state,
                    pincode: location.pincode,
                    coordinates: location.coordinates || undefined
                },
                description
                // Note: farmPhotos not updated here as it should be handled separately
            };
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: updateData
            },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            success: true,
            message: "Account details updated successfully",
            user
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while updating account details"
        });
    }
};

// Update avatar with previous avatar deletion
export const updateAvatar = async (req, res) => {
    try {
        const avatarLocalPath = req.file?.path;

        if (!avatarLocalPath) {
            return res.status(400).json({
                success: false,
                message: "Avatar file is required"
            });
        }

        // Get current user with avatar
        const currentUser = await User.findById(req.user._id);
        
        // Upload new avatar to cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar.url) {
            return res.status(400).json({
                success: false,
                message: "Error while uploading avatar"
            });
        }

        // Delete previous avatar if exists
        if (currentUser.avatar) {
            const publicId = getPublicIdFromURL(currentUser.avatar);
            await deleteFromCloudinary(publicId);
        }

        // Update user avatar
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            success: true,
            message: "Avatar updated successfully",
            user
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while updating avatar"
        });
    }
};

// Update farm photos with previous photos deletion
export const updateFarmPhotos = async (req, res) => {
    try {
        if (req.user.role !== "farmer") {
            return res.status(403).json({
                success: false,
                message: "Only farmers can update farm photos"
            });
        }

        const farmPhotosLocalPath = req.files?.farmPhotos;

        if (!farmPhotosLocalPath || farmPhotosLocalPath.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Farm photos are required"
            });
        }

        // Get current user with farm photos
        const currentUser = await User.findById(req.user._id);
        
        // Upload new photos to cloudinary
        const uploadPromises = farmPhotosLocalPath.map(file => 
            uploadOnCloudinary(file.path)
        );

        const uploadedPhotos = await Promise.all(uploadPromises);

        // Filter out any failed uploads and get URLs
        const photoUrls = uploadedPhotos
            .filter(photo => photo && photo.url)
            .map(photo => photo.url);

        if (photoUrls.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Error while uploading farm photos"
            });
        }

        // Delete previous farm photos if they exist
        if (currentUser.farmDetails?.farmPhotos?.length > 0) {
            const deletePromises = currentUser.farmDetails.farmPhotos.map(photoUrl => {
                const publicId = getPublicIdFromURL(photoUrl);
                return deleteFromCloudinary(publicId);
            });
            await Promise.all(deletePromises);
        }

        // Update user's farm photos
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    "farmDetails.farmPhotos": photoUrls
                }
            },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            success: true,
            message: "Farm photos updated successfully",
            user
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while updating farm photos"
        });
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Both old and new password are required"
            });
        }

        // Get user with password
        const user = await User.findById(req.user._id).select("+password");

        // Verify old password
        const isPasswordValid = await user.comparePassword(oldPassword);
        
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid old password"
            });
        }

        // Update password
        user.password = newPassword;
        await user.save(); // This will trigger the password hashing pre-save hook

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while changing password"
        });
    }
}; 