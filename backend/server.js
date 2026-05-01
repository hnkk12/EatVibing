const express = require("express");
const cors = require("cors");
const mealRoutes = require("./routes/mealRoutes");
const aiRoutes = require("./routes/aiRoutes");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// use route
app.use("/api/meals", mealRoutes);
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
