import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../models/user.model.js'; 

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
  
  const exsistedUser= User.findOne({
    $or: [{username}, {email}]
  })
  if(exsistedUser){
    throw new ApiError(409, "User with email or username already exsists")
  }

  req.files?.avatar[0]?.path
})

export default registerUser;