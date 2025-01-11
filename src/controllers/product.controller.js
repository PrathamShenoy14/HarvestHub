import { Product } from "../models/product.model.js";
import { uploadOnCloudinary, getPublicIdFromURL, deleteFromCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

export const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            stock,
            category,
            unit // e.g., kg, dozen, pieces
        } = req.body;

        // Check if user is farmer
        if (req.user.role !== "farmer") {
            return res.status(403).json({
                success: false,
                message: "Only farmers can create products"
            });
        }

        // Validate required fields
        if (!name || !description || !price || !stock || !category || !unit) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Handle product images
        const productImagesLocalPath = req.files?.productImages?.map(file => file.path);

        if (!productImagesLocalPath?.length) {
            return res.status(400).json({
                success: false,
                message: "At least one product image is required"
            });
        }

        // Upload images to cloudinary
        const uploadPromises = productImagesLocalPath.map(path => 
            uploadOnCloudinary(path)
        );
        
        const uploadedImages = await Promise.all(uploadPromises);
        const imageUrls = uploadedImages
            .filter(image => image?.url)
            .map(image => image.url);

        if (!imageUrls.length) {
            return res.status(400).json({
                success: false,
                message: "Error while uploading product images"
            });
        }

        // Create product
        const product = await Product.create({
            name,
            description,
            price: Number(price),
            stock: Number(stock),
            category,
            unit,
            images: imageUrls,
            farmer: req.user._id
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while creating product"
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const {
            name,
            description,
            price,
            stock,
            category,
            unit
        } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check if user is the farmer who created the product
        if (product.farmer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own products"
            });
        }

        const updateFields = {};
        
        // Only add fields that are provided
        if (name) updateFields.name = name;
        if (description) updateFields.description = description;
        if (price) updateFields.price = Number(price);
        if (stock) updateFields.stock = Number(stock);
        if (category) updateFields.category = category;
        if (unit) updateFields.unit = unit;

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                $set: updateFields
            },
            {
                new: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while updating product"
        });
    }
};

export const updateProductImages = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check if user is the farmer who created the product
        if (product.farmer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own products"
            });
        }

        // Check if files exist
        const productImagesLocalPath = req.files?.productImages?.map(file => file.path);
        
        if (!productImagesLocalPath?.length) {
            return res.status(400).json({
                success: false,
                message: "No photos provided"
            });
        }

        // Get current product images
        const currentPhotos = product.images || [];
        
        // Calculate how many more photos can be added
        const availableSlots = 5 - currentPhotos.length;

        if (availableSlots <= 0) {
            // Clean up all uploaded files since we can't process them
            const deletePromises = productImagesLocalPath.map(filePath => 
                fs.promises.unlink(filePath)
            );
            
            await Promise.all(deletePromises).catch(err => 
                console.log("Error deleting temp files:", err)
            );

            return res.status(400).json({
                success: false,
                message: "Maximum photo limit (5) reached. Delete some photos first."
            });
        }

        // Separate files into processable and excess
        const filesToProcess = productImagesLocalPath.slice(0, availableSlots);
        const excessFiles = productImagesLocalPath.slice(availableSlots);

        // Delete excess files immediately
        if (excessFiles.length > 0) {
            const deletePromises = excessFiles.map(filePath => 
                fs.promises.unlink(filePath)
            );
            
            await Promise.all(deletePromises).catch(err => 
                console.log("Error deleting excess files:", err)
            );
        }

        // Upload processable files to cloudinary
        const uploadPromises = filesToProcess.map(path => 
            uploadOnCloudinary(path)
        );
        
        const uploadedPhotos = await Promise.all(uploadPromises);
        const newPhotoUrls = uploadedPhotos
            .filter(photo => photo?.url)
            .map(photo => photo.url);

        // Add new photos to existing ones
        const updatedPhotos = [
            ...currentPhotos,
            ...newPhotoUrls
        ];

        // Update product with new photos
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                $set: {
                    images: updatedPhotos
                }
            },
            {
                new: true
            }
        );

        return res.status(200).json({
            success: true,
            message: `Added ${newPhotoUrls.length} photos successfully. ${excessFiles.length ? `${excessFiles.length} photos were skipped due to limit.` : ''}`,
            product: updatedProduct,
            photosAdded: newPhotoUrls.length,
            photosSkipped: excessFiles.length,
            totalPhotos: updatedPhotos.length,
            remainingSlots: 5 - updatedPhotos.length
        });

    } catch (error) {
        // Ensure cleanup in case of any error
        if (productImagesLocalPath?.length) {
            const deletePromises = productImagesLocalPath.map(filePath => 
                fs.promises.unlink(filePath)
            );
            
            await Promise.all(deletePromises).catch(err => 
                console.log("Error deleting temp files:", err)
            );
        }

        return res.status(500).json({
            success: false,
            message: error?.message || "Error while updating product images"
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check if user is the farmer who created the product
        if (product.farmer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own products"
            });
        }
        // Delete all images from Cloudinary
        const publicIds = product.images.map(getPublicIdFromURL);
        const deletePromises = publicIds.map(publicId => deleteFromCloudinary(publicId));
        await Promise.all(deletePromises);

        await Product.findByIdAndDelete(productId);

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while deleting product"
        });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId)
            .populate("farmer", "username email contactNumber addresses");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while fetching product"
        });
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10,
            category,
            minPrice,
            maxPrice,
            sort = "createdAt",
            order = "desc"
        } = req.query;

        const query = {};

        // Add filters
        if (category) query.category = category;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const products = await Product.find(query)
            .populate("farmer", "username email contactNumber addresses")
            .sort({ [sort]: order })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Product.countDocuments(query);

        return res.status(200).json({
            success: true,
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while fetching products"
        });
    }
};

export const getMyProducts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10,
            sort = "createdAt",
            order = "desc"
        } = req.query;

        // Check if user is farmer
        if (req.user.role !== "farmer") {
            return res.status(403).json({
                success: false,
                message: "Only farmers can access their products"
            });
        }

        // Find products where farmer is the logged-in user
        const products = await Product.find({ farmer: req.user._id })
            .sort({ [sort]: order })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Product.countDocuments({ farmer: req.user._id });

        return res.status(200).json({
            success: true,
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while fetching your products"
        });
    }
};

export const deleteProductPhoto = async (req, res) => {
    try {
        const { productId } = req.params;
        const { photoUrl } = req.body;

        if (!photoUrl) {
            return res.status(400).json({
                success: false,
                message: "Photo URL is required"
            });
        }

        // Find the product
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check if user is the farmer who created the product
        if (product.farmer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only delete photos from your own products"
            });
        }

        // Check if photo exists in product
        if (!product.images.includes(photoUrl)) {
            return res.status(404).json({
                success: false,
                message: "Photo not found in product"
            });
        }

        // Prevent deletion of last photo
        if (product.images.length <= 1) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete the last photo. Products must have at least one photo"
            });
        }

        // Extract public ID from Cloudinary URL
        const publicId = getPublicIdFromURL(photoUrl);
        await deleteFromCloudinary(publicId);
        // Update product removing the photo
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                $pull: {
                    images: photoUrl
                }
            },
            {
                new: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Product photo deleted successfully",
            product: updatedProduct,
            remainingPhotos: updatedProduct.images.length,
            availableSlots: 5 - updatedProduct.images.length
        });

    } catch (error) {
        console.log("Delete product photo error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Error while deleting product photo"
        });
    }
};
