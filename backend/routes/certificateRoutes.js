const express = require("express");
const multer = require("multer");
const path = require("path");
const protectAdmin = require("../middleware/authMiddleware");
const {
    createCertificate,
    deleteCertificate,
    getAdminCertificates,
    getCertificateFile,
    getPublishedCertificate,
    getPublishedCertificates,
    setCertificatePublished,
    updateCertificate
} = require("../controllers/certificateController");

const router = express.Router();
const allowedTypes = new Map([
    ["application/pdf", [".pdf"]],
    ["image/jpeg", [".jpg", ".jpeg"]],
    ["image/png", [".png"]]
]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        const extensions = allowedTypes.get(file.mimetype);
        const extension = path.extname(file.originalname).toLowerCase();
        if (!extensions || !extensions.includes(extension)) {
            const error = new Error("Upload a PDF, JPG, JPEG, or PNG certificate.");
            error.code = "INVALID_CERTIFICATE_TYPE";
            return callback(error);
        }
        callback(null, true);
    }
});

const parseCertificateUpload = (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError) {
            const tooLarge = error.code === "LIMIT_FILE_SIZE";
            return res.status(tooLarge ? 413 : 400).json({
                success: false,
                message: tooLarge
                    ? "Certificate files must be 5 MB or smaller."
                    : "Upload one certificate file using the file field."
            });
        }
        if (error.code === "INVALID_CERTIFICATE_TYPE") {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("Certificate Upload Middleware Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to process the certificate upload."
        });
    });
};

router.get("/admin", protectAdmin, getAdminCertificates);
router.get("/", getPublishedCertificates);
router.post("/", protectAdmin, parseCertificateUpload, createCertificate);
router.get("/:id/file", getCertificateFile);
router.get("/:id", getPublishedCertificate);
router.put("/:id", protectAdmin, parseCertificateUpload, updateCertificate);
router.patch("/:id/publish", protectAdmin, setCertificatePublished);
router.delete("/:id", protectAdmin, deleteCertificate);

module.exports = router;