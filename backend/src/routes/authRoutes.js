const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", auth, authController.getMe);
router.patch("/me", auth, authController.updateProfile);
router.get("/stats", auth, authController.getStats);

module.exports = router;
