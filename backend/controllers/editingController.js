const { Readable } = require("stream");
const mongoose = require("mongoose");
const EditingExperience = require("../models/EditingExperience");
const EditingProfile = require("../models/EditingProfile");
const EditingProject = require("../models/EditingProject");
const EditingShowreel = require("../models/EditingShowreel");
const EditingSkill = require("../models/EditingSkill");

const CURRENT_KEY = "current";
const THUMBNAIL_BUCKET = "editingThumbnails";
const PROJECT_CATEGORIES = [
    "Instagram Reels", "YouTube Videos", "Cinematic Editing", "Promotional Videos",
    "Motion Graphics", "Documentary", "Other"
];
const SKILL_CATEGORIES = [
    "Video Editing", "Color Grading", "Motion Graphics", "Sound Design",
    "Storytelling", "Social Media Content Editing", "Other"
];
const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const EMPLOYMENT_TYPES = ["Freelance", "Internship", "Full-time", "Part-time", "Contract", "Other"];

const getThumbnailBucket = () => {
    const database = mongoose.connection.db;
    if (!database) throw new Error("MongoDB is not connected.");
    return new mongoose.mongo.GridFSBucket(database, { bucketName: THUMBNAIL_BUCKET });
};

const parseBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
};

const validHttpUrl = (value) => {
    if (typeof value !== "string" || !value.trim() || value.length > 2048) return false;
    try {
        const parsed = new URL(value.trim());
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return false;
    }
};

const validVideoUrl = (value) => {
    if (!validHttpUrl(value)) return false;
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) return true;
    if (host === "youtu.be") return /^[\w-]{6,}$/.test(parsed.pathname.split("/").filter(Boolean)[0] || "");
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
        const videoId = parsed.searchParams.get("v") || parsed.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})(?:\/|$)/)?.[1];
        return Boolean(videoId);
    }
    if (host === "vimeo.com" || host.endsWith(".vimeo.com")) {
        return /^\/(?:video\/)?\d+(?:\/|$)/.test(parsed.pathname);
    }
    return false;
};

const validateId = (id, res) => {
    if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({ success: false, message: "Invalid editing record ID." });
        return false;
    }
    return true;
};

const getVerifiedThumbnailType = (buffer) => {
    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
    if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
    return null;
};

const uploadThumbnail = async (file) => {
    const contentType = getVerifiedThumbnailType(file.buffer);
    if (!contentType || contentType !== file.mimetype) {
        const error = new Error("The thumbnail signature does not match its file type.");
        error.code = "INVALID_THUMBNAIL_CONTENT";
        throw error;
    }
    const extension = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[contentType];
    const uploadStream = getThumbnailBucket().openUploadStream(`editing-thumbnail${extension}`, {
        contentType,
        metadata: { contentType }
    });
    const fileId = await new Promise((resolve, reject) => {
        uploadStream.once("finish", () => resolve(uploadStream.id));
        uploadStream.once("error", reject);
        Readable.from(file.buffer).pipe(uploadStream);
    });
    return { fileId, contentType };
};

const deleteThumbnail = async (fileId) => {
    if (fileId) await getThumbnailBucket().delete(fileId);
};

const normalizeProject = (data, existing = {}) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const strings = ["title", "category", "description", "videoUrl"];
    if (strings.some((field) => data[field] !== undefined && typeof data[field] !== "string")) return null;

    const title = (data.title ?? existing.title ?? "").trim();
    const category = (data.category ?? existing.category ?? "").trim();
    const description = (data.description ?? existing.description ?? "").trim();
    const videoUrl = (data.videoUrl ?? existing.videoUrl ?? "").trim();
    const softwareInput = data.software ?? existing.software ?? [];
    const software = Array.isArray(softwareInput)
        ? softwareInput
        : typeof softwareInput === "string" ? softwareInput.split(",") : null;
    if (!software || software.length > 20 || software.some((item) => typeof item !== "string" || item.trim().length > 80)) return null;

    const orderValue = data.displayOrder ?? existing.displayOrder ?? 1;
    const displayOrder = typeof orderValue === "number" ? orderValue : Number(orderValue);
    const completionValue = data.completionDate ?? existing.completionDate ?? "";
    const completionDate = completionValue ? new Date(completionValue) : null;
    const featured = parseBoolean(data.featured ?? existing.featured ?? false);
    const published = parseBoolean(data.published ?? existing.published ?? false);

    if (
        !title || title.length > 140 || !PROJECT_CATEGORIES.includes(category) ||
        !description || description.length > 3000 || !validVideoUrl(videoUrl) ||
        !Number.isInteger(displayOrder) || displayOrder < 1 || displayOrder > 10000 ||
        (completionDate && Number.isNaN(completionDate.getTime())) || featured === null || published === null
    ) return null;

    return {
        title,
        category,
        description,
        videoUrl,
        software: software.map((item) => item.trim()).filter(Boolean),
        completionDate,
        featured,
        displayOrder,
        published
    };
};

