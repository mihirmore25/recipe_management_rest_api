import express from "express";
import { verify } from "../middleware/verify.js";
import {
    createRecipe,
    deleteRecipe,
    getRecipe,
    getRecipes,
    updateRecipe,
} from "../controllers/recipe.js";
// import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

router.get("/", verify, getRecipes);
router.post("/", verify, createRecipe);
router.get("/:id", verify, getRecipe);
router.post("/:id", verify, deleteRecipe);
router.put("/:id", verify, updateRecipe);

export default router;
