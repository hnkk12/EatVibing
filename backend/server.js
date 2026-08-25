const express = require("express");
const cors = require("cors");
const mealRoutes = require("./routes/mealRoutes");
const aiRoutes = require("./routes/aiRoutes");
const profileRoutes = require("./routes/profileRoutes");
const communityRoutes = require("./routes/communityRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "EatVibing API is running" });
});

// use route
app.use("/api/meals", mealRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/ratings", ratingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