const serializeProject = (project) => ({
    _id: project._id,
    title: project.title,
    category: project.category,
    description: project.description,
    thumbnailUrl: project.thumbnailFileId ? `/api/editing/projects/${project._id}/thumbnail` : "",
    videoUrl: project.videoUrl,
    software: project.software,
    completionDate: project.completionDate,
    featured: project.featured,
    displayOrder: project.displayOrder,
    published: project.published,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
});

const normalizeSkill = (data, existing = {}) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const nameValue = data.name ?? existing.name ?? "";
    const categoryValue = data.category ?? existing.category ?? "";
    const proficiencyValue = data.proficiencyLevel ?? existing.proficiencyLevel ?? "";
    if ([nameValue, categoryValue, proficiencyValue].some((value) => typeof value !== "string")) return null;
    const name = nameValue.trim();
    const category = categoryValue.trim();
    const proficiencyLevel = proficiencyValue.trim();
    const orderValue = data.displayOrder ?? existing.displayOrder ?? 1;
    const displayOrder = typeof orderValue === "number" ? orderValue : Number(orderValue);
    const isTool = parseBoolean(data.isTool ?? existing.isTool ?? false);
    const enabled = parseBoolean(data.enabled ?? existing.enabled ?? true);
    if (
        !name || name.length > 100 || !SKILL_CATEGORIES.includes(category) ||
        (proficiencyLevel && !PROFICIENCY_LEVELS.includes(proficiencyLevel)) ||
        !Number.isInteger(displayOrder) || displayOrder < 1 || displayOrder > 10000 ||
        isTool === null || enabled === null
    ) return null;
    return {
        name, category, displayOrder, isTool, enabled,
        ...(proficiencyLevel ? { proficiencyLevel } : {})
    };
};

const normalizeExperience = (data, existing = {}) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const stringFields = ["role", "organization", "employmentType", "description"];
    if (stringFields.some((field) => data[field] !== undefined && typeof data[field] !== "string")) return null;
    const role = (data.role ?? existing.role ?? "").trim();
    const organization = (data.organization ?? existing.organization ?? "").trim();
    const employmentType = (data.employmentType ?? existing.employmentType ?? "").trim();
    const description = (data.description ?? existing.description ?? "").trim();
    const startValue = data.startDate ?? existing.startDate;
    const startDate = startValue ? new Date(startValue) : null;
    const currentlyWorking = parseBoolean(data.currentlyWorking ?? existing.currentlyWorking ?? false);
    const endValue = currentlyWorking ? null : data.endDate ?? existing.endDate ?? null;
    const endDate = endValue ? new Date(endValue) : null;
    const orderValue = data.displayOrder ?? existing.displayOrder ?? 1;
    const displayOrder = typeof orderValue === "number" ? orderValue : Number(orderValue);
    const published = parseBoolean(data.published ?? existing.published ?? false);
    if (
        !role || role.length > 140 || !organization || organization.length > 160 ||
        !EMPLOYMENT_TYPES.includes(employmentType) || !description || description.length > 3000 ||
        !startDate || Number.isNaN(startDate.getTime()) || (endDate && Number.isNaN(endDate.getTime())) ||
        (!currentlyWorking && !endDate) ||
        (endDate && endDate < startDate) || currentlyWorking === null || published === null ||
        !Number.isInteger(displayOrder) || displayOrder < 1 || displayOrder > 10000
    ) return null;
    return { role, organization, employmentType, startDate, endDate, currentlyWorking, description, displayOrder, published };
};

