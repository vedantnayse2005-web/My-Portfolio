require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

// Routes
const contactRoutes = require("./routes/contactRoutes");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const profilePhotoRoutes = require("./routes/profilePhotoRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const skillRoutes = require("./routes/skillRoutes");
const editingRoutes = require("./routes/editingRoutes");
const aboutRoutes = require("./routes/aboutRoutes");

const protectAdmin = require("./middleware/authMiddleware");

// Validate environment variables
if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing from environment variables.");
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// SECURITY MIDDLEWARE
// ========================================

app.use(helmet());

// ========================================
// CORS CONFIGURATION
// ========================================

const allowedOrigins = [
    "https://vedant-portfolio-r64h.onrender.com",
    ...(process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL
            .split(",")
            .map((origin) => origin.trim().replace(/\/$/, ""))
            .filter(Boolean)
        : []),
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests without an Origin header,
        // such as server-to-server requests.
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = origin.replace(/\/$/, "");

        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        console.warn("CORS blocked origin:", origin);

        return callback(new Error("Origin not allowed by CORS"));
    },

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ],

    credentials: false,

    optionsSuccessStatus: 204
};

// CORS must run before API routes and rate limiting.
app.use(cors(corsOptions));

// Explicitly handle browser preflight requests.
app.options(/.*/, cors(corsOptions));

// ========================================
// RATE LIMITING
// ========================================

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

// ========================================
// BODY PARSING
// ========================================

app.use(express.json({
    limit: "10kb"
}));

// ========================================
// API ROUTES
// ========================================

app.use("/api/contact", contactRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/resume", resumeRoutes);

app.use("/api/profile-photo", profilePhotoRoutes);

app.use("/api/certificates", certificateRoutes);

app.use("/api/skills", skillRoutes);

app.use("/api/editing", editingRoutes);

app.use("/api/about", aboutRoutes);

// ========================================
// ADMIN DASHBOARD
// ========================================

app.get(
    "/api/admin/dashboard",
    protectAdmin,
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome to Admin Dashboard!",
            admin: req.admin
        });
    }
);

// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Portfolio Backend API is running!"
    });
});

// ========================================
// ERROR HANDLING
// ========================================

app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);

    if (err.message === "Origin not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "Origin not allowed."
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: "Internal server error."
    });
});

// ========================================
// START SERVER
// ========================================

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log("Allowed frontend origins:", allowedOrigins);
        });

    } catch (error) {
        console.error(
            "Server startup failed:",
            error.message
        );

        process.exit(1);
    }
};

startServer();