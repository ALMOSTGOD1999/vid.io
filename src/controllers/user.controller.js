import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/ user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, userName, password } = req.body;

  //validation
  if (
    //fullname?.trim() === ""
    [fullname, email, userName, password].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are require");
  }

  const existedUser = await User.findOne({ $or: [{ userName }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "user with same username or email exists");
  }

  console.warn(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(409, "Avatar is missing");
  }

  // const avatar = await uploadOnCloudinary(avatarLocalPath);

  // let coverImage = "";
  // if (coverLocalPath) {
  //   coverImage = await uploadOnCloudinary(coverImage);
  // }

  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatar);
    console.log("Uploaded avatar", avatar);
  } catch (error) {
    console.log("Error uploading avatar");
    throw new ApiError(500, "Failed to upload avatar");
  }

  let coverImage;
  try {
    avatar = await uploadOnCloudinary(coverLocalPath);
    console.log("Uploaded avatar", coverImage);
  } catch (error) {
    console.log("Error uploading coverImage");
    throw new ApiError(500, "Failed to upload coverImage");
  }

  try {
    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      userName: userName.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering a user");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, "User registered successfully"));
  } catch (error) {
    console.log("user creation failed");

    if (avatar) {
      await deleteFromCloudinary(avatar.public_Id);
    }
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_Id);
    }

    throw new ApiError(
      500,
      "Something were wrong while registering a user and images were deleted.",
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  // get data from body
  const { email, userName, password } = req.body;

  //validation

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  //validate password

  const isPasswordValid = await user.isPasswordValid(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user passwords.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );
  const loggedInUser = await User.findById(user._id).select(
    "-refreshToken - password",
  );
  const options = {
    httpOnly: true,
    secure: (process.env.NODE_ENV = "production"),
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully",
      ),
    );
}); 

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,

  )
})
// refresh token generating
const refreshAccessToken = asyncHandler(async (req, res) => {
  const inComingRefreshAccessToken = req.cookies.refreshAccessToken || req.body.refreshAccessToken

  if (!refreshAccessToken) {
    throw new ApiError(401, "Refresh token is required")
    
    try {
  const decodedToken = jwt.verify(
    inComingRefreshAccessToken,
    process.env.REFRESH_TOKEN_SECRET
  )
  const user =await User.findById(decodedToken._id)

  if (!user) {
    throw new ApiError(401, "Invalid refresh token")
  }

  if (inComingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401,"Invalid user token.")
  } 

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  }
  const { accessToken, refreshToken } = await
    generateAccessAndRefreshToken(user._id)
  await generateAccessAndRefreshToken(user._id)
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200, {
      accessToken,
      refreshToken: newRefreshToken}, "Access token refreshed successfully"))


} catch (error) {
  throw new ApiError (500,"Something went wrong while refreshin access token")
}
}
})




export { registerUser, loginUser, refreshAccessToken };
