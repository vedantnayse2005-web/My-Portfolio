const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Admin Login
const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required."
            });
        }

        // Find admin by username
       const admin = await Admin.findOne({ username }).select("+password");
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        // Compare password with stored hash
        const isMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email
            }
        });

    } catch (error) {
        console.error("Admin Login Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
};

module.exports = { loginAdmin };