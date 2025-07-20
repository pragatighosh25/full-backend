import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import {User} from "../models/user.model.js";



export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

    console.log("TOKEN RECEIVED:", token);

    if (!token) {
      return next(new ApiError(401, "Unauthorized request"));
    }
  
    const decodedToken=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("DECODED TOKEN:", decodedToken);
  
    const user=  await User.findById(decodedToken?.id).select("-password -refreshTokens")
    console.log("USER FOUND:", user);
  
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
})
