const express = require("express");
const cors = require("cors");
const mealRoutes = require("./routes/mealRoutes");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Sử dụng route
app.use("/api/meals", mealRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
