import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from 'dotenv';
dotenv.config({
    path:'./.env'
});

cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // File has been uploaded successfully
        // Now remove the locally saved temp file
        await fs.promises.unlink(localFilePath); // Using promises version for proper async handling

        return response;

    } catch (error) {
        // Remove the locally saved temp file as the upload operation failed
        await fs.promises.unlink(localFilePath).catch(unlinkError => {
            console.log("Error while removing temp file:", unlinkError);
        });
        
        return null;
    }
};

const deleteOnCloudinary = async(publicId) =>{
    try{
        if (!publicId) return null;
        const response = await cloudinary.uploader.destroy(publicId)
        return response
    }catch(error){
        console.log(error);
        return null;
    }
}

export const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        
        // Delete file from cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.log("Cloudinary delete error:", error);
        return null;
    }
};

export const getPublicIdFromURL = (url) => {
    if (!url) return null;
    const splitUrl = url.split('/');
    const publicIdWithExtension = splitUrl[splitUrl.length - 1];
    return publicIdWithExtension.split('.')[0]; // Remove file extension
};

export {uploadOnCloudinary,deleteOnCloudinary}