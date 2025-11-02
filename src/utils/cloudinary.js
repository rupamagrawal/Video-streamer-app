import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECREAT_KEY,
});

const uplodeOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //uplode file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been uploded successfully
    // console.log("File has been uploded successfully ", response);
    // console.log("response: ");
    // console.log(response);

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the temperorily locally saved file as the operation got failed
    return null;
  }
};

// Extract public_id from Cloudinary URL
const extractPublicId = (url) => {
  try {
    if (!url) return null;
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/foldername/abcd1234.jpg
    const parts = url.split("/");
    const fileWithExt = parts.pop(); // abcd1234.jpg
    const publicId = fileWithExt.split(".")[0]; // abcd1234
    return publicId;
  } catch (error) {
    console.error("Error extracting public ID:", error.message);
    return null;
  }
};

const deleteFromCloudinary = async (pId) => {
  try {
    if (!pId) return null;
    const result = await cloudinary.uploader.destroy(pId);
    return result;
  } catch (error) {
    console.error("Cloudinary deletion failed:", error.message);
    return null;
  }
};

export { uplodeOnCloudinary, deleteFromCloudinary, extractPublicId };
