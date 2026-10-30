const express = require("express");
const protectAdmin = require("../middleware/authMiddleware");
const {
    createProject,
    deleteProject,
    getProject,
    getProjects,
    updateProject
} = require("../controllers/projectController");

const router = express.Router();

router.get("/", getProjects);
router.get("/:id", getProject);
router.post("/", protectAdmin, createProject);
router.put("/:id", protectAdmin, updateProject);
router.delete("/:id", protectAdmin, deleteProject);

module.exports = router;
