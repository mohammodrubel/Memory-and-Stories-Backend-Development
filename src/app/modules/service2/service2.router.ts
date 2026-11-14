import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import serviceSchema from "./service2.validation";
import { ServiceController } from "./service2.controller";

const router = express.Router();

// Public reads
router.get("/", ServiceController.getAllService);
router.get("/:id", ServiceController.getSingleService);

// Admin-only writes
router.post(
  "/create-service",
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(serviceSchema),
  ServiceController.createNewService,
);
router.patch(
  "/:id",
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(serviceSchema),
  ServiceController.updateService,
);
router.delete("/:id", auth(Role.ADMIN, Role.MANAGER), ServiceController.deleteService);

export const ServiceRoutes = router;
