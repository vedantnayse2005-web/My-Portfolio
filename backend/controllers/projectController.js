const mongoose = require("mongoose");
const Project = require("../models/Project");

const normalizeProject = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return null;
    }

    const stringFields = ["title", "description", "imageUrl", "githubLink", "liveDemoLink"];
    if (stringFields.some((field) => data[field] !== undefined && typeof data[field] !== "string")) {
        return null;
    }

    if (
        data.technologies !== undefined &&
        typeof data.technologies !== "string" &&
        !Array.isArray(data.technologies)
    ) {
        return null;
    }

    const technologies = Array.isArray(data.technologies)
        ? data.technologies
        : typeof data.technologies === "string"
            ? data.technologies.split(",")
            : [];

    if (technologies.some((technology) => typeof technology !== "string")) {
        return null;
    }

    return {
        title: data.title?.trim(),
        description: data.description?.trim(),
        imageUrl: data.imageUrl?.trim() || "",
        technologies: technologies.map((technology) => technology.trim()).filter(Boolean),
        githubLink: data.githubLink?.trim() || "",
        liveDemoLink: data.liveDemoLink?.trim() || ""
    };
};

const validateProjectId = (id, res) => {
    if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({
            success: false,
            message: "Invalid project ID."
        });
        return false;
    }

    return true;
};

const getProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        console.error("Fetch Projects Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to fetch projects."
        });
    }
};

const getProject = async (req, res) => {
    if (!validateProjectId(req.params.id, res)) return;

    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error("Fetch Project Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to fetch project."
        });
    }
};

const createProject = async (req, res) => {
    const projectData = normalizeProject(req.body);

    if (!projectData) {
        return res.status(400).json({
            success: false,
            message: "Project fields are invalid."
        });
    }

    if (!projectData.title || !projectData.description) {
        return res.status(400).json({
            success: false,
            message: "Project title and description are required."
        });
    }

    try {
        const project = await Project.create(projectData);

        res.status(201).json({
            success: true,
            message: "Project created successfully.",
            data: project
        });
    } catch (error) {
        console.error("Create Project Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to create project."
        });
    }
};

const updateProject = async (req, res) => {
    if (!validateProjectId(req.params.id, res)) return;

    const projectData = normalizeProject(req.body);

    if (!projectData) {
        return res.status(400).json({
            success: false,
            message: "Project fields are invalid."
        });
    }

    if (!projectData.title || !projectData.description) {
        return res.status(400).json({
            success: false,
            message: "Project title and description are required."
        });
    }

    try {
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            projectData,
            { new: true, runValidators: true }
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Project updated successfully.",
            data: project
        });
    } catch (error) {
        console.error("Update Project Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to update project."
        });
    }
};

const deleteProject = async (req, res) => {
    if (!validateProjectId(req.params.id, res)) return;

    try {
        const project = await Project.findByIdAndDelete(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Project deleted successfully."
        });
    } catch (error) {
        console.error("Delete Project Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to delete project."
        });
    }
};

module.exports = {
    createProject,
    deleteProject,
    getProject,
    getProjects,
    updateProject
};
