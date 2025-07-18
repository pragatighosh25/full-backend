import {v2 as cloudinary} from 'cloudinary';
import { response } from 'express';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try{
    if(!localFilePath) return null
    // Upload the file to Cloudinary
   const reponse= await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto'
    })
    //file has been uploaded successfully
    console.log('File uploaded successfully:', response.url);
    return response;
  } catch (error){
    fs.unlinkSync(localFilePath); // Delete the local file if upload fails
    console.error('Error uploading file to Cloudinary:', error);
    return null;
  }
}

export default uploadOnCloudinary;