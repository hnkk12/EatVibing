const express = require("express");
const router = express.Router();
const { getProfile, upsertProfile } = require("../controllers/profileController");

router.get("/:userId", getProfile);
router.post("/", upsertProfile);
module.exports = router;
