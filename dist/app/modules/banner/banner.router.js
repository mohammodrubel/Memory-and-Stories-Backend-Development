"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannerRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const banner_validation_1 = __importDefault(require("./banner.validation"));
const banner_controller_1 = require("./banner.controller");
const uploadVideoMiddleware_1 = require("../../utils/uploadVideoMiddleware");
const router = express_1.default.Router();
// Public reads
router.get("/", banner_controller_1.BannerController.getAllBanner);
router.get("/:id", banner_controller_1.BannerController.getSingleBanner);
// Admin video upload -> Cloudinary
router.post("/upload-video", (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), uploadVideoMiddleware_1.videoUpload.single("video"), banner_controller_1.BannerController.uploadVideo);
// Admin-only writes
router.post("/create-banner", (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(banner_validation_1.default), banner_controller_1.BannerController.createNewBanner);
router.patch("/:id", (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(banner_validation_1.default), banner_controller_1.BannerController.updateBanner);
router.delete("/:id", (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), banner_controller_1.BannerController.deleteBanner);
exports.BannerRoutes = router;
