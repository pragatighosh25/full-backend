import { Router } from "express";
import  { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory} from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const userRouter = Router();

userRouter.route('/register').post(
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1}
  ]),
  registerUser
);

userRouter.route('/login').post(loginUser);

//secured routes
userRouter.route('/logout').post(verifyJWT, logoutUser);
userRouter.route('/refresh-token').post(refreshAccessToken);
userRouter.route('/change-password').post(verifyJWT, changeCurrentPassword);
userRouter.route('/current-user').post(verifyJWT, getCurrentUser);
userRouter.route('/update-account').patch(
  verifyJWT, updateAccountDetails
);
userRouter.route('/update-avatar').patch(
  verifyJWT, upload.single('avatar'), updateUserAvatar
);
userRouter.route('/update-coverImage').patch(
  verifyJWT, upload.single('coverImage'), updateUserCoverImage
);

userRouter.route('/c/:username').get(verifyJWT, getUserChannelProfile)
userRouter.route('/history').get(verifyJWT, getWatchHistory)

export default userRouter;