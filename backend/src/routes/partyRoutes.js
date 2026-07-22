const express = require("express");
const router = express.Router();
const partyController = require("../controllers/partyController");
const auth = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
const { validateCreateParty, validateJoinParty } = require("../validators/roomValidator");

router.get("/public", optionalAuth, partyController.getPublicParties);
router.post("/create", auth, validateCreateParty, partyController.createParty);
router.post("/join", auth, validateJoinParty, partyController.joinParty);
router.post("/leave", auth, partyController.leaveParty);
router.get("/:code", auth, partyController.getParty);
router.patch("/:code/settings", auth, partyController.updatePartySettings);
router.delete("/:code", auth, partyController.deleteParty);

module.exports = router;
