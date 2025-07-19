import asyncHandler from "../utils/asyncHandler";


export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken ||
  req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return next(new ApiError(401, "Unauthorized request"));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new ApiError(403, "Forbidden"));
    }
    req.user = decoded;
    next();
  });
});
