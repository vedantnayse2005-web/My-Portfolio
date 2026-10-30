
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protectAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Check whether the admin still exists
        const admin = await Admin.findById(decoded.id).select("_id username email");

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin account no longer exists. Please log in again."
            });
        }

        req.admin = {
            id: admin._id,
            username: admin.username,
            email: admin.email
        };

        next();

    } catch (error) {
        console.error("Admin Authentication Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

module.exports = protectAdmin;
