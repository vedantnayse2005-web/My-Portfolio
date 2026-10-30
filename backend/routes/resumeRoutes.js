const express = require("express");
const multer = require("multer");
const protectAdmin = require("../middleware/authMiddleware");
const {
    downloadResume,
    getCurrentResume,
    uploadResume
} = require("../controllers/resumeController");

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        if (
            file.mimetype !== "application/pdf" ||
            !file.originalname.toLowerCase().endsWith(".pdf")
        ) {
            const error = new Error("Only PDF files are accepted.");
            error.code = "INVALID_FILE_TYPE";
            return callback(error);
        }

        callback(null, true);
    }
});

const uploadResumeFile = (req, res, next) => {
    upload.single("resume")(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "Resume must be 5 MB or smaller."
                : "Upload one PDF file using the resume field.";
            return res.status(status).json({ success: false, message });
        }

        if (error.code === "INVALID_FILE_TYPE") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        console.error("Resume Upload Middleware Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to process the resume upload."
        });
    });
};

router.get("/status", protectAdmin, getCurrentResume);
router.get("/", downloadResume);
router.post("/", protectAdmin, uploadResumeFile, uploadResume);

module.exports = router;
