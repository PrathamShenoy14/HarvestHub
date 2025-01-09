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
        const response = await cloudinary.uploader.upload(localFilePath)
        // file has been uploaded successfull
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        console.log(error);
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

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



export {uploadOnCloudinary,deleteOnCloudinary}