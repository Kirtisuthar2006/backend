import { ApiError } from "../utils/ApiError"
import { asyncHandler } from "../utils/asyncHandler"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model"


export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        //get token from headers or cookies
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")//optional chaining
        if(!token){
            throw new ApiError(401, "Not authorized, token is missing") 
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")//to exclude these fields from response
    
        if(!user){
    
            //TODO : logout user from frontend
            throw new ApiError(401, "invalid access token, user not found")
        }
    
        req.user = user; //attach user to req object so that we can access it in next middlewares or controllers
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Not authorized, token is invalid") 
        
    } 

}) // newt is to move to next middleware or controller