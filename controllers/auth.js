import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
    const { username, email, password } = req.body;
    console.log("Req Body --> ", req.body);

    if (!username || !email || !password) {
        return res.status(400).json({
            status: false,
            error: res.statusCode,
            data: [],
            message: "Username, Email, Password are required",
        });
    }

    const newUser = new User({
        username,
        email,
        password,
    });

    const userExist = await User.findOne({ email });

    console.log("User Exist --> ", userExist);

    if (userExist) {
        res.status(400).json({
            status: false,
            error: res.statusCode,
            data: [],
            message:
                "It seems you already have an account, please log in instead.",
        });
    }

    const savedUser = await newUser.save();

    const { role, ...user_data } = savedUser._doc;

    console.log("User Data ---> ", user_data);

    return res.status(201).json({
        status: true,
        data: [user_data],
        message:
            "Thank you for registering with us. Your account has been created successfully.",
    });
};

export const login = async (req, res) => {
    const { email } = req.body;

    if (!email || !req.body.password) {
        return res.status(400).json({
            status: false,
            error: res.statusCode,
            data: [],
            message: "Email, Password are required",
        });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return res.status(401).json({
            status: true,
            data: [],
            message:
                "Invalid email or password. Please try again with the correct credentials.",
        });
    }

    // const isPasswordValid = bcrypt.compareSync(
    //     req.body.password,
    //     user.password
    // );

    const isPasswordValid = await user.isPasswordValid(req.body.password);

    if (!isPasswordValid) {
        return res.status(401).json({
            status: false,
            data: [],
            message:
                "Invalid email or password. Please try again with the correct credentials.",
        });
    }

    const { password, ...user_data } = user._doc;

    // let options = {
    //     expiresIn: 24 * 60 * 60 * 1000, // would expire in 1 day
    //     httpOnly: true, // The cookie is only accessible by the web server
    // };

    const token = user.generateJWT();

    return res
        .cookie("access_token", token, {
            maxAge: 30 * 60 * 1000, // would expire in 30 minutes
            httpOnly: true,
            sameSite: "Strict",
        })
        .status(200)
        .json({
            status: true,
            data: [user_data],
            token,
            message: "You have successfully logged in.",
        });
};

export const logout = async (req, res) => {
    // console.log(req.cookies.access_token);

    let token;

    token = req.cookies.access_token;

    let user_data = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(user_data.id);
    console.log(user);

    return res
        .clearCookie("access_token", {
            sameSite: "none",
            secure: true,
        })
        .status(200)
        .json({
            status: false,
            data: [],
            message: "You have been logged out successfully...",
        });
};