const normalizeProfile = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const fields = ["professionalIntroduction", "aboutDescription", "creativeApproach", "contactEmail", "instagramUrl", "linkedinUrl"];
    if (fields.some((field) => data[field] !== undefined && typeof data[field] !== "string")) return null;
    const normalized = {
        professionalIntroduction: (data.professionalIntroduction || "").trim(),
        aboutDescription: (data.aboutDescription || "").trim(),
        creativeApproach: (data.creativeApproach || "").trim(),
        contactEmail: (data.contactEmail || "").trim().toLowerCase(),
        instagramUrl: (data.instagramUrl || "").trim(),
        linkedinUrl: (data.linkedinUrl || "").trim()
    };
    const interests = data.editingInterests ?? [];
    if (!Array.isArray(interests) || interests.length > 30 || interests.some((item) => typeof item !== "string" || item.trim().length > 100)) return null;
    normalized.editingInterests = interests.map((item) => item.trim()).filter(Boolean);
    if (
        normalized.professionalIntroduction.length > 500 || normalized.aboutDescription.length > 3000 ||
        normalized.creativeApproach.length > 2000 || normalized.contactEmail.length > 254 ||
        (normalized.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.contactEmail)) ||
        normalized.instagramUrl.length > 2048 || normalized.linkedinUrl.length > 2048 ||
        (normalized.instagramUrl && !validHttpUrl(normalized.instagramUrl)) ||
        (normalized.linkedinUrl && !validHttpUrl(normalized.linkedinUrl))
    ) return null;
    return normalized;
};

const getEditingOverview = async (req, res) => {
    try {
        const [totalProjects, publishedProjects, draftProjects, showreel, totalSkills, experienceEntries] = await Promise.all([
            EditingProject.countDocuments(),
            EditingProject.countDocuments({ published: true }),
            EditingProject.countDocuments({ published: false }),
            EditingShowreel.findOne({ key: CURRENT_KEY }).select("enabled title videoUrl").lean(),
            EditingSkill.countDocuments(),
            EditingExperience.countDocuments()
        ]);
        return res.status(200).json({
            success: true,
            data: {
                totalProjects,
                publishedProjects,
                draftProjects,
                showreelEnabled: Boolean(showreel?.enabled),
                showreelTitle: showreel?.title || "",
                totalSkills,
                experienceEntries
            }
        });
    } catch (error) {
        console.error("Editing Overview Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch editing overview." });
    }
};

const getPublicProjects = async (req, res) => {
    try {
        const projects = await EditingProject.find({ published: true })
            .sort({ featured: -1, displayOrder: 1, createdAt: -1, _id: 1 }).lean();
        return res.status(200).json({ success: true, data: projects.map(serializeProject) });
    } catch (error) {
        console.error("Fetch Editing Projects Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch editing projects." });
    }
};

const getAdminProjects = async (req, res) => {
    try {
        const projects = await EditingProject.find()
            .sort({ displayOrder: 1, createdAt: -1, _id: 1 }).lean();
        return res.status(200).json({ success: true, data: projects.map(serializeProject) });
    } catch (error) {
        console.error("Fetch Admin Editing Projects Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch editing projects." });
    }
};

const getProjectThumbnail = async (req, res, isAdmin = false) => {
    if (!validateId(req.params.id, res)) return;
    try {
        const query = { _id: req.params.id, ...(isAdmin ? {} : { published: true }) };
        const project = await EditingProject.findOne(query).select("thumbnailFileId thumbnailContentType").lean();
        if (!project?.thumbnailFileId) return res.status(404).json({ success: false, message: "Project thumbnail not found." });
        const bucket = getThumbnailBucket();
        const stored = await bucket.find({ _id: project.thumbnailFileId }).next();
        if (!stored) return res.status(404).json({ success: false, message: "Project thumbnail not found." });
        res.set({
            "Content-Type": project.thumbnailContentType || stored.metadata?.contentType,
            "Content-Length": String(stored.length),
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
        });
        const stream = bucket.openDownloadStream(project.thumbnailFileId);
        stream.on("error", (error) => {
            console.error("Editing Thumbnail Download Error:", error.message);
            if (res.headersSent) return res.destroy(error);
            res.status(500).json({ success: false, message: "Unable to retrieve thumbnail." });
        });
        stream.pipe(res);
    } catch (error) {
        console.error("Editing Thumbnail Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to retrieve thumbnail." });
    }
};

