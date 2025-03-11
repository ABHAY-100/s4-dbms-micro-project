const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoutes.cjs");
const mortuaryRoutes = require("./routes/mortuaryRoutes.cjs");

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/mortuary", mortuaryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
