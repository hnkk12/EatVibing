const express = require("express");
const router = express.Router();
const { getRatings, addRating, getTrending } = require("../controllers/ratingController");

router.get("/trending", getTrending);
router.get("/:mealId", getRatings);
router.post("/", addRating);
module.exports = router;
