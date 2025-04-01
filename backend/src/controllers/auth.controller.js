import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { getPublicIdFromURL } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import {encrypt} from '../utils/crypto.js'

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
            role="customer",
            password,
            contactNumber,
            // Address fields
            street,
            city,
            state,
            pincode,
        } = req.body;

        // Validate required fields
        if (!username || !email || !password || !contactNumber || 
            !street || !city || !state || !pincode) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check if user exists
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

        // Handle file uploads
        const avatarLocalPath = req.file?.path;

        if (!avatarLocalPath) {
            return res.status(400).json({
                success: false,
                message: "Avatar file is required"
            });
        }

        // Upload avatar
        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar.url) {
            return res.status(400).json({
                success: false,
                message: "Error while uploading avatar"
            });
        }

        // Create address object
        const address = {
            type:"home",
            street,
            city,
            state,
            pincode,
            isDefault: true
        };

        // Create base user data
        const userData = {
            username,
            email,
            password,
            role:"customer",
            contactNumber,
            avatar: avatar.url,
            addresses: [address]
        };

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
                message: `${role === "farmer" ? "Farmer" : "User"} registered successfully`
            });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while registering user"
        });
    }
};

export const registerFarmer = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            role,
            contactNumber,
            // Address fields
            street,
            city,
            state,
            pincode,
            // Farmer specific fields
            farmName,
            farmDescription,
            bankAccountHolderName,
            bankAccountNumber,
            ifscCode,
            bankName,
        } = req.body;

        console.log("Request Body:", req.body);
        console.log("Request Files:", req.files);   

        // Validate required fields
        if (!username || !email || !password || !contactNumber || !bankAccountNumber || !bankName ||
            !street || !city || !state || !pincode || !bankAccountHolderName || !ifscCode) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }


        // Check if user exists
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

        // Handle file uploads
        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        const farmPhotosLocalPaths = req.files?.farmPhotos?.map(file => file.path);

        if (!avatarLocalPath) {
            return res.status(400).json({
                success: false,
                message: "Avatar file is required"
            });
        }

        // Upload avatar
        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar.url) {
            return res.status(400).json({
                success: false,
                message: "Error while uploading avatar"
            });
        }

        // Create address object
        const address = {
            type: role === "farmer" ? "farm" : "home",
            street,
            city,
            state,
            pincode,
            isDefault: true
        };
        const encryptedBankAccountNumber = encrypt(bankAccountNumber);
        const encryptedIfscCode = encrypt(ifscCode);
        const encryptedBankName = encrypt(bankName);

        // Create base user data
        const userData = {
            username,
            email,
            password,
            role: role || "customer",
            contactNumber,
            avatar: avatar.url,
            addresses: [address],
            bankAccountHolderName,
            bankAccountNumber: encryptedBankAccountNumber,
            ifscCode: encryptedIfscCode,
            bankName: encryptedBankName
        };

        // Add farmer specific data
        if (role === "farmer") {
            // Upload farm photos if provided
            let farmPhotos = [];
            if (farmPhotosLocalPaths?.length > 0) {
                const uploadPromises = farmPhotosLocalPaths.map(path => 
                    uploadOnCloudinary(path)
                );
                const uploadedPhotos = await Promise.all(uploadPromises);
                farmPhotos = uploadedPhotos
                    .filter(photo => photo?.url)
                    .map(photo => photo.url);
            }
            
            userData.farmDetails = {
                farmName,
                farmDescription,
                farmPhotos
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
                message: `${role === "farmer" ? "Farmer" : "User"} registered successfully`
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
            street,
            city,
            state,
            pincode,
            farmName,
            farmDescription,
            bankAccountHolderName,
            bankAccountNumber,
            ifscCode,
            bankName,
        } = req.body;

        // Check for unique fields before updating
        if (username || email) {
            const existingUser = await User.findOne({
                _id: { $ne: req.user._id }, // Exclude current user
                $or: [
                    ...(username ? [{ username }] : []),
                    ...(email ? [{ email }] : [])
                ]
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: existingUser.username === username 
                        ? "Username already taken"
                        : "Email already registered"
                });
            }
        }

        // Create update object
        const updateData = {};

        // Update basic fields if provided
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (contactNumber) updateData.contactNumber = contactNumber;

        // Update address if any address field is provided
        if (street || city || state || pincode) {
            const user = await User.findById(req.user._id);
            const currentAddress = user.addresses[0] || {};

            updateData["addresses.0"] = {
                type: user.role === "farmer" ? "farm" : "home",
                street: street || currentAddress.street,
                city: city || currentAddress.city,
                state: state || currentAddress.state,
                pincode: pincode || currentAddress.pincode,
                isDefault: true
            };
        }

        // Update farm details if user is farmer
        if (req.user.role === "farmer") {
            if (bankAccountHolderName) updateData.bankAccountHolderName = bankAccountHolderName;
            if (bankAccountNumber) {
                const encryptedBankAccountNumber = encrypt(bankAccountNumber);
                updateData.bankAccountNumber = encryptedBankAccountNumber.encryptedData; // Store encrypted data
            }
            if (ifscCode) {
                const encryptedIfscCode = encrypt(ifscCode);
                updateData.ifscCode = encryptedIfscCode.encryptedData; // Store encrypted data
            }
            if (bankName) {
                const encryptedBankName = encrypt(bankName);
                updateData.bankName = encryptedBankName.encryptedData; // Store encrypted data
            }
            if (farmName || farmDescription) {
                const currentUser = await User.findById(req.user._id);
                updateData.farmDetails = {
                    ...currentUser.farmDetails,
                    ...(farmName && { farmName }),
                    ...(farmDescription && { farmDescription })
                };
            }
        }

        // If no fields to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one field to update"
            });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: updateData
            },
            {
                new: true
            }
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
                message: "Only farmers can update farm photos",
            });
        }

        const { index } = req.body; // Index of the photo to replace
        const farmPhotosLocalPaths = req.files?.farmPhotos?.map(file => file.path);

        if (!farmPhotosLocalPaths?.length) {
            return res.status(400).json({ success: false, message: "No photos provided" });
        }

        // Fetch current user
        const currentUser = await User.findById(req.user._id);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let updatedPhotos = currentUser.farmDetails?.farmPhotos || [];

        // ✅ Enforce max limit of 3
        if (updatedPhotos.length > 3) {
            return res.status(400).json({ success: false, message: "Max 3 photos allowed." });
        }

        // ✅ Only allow replacing existing photos
        if (index === undefined || index < 0 || index >= updatedPhotos.length) {
            return res.status(400).json({ success: false, message: "Invalid index. Can only replace existing photos." });
        }

        // ✅ Delete old photo from Cloudinary (if valid URL)
        if (updatedPhotos[index]?.startsWith("http")) {
            const publicId = getPublicIdFromURL(updatedPhotos[index]);
            if (publicId) {
                await deleteFromCloudinary(publicId);
            }
        }

        // ✅ Upload new photo to Cloudinary
        const uploadResponse = await uploadOnCloudinary(farmPhotosLocalPaths[0]);
        if (!uploadResponse?.url) {
            return res.status(500).json({ success: false, message: "Cloudinary upload failed" });
        }

        // ✅ Replace the specific photo
        updatedPhotos[index] = uploadResponse.url;

        // ✅ Save updated farm photos in DB
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { "farmDetails.farmPhotos": updatedPhotos } },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            success: true,
            message: "Photo replaced successfully!",
            user,
        });

    } catch (error) {
        // ❌ Ensure temp files are always deleted
        farmPhotosLocalPaths?.forEach(filePath => fs.promises.unlink(filePath).catch(err => console.log("Cleanup Error:", err)));

        return res.status(500).json({ success: false, message: error?.message || "Server error" });
    }
};