const createProject = async (req, res) => {
    const projectData = normalizeProject({ ...req.body, ...(req.file ? { thumbnailFileId: "uploaded" } : {}) });
    if (!projectData) return res.status(400).json({ success: false, message: "Editing project fields are invalid." });
    let thumbnail;
    try {
        if (req.file) thumbnail = await uploadThumbnail(req.file);
        const project = await EditingProject.create({
            ...projectData,
            ...(thumbnail ? { thumbnailFileId: thumbnail.fileId, thumbnailContentType: thumbnail.contentType } : {})
        });
        return res.status(201).json({ success: true, message: "Editing project created.", data: serializeProject(project) });
    } catch (error) {
        if (thumbnail?.fileId) await deleteThumbnail(thumbnail.fileId).catch((cleanupError) => console.error("Editing Thumbnail Cleanup Error:", cleanupError.message));
        if (error.code === "INVALID_THUMBNAIL_CONTENT") return res.status(400).json({ success: false, message: error.message });
        console.error("Create Editing Project Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to create editing project." });
    }
};

const updateProject = async (req, res) => {
    if (!validateId(req.params.id, res)) return;
    let thumbnail;
    try {
        const existing = await EditingProject.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Editing project not found." });
        const data = normalizeProject(req.body, existing);
        if (!data) return res.status(400).json({ success: false, message: "Editing project fields are invalid." });
        if (req.file) thumbnail = await uploadThumbnail(req.file);
        const previousFileId = existing.thumbnailFileId;
        const project = await EditingProject.findByIdAndUpdate(req.params.id, {
            ...data,
            ...(thumbnail ? { thumbnailFileId: thumbnail.fileId, thumbnailContentType: thumbnail.contentType } : {})
        }, { new: true, runValidators: true });
        if (!project) {
            if (thumbnail?.fileId) await deleteThumbnail(thumbnail.fileId);
            return res.status(404).json({ success: false, message: "Editing project not found." });
        }
        let warning;
        if (thumbnail && previousFileId) {
            try { await deleteThumbnail(previousFileId); } catch (error) {
                console.error("Previous Editing Thumbnail Cleanup Error:", error.message);
                warning = "Project updated, but its previous thumbnail could not be removed.";
            }
        }
        return res.status(200).json({ success: true, message: "Editing project updated.", data: serializeProject(project), ...(warning ? { warning } : {}) });
    } catch (error) {
        if (thumbnail?.fileId) await deleteThumbnail(thumbnail.fileId).catch((cleanupError) => console.error("Editing Thumbnail Rollback Error:", cleanupError.message));
        if (error.code === "INVALID_THUMBNAIL_CONTENT") return res.status(400).json({ success: false, message: error.message });
        console.error("Update Editing Project Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update editing project." });
    }
};

const setProjectPublished = async (req, res) => {
    if (!validateId(req.params.id, res)) return;
    if (typeof req.body?.published !== "boolean") return res.status(400).json({ success: false, message: "Published must be true or false." });
    try {
        const project = await EditingProject.findByIdAndUpdate(req.params.id, { published: req.body.published }, { new: true, runValidators: true });
        if (!project) return res.status(404).json({ success: false, message: "Editing project not found." });
        return res.status(200).json({ success: true, data: serializeProject(project), message: project.published ? "Project published." : "Project unpublished." });
    } catch (error) {
        console.error("Publish Editing Project Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to change project publication." });
    }
};

