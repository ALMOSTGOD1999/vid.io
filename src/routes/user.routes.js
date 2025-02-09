import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/c/:username").post(verifyJwt, logoutUser);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/update-account").patch(verifyJwt, updateAccountDetails);
router.route("/avatar").patch(verifyJwt, upload.single(avatar), updateAvatar);
router
  .route("/cover-image")
  .patch(verifyJwt, upload.single(coverImage), updateAvatar);
rputer.route("/history").post(verifyJwt, getWatchHistory);

export default router;
