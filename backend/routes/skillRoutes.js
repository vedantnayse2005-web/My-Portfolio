const express = require("express");
const protectAdmin = require("../middleware/authMiddleware");
const {
    createSkill,
    deleteSkill,
    getAdminSkills,
    getPublicSkills,
    updateSkill
} = require("../controllers/skillController");

const router = express.Router();

router.get("/admin", protectAdmin, getAdminSkills);
router.get("/", getPublicSkills);
router.post("/", protectAdmin, createSkill);
router.put("/:id", protectAdmin, updateSkill);
router.delete("/:id", protectAdmin, deleteSkill);

module.exports = router;