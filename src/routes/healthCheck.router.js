import { verifyJWT } from "../middlewares/auth.middleware.js";
import { healthCheck } from "../controllers/healthCheck.controller.js";
import { Router } from "express";

const router = Router();

router.use(verifyJWT)
router.route("/").get(healthCheck)

export default router;
