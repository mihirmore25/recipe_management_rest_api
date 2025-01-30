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
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.get("/", verify, getRecipes);
router.post("/", verify, upload.single("recipeImage"), createRecipe);
router.get("/:id", verify, getRecipe);
router.delete("/:id", verify, deleteRecipe);
router.put("/:id", verify, upload.single("recipeImage"), updateRecipe);

export default router;
