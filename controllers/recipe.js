import { User } from "../models/User.js";
import { Recipe } from "../models/Recipe.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { Redis } from "ioredis";

const client = new Redis();

client.on("connect", () => {
    console.log(`Connected to Redis successfully...`);
});

client.on("error", (error) => {
    console.error(`Redis connection error : ${error}`);
});

export const createRecipe = async (req, res) => {
    let token;

    token = req.cookies.access_token;

    // console.log("Token --> ", token);

    if (!token)
        return res.status(401).json({
            status: false,
            error: res.statusCode,
            message:
                "Not authorize to access this route, Please try logging in first.",
        });

    const {
        title,
        description,
        totalTime,
        prepTime,
        cookingTime,
        ingredients,
        instructions,
        calories,
        carbs,
        protein,
        fat,
    } = req.body;

    // console.log("Req Body --> ", req.body);

    if (
        !title ||
        !description ||
        !totalTime ||
        !prepTime ||
        !cookingTime ||
        !ingredients ||
        !instructions ||
        !calories ||
        !carbs ||
        !protein ||
        !fat
    ) {
        return res
            .status(400)
            .json({ message: "All the given fields are required." });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user_data) => {
        if (err) {
            return res
                .status(401)
                .json({ message: "This session has expired. Please login" });
        }

        const recipeImageLocalPath = req.file?.path || undefined;
        console.log("Recipe Image Local Path ---> ", recipeImageLocalPath);
        if (!recipeImageLocalPath || undefined) {
            return res
                .status(400)
                .json({ message: "Please upload your recipe image!" });
        }

        const recipeImage = await uploadOnCloudinary(recipeImageLocalPath);
        if (!recipeImage) {
            return res
                .status(400)
                .json({ message: "Please upload your recipe image!" });
        }

        if (recipeImage.url) {
            fs.unlinkSync(recipeImageLocalPath);
            console.log(
                "Image removed from local server and uploaded to remote successfully.."
            );
        }

        const newRecipe = await Recipe.create({
            recipeImage: {
                publicId: recipeImage.public_id,
                imageUrl: recipeImage.url || "",
            },
            title,
            description,
            totalTime,
            prepTime,
            cookingTime,
            ingredients,
            instructions,
            calories,
            carbs,
            protein,
            fat,
            user: user_data.id,
        });

        const newCreatedRecipe = await newRecipe.save();

        console.log(newCreatedRecipe._doc);

        return res.status(200).json({
            status: true,
            data: [newCreatedRecipe._doc],
            message: "New Recipe created successfully.",
        });
    });
};

export const getRecipes = async (req, res) => {
    let recipes = await client.getex("recipes", "PX", 600);
    if (recipes) {
        recipes = JSON.parse(recipes);
        return res.status(200).json(recipes);
    }

    recipes = await Recipe.find()
        .limit(8)
        .sort({ createdAt: -1 })
        .select("-__v");

    if (recipes.length === 0 || recipes === null || 0) {
        return res.status(404).json({
            status: false,
            message: "Recipes not found! Try creating new recipe",
        });
    }

    await client.setex("recipes", 5, JSON.stringify(recipes, null, 4));

    return res.status(200).json({
        status: true,
        data: recipes,
    });
};

export const getRecipe = async (req, res) => {
    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        return res.status(404).json({
            status: false,
            message: "Please search recipe with valid recipe id.",
        });
    }

    const recipe = await Recipe.findById(recipeId).select("-__v");

    if (recipeId && (recipe === null || undefined || 0)) {
        return res.status(404).json({
            status: false,
            message: `Recipe did not found with ${recipeId} id.`,
        });
    }
    // console.log("Recipe --> ", recipe);

    return res.status(200).json({
        status: true,
        data: recipe,
    });
};

export const deleteRecipe = async (req, res) => {
    // let token = req.cookies.access_token;

    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        return res.status(404).json({
            status: false,
            message: "Please search recipe with valid recipe id.",
        });
    }

    const recipe = await Recipe.findById(recipeId);

    console.log("User --> ", req.user);

    if (recipeId && (recipe === null || undefined || 0)) {
        return res.status(404).json({
            status: false,
            message: `Recipe did not found with ${recipeId} id.`,
        });
    }

    if (
        req.user._id.toString() == recipe.user.toString() ||
        req.user.role == "admin"
    ) {
        const deletedRecipe = await Recipe.deleteOne({ _id: recipeId });

        console.log("Deleted Recipe --> ", deletedRecipe);

        const deleteImageFromCloudinary = await deleteFromCloudinary(
            recipe.recipeImage.publicId
        );

        return res.status(200).json({
            status: true,
            data: deletedRecipe,
            message: "Recipe has been deleted successfully.",
        });
    }

    return res.status(400).json({
        status: false,
        message: "You can only delete your own recipe.",
    });
};

export const updateRecipe = async (req, res) => {
    const {
        title,
        description,
        totalTime,
        prepTime,
        cookingTime,
        ingredients,
        instructions,
        calories,
        carbs,
        protein,
        fat,
    } = req.body;

    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        return res.status(404).json({
            status: false,
            message: "Please search recipe with valid recipe id.",
        });
    }

    const recipe = await Recipe.findById(recipeId);

    if (recipeId && (recipe === null || undefined || 0)) {
        return res.status(404).json({
            status: false,
            message: `Recipe did not found with ${recipeId} id.`,
        });
    }

    console.log("User --> ", req.user);

    if (
        req.user._id.toString() == recipe.user.toString() ||
        req.user.role == "admin"
    ) {
        const recipeImageLocalPath = req.file?.path || undefined;
        console.log("Recipe Image local path ", recipeImageLocalPath);

        const recipeImage = await uploadOnCloudinary(recipeImageLocalPath);
        console.log("Recipe Image URL ", recipeImage.url);

        if (recipeImage.url) {
            fs.unlinkSync(recipeImageLocalPath);
            console.log(
                "Image removed from local server and uploaded to remote successfully.."
            );
        }

        console.log(recipe.recipeImage);

        const deleteImageFromCloudinary = await deleteFromCloudinary(
            recipe.recipeImage.publicId
        );

        const updatedRecipe = await Recipe.findOneAndUpdate(
            { _id: recipeId },
            {
                $set: {
                    recipeImage: {
                        publicId: recipeImage.public_id || null,
                        imageUrl: recipeImage.url || recipe.recipeImage || null,
                    },
                    title,
                    description,
                    totalTime,
                    prepTime,
                    cookingTime,
                    ingredients,
                    instructions,
                    calories,
                    carbs,
                    protein,
                    fat,
                },
            },
            { new: true }
        ).select("-__v");

        console.log("Updated Recipe --> ", updatedRecipe);

        return res.status(200).json({
            status: true,
            data: updatedRecipe,
            message: "Recipe has been updated successfully.",
        });
    }
};
