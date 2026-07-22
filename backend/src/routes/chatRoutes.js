const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");

router.get("/history/:partyId", auth, chatController.getHistory);
router.delete("/message/:messageId", auth, chatController.deleteMessage);
router.get("/user/history", auth, chatController.getUserHistory);

module.exports = router;