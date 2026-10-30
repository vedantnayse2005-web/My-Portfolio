
require("dotenv").config();
 const helmet = require("helmet");
 const rateLimit = require("express-rate-limit");

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing from environment variables.");
    process.exit(1);
}

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const contactRoutes = require("./routes/contactRoutes");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const protectAdmin = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

app.use("/api", apiLimiter);

const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : ["http://localhost:5173"];


app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "10kb" }));

// API Routes
app.use("/api/contact", contactRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/resume", resumeRoutes);

//  Admin Dashboard

app.get("/api/admin/dashboard", protectAdmin, (req, res) => {
    res.json({
        success: true,
        message: "Welcome to Admin Dashboard!",
        admin: req.admin
    });
});
// Protected routes


// Test route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Portfolio Backend API is running!"
    });
});

// Start server after database connection
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
