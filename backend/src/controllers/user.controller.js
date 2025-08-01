import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { use } from "react";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshTokens = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating refresh and access tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validate user details are not empty
  //check if user already exists: via email or username
  //if user exists, return error
  //check for images, check for avatar
  //upload them to cloudinary, avatar is mandatory
  //create user object- create user in database
  //remove password and refresh token from response
  //check if user is created successfully
  //return success response with user details

  const { fullname, email, username, password } = req.body;
  console.log("email:", email);

  /*if(fullname=== ""){
    throw new ApiError(400, "fullname is required")
  }
  */

  if (
    [fullname, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const exsistedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (exsistedUser) {
    throw new ApiError(409, "User with email or username already exsists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshTokens"
  );
  if (!createdUser) {
    throw new ApiError(500, "Error while creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //username or email login
  //find the user
  //if user not found, return error
  //check if password is correct
  //if password is incorrect, return error
  //generate access token
  //generate refresh token
  //return success response with user details and tokens
  //send cookies

  const { email, username, password } = req.body;
  if (!(email || username)) {
    throw new ApiError(400, "Email or username is required");
  }

  const user = await User.findOne({
    $or: [
      email ? { email } : null,
      username ? { username: username.toLowerCase() } : null,
    ].filter(Boolean), // remove nulls
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshTokens"
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshTokens: undefined } },
    { new: true }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .clearCookie("accessToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?.id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshTokens) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?.id);
  const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isOldPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, fullname } = req.body;

  if (!email || !fullname) {
    throw new ApiError(400, "Email and fullname are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    {
      $set: {
        email,
        fullname,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading coverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));  
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  //get username from url(params)
  const { username } = req.params;

  //if username is not found, error
  if (!username) {
    throw new ApiError(404, "User not found");
  }

  const channel = await User.aggregate([
    // Match the user by username
    {
      $match: { username: username?.toLowerCase() },
    },
    //lookup for how many subscribers does the channel have
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel", //count occurance of channel to find subscribers
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber", //count occurance of subscriber to find channels subscribed to
        as: "subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount: { $size: "$subscribers" }, //add subscribers count
        subscribedToCount: { $size: "$subscribedTo" }, //add subscribed to count
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] }, //is user.id in subscribers.subscriber(if yes, then true, else false)
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      }
    }
  ]);

  if (channel?.length === 0) {
    throw new ApiError(404, "channel does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel profile fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  //get user id from req.user
  const user = await User.aggregate([
    // Match the user by ID
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user._id) }
    },
    // Lookup to get the watch history
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              "owner": { $first: "$owner" } //get the first owner from the array
            }
          }
        ]
      }
    },
  ]);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
