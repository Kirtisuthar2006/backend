import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from  "../models/user.model.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt, { verify } from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave:false })
        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500," Something went wrong while generating tokens")
        
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation - not empty
    //check if user already exists:username, email
    //check for images, check for avatar
    //upload them to cloudinary,avatar
    //craete user object- craete entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response

    const {fullName, email, username, password} = req.body 
    //console.log("email: ",email)

    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ){
        // throw new ApiError(400, "All fields are required")
        return res.json({success: false, message: "All fields are required"})
    }

    const existedUser = await User.findOne({
        $or: [{ username },{ email } ]
    })
    if(existedUser){
        // throw new ApiError(409, "User already exists with this email/username")
        return res.json({success: false, message: "User already exists with this email/username"})
    }
/*
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

   const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;*/
/*
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }
        */
console.log("FILES RECEIVED:", req.files);

const avatarLocalPath = req.files?.avatar?.[0]?.path;
//const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

let coverImageLocalPath;

if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
coverImageLocalPath = req.files.coverImage[0].path;

    
}

if(!avatarLocalPath){
    // throw new ApiError(400, "Avatar file is required");
    return res.json({success: false, message: "Avatar file is required"});
}
const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        // throw new ApiError(400, "Avatar file is required")
        return res.json({success: false, message: "Avatar file is required"});
    }
/*
const avatar = await uploadOnCloudinary(avatarLocalPath);
let coverImage = null;
if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
}*/


    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "Something went wrong  while registering the user ")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User has been registered successfully")
    )






})

const loginUser = asyncHandler(async(req, res) => {
    // req body - data 
    // username,email 
    // find user based on username/email
    // password check 
    // access and refress token
    //send cookie
    const {email, username, password} = req.body

    if (!(email || username)) {
    throw new ApiError(400, "Email or username is required to login");
}
console.log("Searching for:", username, email);

    const user = await User.findOne({
    $or: [{ username: username?.trim().toLowerCase() }, { email: email?.trim().toLowerCase( ) }]
});
console.log("🟩 Login Request Body:", req.body);


    if(!user){
        throw new ApiError(404, "User does not exist")    
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid login credentials")    
    }
    const {accessToken,refreshToken} = await generateAccessRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")//to exclude these fields from response

    const options  = {
        httpOnly:true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options) 
    .cookie("refreshToken", refreshToken, options)  //to store tokens in cookies
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken, 
            },
            "User has been logged in successfully"
        ) 
    ) 

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new : true
        }
    )
    //clear cookies
    const options  = {
        httpOnly:true,
        secure: true,
    }
    return res 
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User has been logged out successfully"))
    
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request - no refresh token")

    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token - user does not exist")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "refresh token is used ")
        }
    
        const options = {
            httpOnly:true,
            secure:true,
        }
    
        const {accessToken,newRefreshToken} = await generateAccessRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken,
                },
                "Access token has been refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token" )
        
    }


})

const changeCurrentPassword = asyncHandler(async(res,req) =>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword) 

    if(!isPasswordCorrect){
        throw new ApiError(400, "Old password is incorrect")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200)
    .json(new ApiResponse(200,{},"password has been changed successfully"))


}) 

const getCurrentUser = asyncHandler(async(req,res) =>{
    return res.status(200)
    .json(new ApiResponse
        (200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) =>{

    const {fullName,email,} = req.body
    if(!fullName || !email){
        throw new ApiError(400, "Fullname and email are required")
    }

    const user = await  User.findByIdAndUpdate(
        req.user?._id,
        {
                $set:{
                    fullName,
                    email:email,
                }
        },
        {new:true}//to return updated user
    
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Something went wrong while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
                $set:{
                    avatar:avatar.url,
                }
        },
        {
            new:true,
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar has been updated successfully"))
})


const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(500, "Something went wrong while uploading coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
                $set:{
                    coverImage:coverImage.url,
                }
        },
        {
            new:true,
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user, "User coverImage has been updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req,res) => {  
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400, "Username is required")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "Subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"              

            }
        },
        {
            $lookup:{
                from: "Subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo   "

            }
        },
        {
            $addFields:{
                subscribersCount: { 
                    $size: "$subscribers" 
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond:{
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))

})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};