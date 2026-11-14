import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import bannerSchema from "./banner.validation";
import { BannerController } from "./banner.controller";
import { videoUpload } from "../../utils/uploadVideoMiddleware";

const router = express.Router();

// Public reads
router.get("/", BannerController.getAllBanner);
router.get("/:id", BannerController.getSingleBanner);

// Admin video upload -> Cloudinary
router.post(
  "/upload-video",
  auth(Role.ADMIN, Role.MANAGER),
  videoUpload.single("video"),
  BannerController.uploadVideo,
);

// Admin-only writes
router.post(
  "/create-banner",
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(bannerSchema),
  BannerController.createNewBanner,
);
router.patch(
  "/:id",
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(bannerSchema),
  BannerController.updateBanner,
);
router.delete("/:id", auth(Role.ADMIN, Role.MANAGER), BannerController.deleteBanner);

export const BannerRoutes = router;