const deleteProject = async (req, res) => {
    if (!validateId(req.params.id, res)) return;
    try {
        const project = await EditingProject.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: "Editing project not found." });
        let warning;
        try { await deleteThumbnail(project.thumbnailFileId); } catch (error) {
            console.error("Editing Project Thumbnail Cleanup Error:", error.message);
            warning = "Project deleted, but its thumbnail file could not be removed.";
        }
        return res.status(200).json({ success: true, message: "Editing project deleted.", ...(warning ? { warning } : {}) });
    } catch (error) {
        console.error("Delete Editing Project Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to delete editing project." });
    }
};

const getPublicShowreel = async (req, res) => {
    try {
        const showreel = await EditingShowreel.findOne({ key: CURRENT_KEY, enabled: true }).select("title description videoUrl updatedAt").lean();
        return res.status(200).json({ success: true, data: showreel });
    } catch (error) {
        console.error("Fetch Editing Showreel Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch showreel." });
    }
};

const getAdminShowreel = async (req, res) => {
    try {
        const showreel = await EditingShowreel.findOne({ key: CURRENT_KEY }).lean();
        return res.status(200).json({ success: true, data: showreel });
    } catch (error) {
        console.error("Fetch Admin Showreel Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch showreel settings." });
    }
};

const updateShowreel = async (req, res) => {
    const { title, description = "", videoUrl, enabled } = req.body || {};
    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const normalizedDescription = typeof description === "string" ? description.trim() : null;
    const normalizedUrl = typeof videoUrl === "string" ? videoUrl.trim() : "";
    const normalizedEnabled = parseBoolean(enabled);
    if (!normalizedTitle || normalizedTitle.length > 160 || normalizedDescription === null || normalizedDescription.length > 1500 || !validVideoUrl(normalizedUrl) || normalizedEnabled === null) {
        return res.status(400).json({ success: false, message: "Showreel details are invalid. Use a valid YouTube, Vimeo, or hosted video URL." });
    }
    try {
        const showreel = await EditingShowreel.findOneAndUpdate({ key: CURRENT_KEY }, {
            key: CURRENT_KEY,
            title: normalizedTitle,
            description: normalizedDescription,
            videoUrl: normalizedUrl,
            enabled: normalizedEnabled
        }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
        return res.status(200).json({ success: true, message: "Showreel settings saved.", data: showreel });
    } catch (error) {
        console.error("Save Editing Showreel Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to save showreel settings." });
    }
};

const getPublicSkills = async (req, res) => {
    try {
        const skills = await EditingSkill.find({ enabled: true }).sort({ displayOrder: 1, name: 1, _id: 1 }).lean();
        return res.status(200).json({ success: true, data: skills });
    } catch (error) {
        console.error("Fetch Editing Skills Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch editing skills." });
    }
};

const getAdminSkills = async (req, res) => {
    try {
        const skills = await EditingSkill.find().sort({ displayOrder: 1, name: 1, _id: 1 }).lean();
        return res.status(200).json({ success: true, data: skills });
    } catch (error) {
        console.error("Fetch Admin Editing Skills Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch editing skills." });
    }
};

const saveSkill = async (req, res, create) => {
    if (!create && !validateId(req.params.id, res)) return;
    try {
        const existing = create ? {} : await EditingSkill.findById(req.params.id);
        if (!create && !existing) return res.status(404).json({ success: false, message: "Editing skill not found." });
        const data = normalizeSkill(req.body, existing);
        if (!data) return res.status(400).json({ success: false, message: "Editing skill fields are invalid." });
        const skill = create ? await EditingSkill.create(data) : await EditingSkill.findByIdAndUpdate(req.params.id, data.proficiencyLevel ? { $set: data } : { $set: data, $unset: { proficiencyLevel: 1 } }, { new: true, runValidators: true });
        return res.status(create ? 201 : 200).json({ success: true, message: create ? "Editing skill created." : "Editing skill updated.", data: skill });
    } catch (error) {
        console.error("Save Editing Skill Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to save editing skill." });
    }
};

const deleteSkill = async (req, res) => {
    if (!validateId(req.params.id, res)) return;
    try {
        const skill = await EditingSkill.findByIdAndDelete(req.params.id);
        if (!skill) return res.status(404).json({ success: false, message: "Editing skill not found." });
        return res.status(200).json({ success: true, message: "Editing skill deleted." });
    } catch (error) {
        console.error("Delete Editing Skill Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to delete editing skill." });
    }
};

