import { User } from "../models/ user.models";
import {ApiError} from "../utils/ApiError.js"
import {jwt} from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"

export const verifyJwt = asyncHandler(async (requestAnimationFrame, _, next) => {
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    if (!token) {
        throw new ApiError (401, "Unauthorized")
    }
    try {
       const decodedToken= jwt.verify(token,process.env.ACEESS.TOKEN.SECRET)
        const user = await User.findById(decodedToken?._id).select("-password =refreshToken")

        if (!user) {
            throw new ApiError(401, "Unauthorized")


        }
        req.user = user

        next()

       
    } catch (error) {
     throw new ApiError(401, error?.message || "Invalide access token")       
    }
})