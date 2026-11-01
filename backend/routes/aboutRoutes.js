const express = require("express");
const protectAdmin = require("../middleware/authMiddleware");
const {
    getAboutContent,
    updateAboutContent
} = require("../controllers/aboutController");

const router = express.Router();

router.get("/", getAboutContent);
router.get("/admin", protectAdmin, getAboutContent);
router.put("/", protectAdmin, updateAboutContent);

module.exports = router;
