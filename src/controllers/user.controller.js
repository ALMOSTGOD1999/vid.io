import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/ user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import { ApiResponse } from "../utils/ApiResponse.js";
import { subscribe } from "diagnostics_channel";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken }
  } catch (error) {
    console.log(error);
    then new ApiError(500, "Something went wrong while generating ")
    
  }
}

  const registerUser = asyncHandler(async (req, res) => {
  
      // get user details from frontend threw POSTMAN
    // validation - data not empty
    // check if user already exist or not. check    username, email.
    // check for images, check for avatar
    // upload image & avatar to cloudinary 
    // create user object - create entry in DB
    // remove password and refresh token field from response
    // check for user creation
    // return response
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

  const avatar = await uploadOnCloudinary(avatarLocalPath);

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

  if (!email && !username) {
    throw new ApiError(400, "username and email is required");
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
    {
      $unset: {
        refreshToken:1,
    
      }
    }, {
    new: true
  })

  const options = {
    httpOnly: true,
    secure: (process.env.NODE_ENV = "production")
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))


})

//refreshtoken generating
      
const refreshAccessToken = asyncHandler(async (req, res) => {
  const inComingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!inComingRefreshToken) {
    throw new ApiError(401, "Unauthorised user")
  }
    
try {
  const decodedToken = jwt.verify(
    inComingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  )
  const user = await User.findById(decodedToken._id)

  if (!user) {
    throw new ApiError(401, "Invalid refresh token")
  }

  if (inComingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

     generateAccessAndRefreshTokenreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
     catch (error) {
  throw new ApiError (500,"Something went wrong while refreshin access token")
}

})
// password change controller
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })
  return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
 })

const getCurrentUser = asyncHandler(async (req, res) => { 
  return res 
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => { 

  const { fullName, password } = req.body
  
  if (!fullName || ![password]) {
    throw new ApiError(400, "All fields are required")
  }
  const user = await user.findByIdAndUpdate(
  req.user?._id,
{  $set:{ fullName, email}}
  )
})

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar")
  }

  const user = await user.findByIdAndUpdate(
    req.user?._id,
    {
      $set:
        { avatar: avatar.url }
    },
    { new: true }
  ).select("-password")

  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar updated successfully"))
  
})



const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path
  
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Coverimage not found")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"))
})
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.param
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing")
  }
  const channel = await User.aggregate([
    //here we matching user
    {
      $match: {
        username: username?.toLowerCase()
  
      }
    },

    //here we counting how many subscriber via channel
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foregnField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foregnField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubcribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },

    //here we sending selected values only.
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubcribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        
      }
    }
  ])

  //console.log(channel)

  if (!channel?.length) {
    throw new ApiError(404, "Channel doesn't exists")
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully.")
    )

})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foregnField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "user",
              localField: "owner",
              foregnField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar:1,
                  }
                }
              ]
          }
        
        
      }
    , {
      $addFields: {
        owner: {
          $first: "$owner"
        }
      }
    }
  ]}
}])

return res
  .status(200)
  .json(
    new ApiError(
      200,
      user,
      user[0].watchHistory,
      "Watch history fetched successfully"
      )
)
    })

export { registerUser, loginUser, refreshAccessToken, logoutUser,changeCurrentPassword, getCurrentUser,updateAccountDetails,updateCoverImage,getWatchHistory, updateAvatar,getUserChannelProfile};
                          