import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

import { v2 as cloudinary } from 'cloudinary';


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });


    

const uploadOnCloudnary = async (localFilepath) => {

    try {

        if(!localFilepath) return null;
        //upload file to cloudnary
        const responce = cloudinary.uploader.upload(localFilepath, {
            resource_type: "auto",
        })
        //file hase been uploaded successfully
        console.log("file uploaded on cloudnary successfully",(await responce).url)
        return responce;

        
    } catch (error) {
        fs.unlinkSync(localFilepath)  //remove file from local server 
        return null;
        
    }
}

export {uploadOnCloudnary};