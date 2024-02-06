import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import recipeRoutes from "./routes/recipes.js";
import morgan from "morgan";
import { dbClient } from "./db/db.js";
const app = express();

// DB connection
dbClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/recipes", recipeRoutes);

const PORT = process.env.APP_PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
});
