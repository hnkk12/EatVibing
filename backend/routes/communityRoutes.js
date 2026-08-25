const express = require("express");
const router = express.Router();
const {
  getPosts,
  getReplies,
  createPost,
  toggleLike,
} = require("../controllers/communityController");

router.get("/posts", getPosts);
router.get("/posts/:id/replies", getReplies);
router.post("/posts", createPost);
router.post("/posts/:id/like", toggleLike);
module.exports = router;