const getPublicExperience = async (req, res) => {
    try {
        const experience = await EditingExperience.find({ published: true })
            .sort({ displayOrder: 1, startDate: -1, _id: 1 }).lean();
        return res.status(200).json({ success: true, data: experience });
    } catch (error) {
        console.error("Fetch Editing Experience Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch editing experience." });
    }
};

const getAdminExperience = async (req, res) => {
    try {
        const experience = await EditingExperience.find().sort({ displayOrder: 1, startDate: -1, _id: 1 }).lean();
        return res.status(200).json({ success: true, data: experience });
    } catch (error) {
        console.error("Fetch Admin Editing Experience Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch editing experience." });
    }
};

const saveExperience = async (req, res, create) => {
    if (!create && !validateId(req.params.id, res)) return;
    try {
        const existing = create ? {} : await EditingExperience.findById(req.params.id);
        if (!create && !existing) return res.status(404).json({ success: false, message: "Editing experience not found." });
        const data = normalizeExperience(req.body, existing);
        if (!data) return res.status(400).json({ success: false, message: "Editing experience fields are invalid." });
        const item = create ? await EditingExperience.create(data) : await EditingExperience.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        return res.status(create ? 201 : 200).json({ success: true, message: create ? "Experience entry created." : "Experience entry updated.", data: item });
    } catch (error) {
        console.error("Save Editing Experience Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to save editing experience." });
    }
};

const setExperiencePublished = async (req, res) => {
    if (!validateId(req.params.id, res)) return;
    if (typeof req.body?.published !== "boolean") return res.status(400).json({ success: false, message: "Published must be true or false." });
    try {
        const item = await EditingExperience.findByIdAndUpdate(req.params.id, { published: req.body.published }, { new: true, runValidators: true });
        if (!item) return res.status(404).json({ success: false, message: "Editing experience not found." });
        return res.status(200).json({ success: true, data: item, message: item.published ? "Experience published." : "Experience unpublished." });
    } catch (error) {
        console.error("Publish Editing Experience Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to change experience publication." });
    }
};

const deleteExperience = async (req, res) => {
    if (!validateId(req.params.id, res)) return;
    try {
        const item = await EditingExperience.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: "Editing experience not found." });
        return res.status(200).json({ success: true, message: "Experience entry deleted." });
    } catch (error) {
        console.error("Delete Editing Experience Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to delete editing experience." });
    }
};

const getPublicProfile = async (req, res) => {
    try {
        const profile = await EditingProfile.findOne({ key: CURRENT_KEY }).select("professionalIntroduction aboutDescription creativeApproach editingInterests instagramUrl linkedinUrl contactEmail updatedAt").lean();
        return res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error("Fetch Editing Profile Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch editing profile." });
    }
};

const getAdminProfile = async (req, res) => {
    try {
        const profile = await EditingProfile.findOne({ key: CURRENT_KEY }).lean();
        return res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error("Fetch Admin Editing Profile Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch editing profile settings." });
    }
};

const updateProfile = async (req, res) => {
    const data = normalizeProfile(req.body);
    if (!data) return res.status(400).json({ success: false, message: "Editing profile fields are invalid." });
    try {
        const profile = await EditingProfile.findOneAndUpdate({ key: CURRENT_KEY }, { key: CURRENT_KEY, ...data }, {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true
        });
        return res.status(200).json({ success: true, message: "Editing profile updated.", data: profile });
    } catch (error) {
        console.error("Update Editing Profile Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update editing profile." });
    }
};

module.exports = {
    createProject,
    deleteExperience,
    deleteProject,
    deleteSkill,
    getAdminExperience,
    getAdminProfile,
    getAdminProjects,
    getAdminShowreel,
    getAdminSkills,
    getEditingOverview,
    getProjectThumbnail,
    getPublicExperience,
    getPublicProfile,
    getPublicProjects,
    getPublicShowreel,
    getPublicSkills,
    saveExperience,
    saveSkill,
    setExperiencePublished,
    setProjectPublished,
    updateProfile,
    updateProject,
    updateShowreel
};