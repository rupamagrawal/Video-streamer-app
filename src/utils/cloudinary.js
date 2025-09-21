import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_SECREAT_KEY,
});

const uplodeOnCloudinary = async(localFilePath)=>{
    try {
        if(!localFilePath)return null;
        //uplode file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto"})
        //file has been uploded successfully
        console.log("File has been uploded successfully ", response);
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFilePath)// remove the temperorily locally saved file as the operation got failed
        return null;
    }
}

export {uplodeOnCloudinary}