
const mongoose = require("mongoose");
const { Readable } = require("stream");
const Project = require("../models/Project");

const PROJECT_IMAGE_BUCKET = "projectImages";

const getProjectImageBucket = () => {
    const database = mongoose.connection.db;
    if (!database) {
        throw new Error("MongoDB is not connected.");
    }

    return new mongoose.mongo.GridFSBucket(database, {
        bucketName: PROJECT_IMAGE_BUCKET
    });
};

const getVerifiedImageContentType = (buffer) => {
    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        return "image/png";
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return "image/jpeg";
    }
    if (
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
        return "image/webp";
    }
    const gifHeader = buffer.subarray(0, 6).toString("ascii");
    if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
        return "image/gif";
    }

    return null;
};

const saveProjectImage = async (file) => {
    const contentType = getVerifiedImageContentType(file.buffer);
    if (!contentType || contentType !== file.mimetype) {
        const error = new Error("The uploaded file is not a valid supported image.");
        error.code = "INVALID_IMAGE_CONTENT";
        throw error;
    }

    const uploadStream = getProjectImageBucket().openUploadStream(
        `project-image-${Date.now()}`,
        { metadata: { contentType } }
    );

    const fileId = await new Promise((resolve, reject) => {
        uploadStream.once("finish", () => resolve(uploadStream.id));
        uploadStream.once("error", reject);
        Readable.from(file.buffer).pipe(uploadStream);
    });

    return { fileId, contentType };
};

const removeProjectImage = async (fileId) => {
    if (!fileId) return;

    try {
        await getProjectImageBucket().delete(fileId);
    } catch (error) {
        console.error("Project Image Cleanup Error:", error.message);
    }
};

// Validate and normalize project input
const normalizeProject = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return null;
    }

    const stringFields = [
        "title",
        "description",
        "imageUrl",
        "githubLink",
        "liveDemoLink"
    ];

    // Validate field types
    if (
        stringFields.some(
            (field) =>
                data[field] !== undefined &&
                typeof data[field] !== "string"
        )
    ) {
        return null;
    }

    // Validate technologies type
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

    // Validate technology entries
    if (
        technologies.length > 20 ||
        technologies.some(
            (technology) =>
                typeof technology !== "string" ||
                technology.trim().length > 40
        )
    ) {
        return null;
    }

    const projectData = {
        title: data.title?.trim(),
        description: data.description?.trim(),
        imageUrl: data.imageUrl?.trim() || "",
        technologies: technologies
            .map((technology) => technology.trim())
            .filter(Boolean),
        githubLink: data.githubLink?.trim() || "",
        liveDemoLink: data.liveDemoLink?.trim() || ""
    };

    // Validate required fields
    if (!projectData.title || !projectData.description) {
        return null;
    }

    // Validate maximum field lengths
    if (
        projectData.title.length > 100 ||
        projectData.description.length > 3000 ||
        projectData.imageUrl.length > 2048 ||
        projectData.githubLink.length > 2048 ||
        projectData.liveDemoLink.length > 2048
    ) {
        return null;
    }

    // Validate URLs: allow only HTTP and HTTPS
    const urls = [
        projectData.imageUrl,
        projectData.githubLink,
        projectData.liveDemoLink
    ];

    for (const value of urls) {
        if (!value) continue;

        try {
            const parsedUrl = new URL(value);

            if (
                parsedUrl.protocol !== "http:" &&
                parsedUrl.protocol !== "https:"
            ) {
                return null;
            }
        } catch {
            return null;
        }
    }

    return projectData;
};

// Validate MongoDB ObjectId
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

// Handle Mongoose validation errors
const handleDatabaseError = (error, res, action) => {
    console.error(`${action} Project Error:`, error.message);

    if (error.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: "Project data failed validation."
        });
    }

    return res.status(500).json({
        success: false,
        message: `Unable to ${action.toLowerCase()} project.`
    });
};

// GET: Fetch all projects (Public)
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });

    } catch (error) {
        console.error("Fetch Projects Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch projects."
        });
    }
};

