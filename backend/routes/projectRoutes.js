const express = require("express");
const multer = require("multer");
const protectAdmin = require("../middleware/authMiddleware");
const {
    createProject,
    deleteProject,
    downloadProjectImage,
    getProject,
    getProjects,
    updateProject
} = require("../controllers/projectController");

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        const allowedTypes = new Map([
            ["image/png", [".png"]],
            ["image/jpeg", [".jpg", ".jpeg"]],
            ["image/webp", [".webp"]],
            ["image/gif", [".gif"]]
        ]);
        const allowedExtensions = allowedTypes.get(file.mimetype);

        if (
            !allowedExtensions ||
            !allowedExtensions.some((extension) =>
                file.originalname.toLowerCase().endsWith(extension)
            )
        ) {
            const error = new Error("Upload a PNG, JPEG, WebP, or GIF image.");
            error.code = "INVALID_FILE_TYPE";
            return callback(error);
        }

        callback(null, true);
    }
});

const uploadProjectImage = (req, res, next) => {
    upload.single("image")(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "Project images must be 5 MB or smaller."
                : "Upload one image using the image field.";
            return res.status(status).json({ success: false, message });
        }

        if (error.code === "INVALID_FILE_TYPE") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        console.error("Project Image Upload Middleware Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to process the project image upload."
        });
    });
};

router.get("/", getProjects);
router.get("/:id/image", downloadProjectImage);
router.get("/:id", getProject);
router.post("/", protectAdmin, uploadProjectImage, createProject);
router.put("/:id", protectAdmin, uploadProjectImage, updateProject);
router.delete("/:id", protectAdmin, deleteProject);

module.exports = router;
