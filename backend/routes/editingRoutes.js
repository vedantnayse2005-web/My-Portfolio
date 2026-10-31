const express = require("express");
const multer = require("multer");
const path = require("path");
const protectAdmin = require("../middleware/authMiddleware");
const editing = require("../controllers/editingController");

const router = express.Router();
const imageTypes = new Map([
    ["image/jpeg", [".jpg", ".jpeg"]],
    ["image/png", [".png"]],
    ["image/webp", [".webp"]]
]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        const extensions = imageTypes.get(file.mimetype);
        if (!extensions || !extensions.includes(path.extname(file.originalname).toLowerCase())) {
            const error = new Error("Upload a JPG, JPEG, PNG, or WebP thumbnail.");
            error.code = "INVALID_EDITING_IMAGE_TYPE";
            return callback(error);
        }
        callback(null, true);
    }
});

const uploadThumbnail = (req, res, next) => {
    upload.single("thumbnail")(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError) {
            const tooLarge = error.code === "LIMIT_FILE_SIZE";
            return res.status(tooLarge ? 413 : 400).json({
                success: false,
                message: tooLarge ? "Thumbnail must be 5 MB or smaller." : "Upload one thumbnail file."
            });
        }
        if (error.code === "INVALID_EDITING_IMAGE_TYPE") {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("Editing Thumbnail Upload Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to process the thumbnail." });
    });
};

router.get("/overview", protectAdmin, editing.getEditingOverview);

router.get("/showreel", editing.getPublicShowreel);
router.get("/showreel/admin", protectAdmin, editing.getAdminShowreel);
router.put("/showreel", protectAdmin, editing.updateShowreel);
router.delete("/showreel", protectAdmin, editing.deleteShowreel);

router.get("/profile", editing.getPublicProfile);
router.get("/profile/admin", protectAdmin, editing.getAdminProfile);
router.put("/profile", protectAdmin, editing.updateProfile);

router.get("/projects", editing.getPublicProjects);
router.get("/projects/admin", protectAdmin, editing.getAdminProjects);
router.get("/projects/:id/thumbnail/admin", protectAdmin, (req, res) => editing.getProjectThumbnail(req, res, true));
router.get("/projects/:id/thumbnail", (req, res) => editing.getProjectThumbnail(req, res, false));
router.post("/projects", protectAdmin, uploadThumbnail, editing.createProject);
router.put("/projects/:id", protectAdmin, uploadThumbnail, editing.updateProject);
router.patch("/projects/:id/publish", protectAdmin, editing.setProjectPublished);
router.delete("/projects/:id", protectAdmin, editing.deleteProject);

router.get("/skills", editing.getPublicSkills);
router.get("/skills/admin", protectAdmin, editing.getAdminSkills);
router.post("/skills", protectAdmin, (req, res) => editing.saveSkill(req, res, true));
router.put("/skills/:id", protectAdmin, (req, res) => editing.saveSkill(req, res, false));
router.delete("/skills/:id", protectAdmin, editing.deleteSkill);

router.get("/experience", editing.getPublicExperience);
router.get("/experience/admin", protectAdmin, editing.getAdminExperience);
router.post("/experience", protectAdmin, (req, res) => editing.saveExperience(req, res, true));
router.put("/experience/:id", protectAdmin, (req, res) => editing.saveExperience(req, res, false));
router.patch("/experience/:id/publish", protectAdmin, editing.setExperiencePublished);
router.delete("/experience/:id", protectAdmin, editing.deleteExperience);

module.exports = router;