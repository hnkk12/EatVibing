const express = require("express");
const router = express.Router();
const { askAI, getChatHistory } = require("../controllers/aiController");

router.post("/chat", askAI);
router.get("/history/:userId", getChatHistory);
module.exports = router;
