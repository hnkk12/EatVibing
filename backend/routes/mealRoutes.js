const express = require("express");
const router = express.Router();
const mealController = require("../controllers/mealController");

router.get("/", mealController.getAllMeals);
router.post("/", mealController.createMeal);
router.delete("/:id", mealController.deleteMeal);

module.exports = router;