// GET: Fetch single project (Public)
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

        return res.status(200).json({
            success: true,
            data: project
        });

    } catch (error) {
        console.error("Fetch Project Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch project."
        });
    }
};

// GET: Fetch a project's uploaded image (Public)
const downloadProjectImage = async (req, res) => {
    if (!validateProjectId(req.params.id, res)) return;

    try {
        const project = await Project.findById(req.params.id).select(
            "imageFileId imageContentType"
        );

        if (!project || !project.imageFileId) {
            return res.status(404).json({
                success: false,
                message: "Project image not found."
            });
        }

        const bucket = getProjectImageBucket();
        const imageFile = await bucket.find({ _id: project.imageFileId }).next();
        if (!imageFile) {
            return res.status(404).json({
                success: false,
                message: "Project image not found."
            });
        }

        res.set("Content-Type", project.imageContentType || imageFile.metadata?.contentType);
        res.set("Content-Length", String(imageFile.length));
        res.set("Cache-Control", "public, max-age=31536000, immutable");

        const downloadStream = bucket.openDownloadStream(project.imageFileId);
        downloadStream.on("error", (error) => {
            console.error("Download Project Image Error:", error.message);
            if (res.headersSent) {
                res.destroy(error);
                return;
            }

            res.status(500).json({
                success: false,
                message: "Unable to download the project image."
            });
        });
        downloadStream.pipe(res);
    } catch (error) {
        console.error("Fetch Project Image Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch the project image."
        });
    }
};

// POST: Create project (Admin Only)
const createProject = async (req, res) => {
    const projectData = normalizeProject({
        ...req.body,
        ...(req.file ? { imageUrl: "" } : {})
    });

    if (!projectData) {
        return res.status(400).json({
            success: false,
            message: "Project fields are invalid. Check required fields, lengths, technologies, and URLs."
        });
    }

    let uploadedImage;
    try {
        if (req.file) {
            uploadedImage = await saveProjectImage(req.file);
            projectData.imageFileId = uploadedImage.fileId;
            projectData.imageContentType = uploadedImage.contentType;
        }

        const project = await Project.create(projectData);

        return res.status(201).json({
            success: true,
            message: "Project created successfully.",
            data: project
        });

    } catch (error) {
        if (uploadedImage?.fileId) {
            await removeProjectImage(uploadedImage.fileId);
        }
        if (error.code === "INVALID_IMAGE_CONTENT") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return handleDatabaseError(error, res, "Create");
    }
};

// PUT: Update project (Admin Only)
const updateProject = async (req, res) => {
    if (!validateProjectId(req.params.id, res)) return;

    const projectData = normalizeProject({
        ...req.body,
        ...(req.file ? { imageUrl: "" } : {})
    });

    if (!projectData) {
        return res.status(400).json({
            success: false,
            message: "Project fields are invalid. Check required fields, lengths, technologies, and URLs."
        });
    }

    let uploadedImage;
    try {
        const previousProject = await Project.findById(req.params.id);
        if (!previousProject) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        if (req.file) {
            uploadedImage = await saveProjectImage(req.file);
            projectData.imageFileId = uploadedImage.fileId;
            projectData.imageContentType = uploadedImage.contentType;
        }

        const project = await Project.findByIdAndUpdate(
            req.params.id,
            projectData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        if (uploadedImage) {
            await removeProjectImage(previousProject.imageFileId);
        }

        return res.status(200).json({
            success: true,
            message: "Project updated successfully.",
            data: project
        });

    } catch (error) {
        if (uploadedImage?.fileId) {
            await removeProjectImage(uploadedImage.fileId);
        }
        if (error.code === "INVALID_IMAGE_CONTENT") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return handleDatabaseError(error, res, "Update");
    }
};

// DELETE: Delete project (Admin Only)
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

        await removeProjectImage(project.imageFileId);

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully."
        });

    } catch (error) {
        console.error("Delete Project Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete project."
        });
    }
};

module.exports = {
    createProject,
    deleteProject,
    downloadProjectImage,
    getProject,
    getProjects,
    updateProject
};
