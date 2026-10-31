const express = require("express");
const multer = require("multer");
const path = require("path");
const protectAdmin = require("../middleware/authMiddleware");
const {
    getCurrentProfilePhoto,
    removeProfilePhoto,
    uploadProfilePhoto
} = require("../controllers/profilePhotoController");

const router = express.Router();
const allowedExtensions = new Map([
    ["image/jpeg", [".jpg", ".jpeg"]],
    ["image/png", [".png"]],
    ["image/webp", [".webp"]]
]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        const extensions = allowedExtensions.get(file.mimetype);
        const extension = path.extname(file.originalname).toLowerCase();

        if (!extensions || !extensions.includes(extension)) {
            const error = new Error("Upload a JPG, PNG, or WebP image.");
            error.code = "INVALID_FILE_TYPE";
            return callback(error);
        }

        callback(null, true);
    }
});

const uploadProfilePhotoFile = (req, res, next) => {
    upload.single("photo")(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "Profile photos must be 5 MB or smaller."
                : "Upload one image using the photo field.";
            return res.status(status).json({ success: false, message });
        }

        if (error.code === "INVALID_FILE_TYPE") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        console.error("Profile Photo Upload Middleware Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to process the profile photo upload."
        });
    });
};

router.get("/", getCurrentProfilePhoto);
router.post("/", protectAdmin, uploadProfilePhotoFile, uploadProfilePhoto);
router.delete("/", protectAdmin, removeProfilePhoto);

module.exports = router;