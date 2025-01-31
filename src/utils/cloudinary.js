import { v2 as cloudinary } from "cloudinary";
import { log } from "console";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

//configure cloudinary

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    // console.log("Cloudinary Config :", {
    //   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    //   api_key: process.env.CLOUDINARY_API_KEY,
    //   api_secret: process.env.CLOUDINARY_API_SECRET,
    // });

    if (!localFilePath) return null;
    cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File uploaded to cloudinary.File src : " + response.url);

    // once the file is uploaded , we would like to delety it from the server
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("Error on Cloudinary", error);

    fs.unlinkSync(localFilePath);
    return null;
  }
};
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("file deleted successfully. public Id", publicId);
  } catch (error) {
    console.log("error whilw deleteing file", error);
  }
};
export { uploadOnCloudinary, deleteFromCloudinary };
