import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../models/user.model.js'; 
import uploadOnCloudinary from '../utils/cloudinary.js'
import ApiResponse from '../utils/ApiResponse.js';

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

  const {fullname, email, username, password}= req.body;
  console.log("email:", email);

  /*if(fullname=== ""){
    throw new ApiError(400, "fullname is required")
  }
  */

  if(
    [fullname, email, password, username].some((field)=>field?.trim()=== "")
  ){
    throw new ApiError(400, "All fields are required")
  }
  
  const exsistedUser= await User.findOne({
    $or: [{username}, {email}]
  })
  if(exsistedUser){
    throw new ApiError(409, "User with email or username already exsists")
  }

  const avatarLocalPath= req.files?.avatar[0]?.path;
  const coverImageLocalPath= req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar= await uploadOnCloudinary(avatarLocalPath)
  const coverImage= await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }

  const user= await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  })
  
  const createdUser= await User.findById(user._id).select(
    "-password -refreshTokens"
  )
  if (!createdUser){
    throw new ApiError(500, "Error while creating user")
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, "user registered successfully")
  )
})

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

  const {email,username, password} = req.body;
  if (!email || !username) {
    throw new ApiError(400, "Email or username is required")
  }

  const user = await User.findOne({
    $or: [{email}, {username: username.toLowerCase()}]
  })
  if (!user) {
    throw new ApiError(404, "User not found")
  }
  
  if (!password) {
    throw new ApiError(400, "Password is required")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password")
  }

  const accessToken = user.generateAccessToken()
  const refreshToken = user.generateRefreshToken()

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  })

  return res.status(200).json(
    new ApiResponse(200, {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullname: user.fullname,
      },
      accessToken,
      refreshToken,
    }, "User logged in successfully")
  )
})
export default { registerUser, loginUser };