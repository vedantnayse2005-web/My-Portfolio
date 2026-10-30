const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const { loginAdmin } = require("../controllers/authController");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    }
});

router.post("/login", loginLimiter, loginAdmin);

module.exports = router;