// Add a controller to delete specific photos
export const deleteFarmPhoto = async (req, res) => {
    try {
        // Check if user is farmer
        if (req.user.role !== "farmer") {
            return res.status(403).json({
                success: false,
                message: "Only farmers can delete farm photos"
            });
        }

        const { photoUrl } = req.body;

        if (!photoUrl) {
            return res.status(400).json({
                success: false,
                message: "Photo URL is required"
            });
        }

        // Get current user
        const currentUser = await User.findById(req.user._id);

        // Check if photo exists in farm photos
        if (!currentUser.farmDetails?.farmPhotos?.includes(photoUrl)) {
            return res.status(404).json({
                success: false,
                message: "Photo not found in farm photos"
            });
        }

        // Prevent deletion of last photo
        if (currentUser.farmDetails?.farmPhotos?.length <= 1) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete the last photo. Farm must have at least one photo"
            });
        }

        // Extract public ID from Cloudinary URL
        const publicId = getPublicIdFromURL(photoUrl);
        await deleteFromCloudinary(publicId);
        // If Cloudinary delete was successful, update database
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: {
                    "farmDetails.farmPhotos": photoUrl
                }
            },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            success: true,
            message: "Farm photo deleted successfully",
            user,
            remainingPhotos: user.farmDetails?.farmPhotos?.length || 0,
            availableSlots: 5 - (user.farmDetails?.farmPhotos?.length || 0)
        });

    } catch (error) {
        console.log("Delete farm photo error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while deleting farm photo"
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

export const deleteAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Check if user has an avatar
        if (!user.avatar) {
            return res.status(400).json({
                success: false,
                message: "No avatar found to delete"
            });
        }

        // Delete from Cloudinary
        const publicId = getPublicIdFromURL(user.avatar);
        await deleteFromCloudinary(publicId);

        // Update user with default avatar or null
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    avatar: "" // or set to default avatar URL if you have one
                }
            },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            success: true,
            message: "Avatar deleted successfully",
            user: updatedUser
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while deleting avatar"
        });
    }
}; 