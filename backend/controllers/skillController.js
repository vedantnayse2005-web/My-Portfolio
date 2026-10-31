const mongoose = require("mongoose");
const Skill = require("../models/Skill");

const SKILL_CATEGORIES = [
    "Frontend Development",
    "Backend Development",
    "Databases",
    "Programming Languages",
    "Developer Tools"
];
const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

const normalizeSkill = (data, existing = {}) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;

    const nameValue = data.name ?? existing.name ?? "";
    const categoryValue = data.category ?? existing.category ?? "";
    const iconValue = data.icon ?? existing.icon ?? "";
    if ([nameValue, categoryValue, iconValue].some((value) => typeof value !== "string")) {
        return null;
    }

    const name = nameValue.trim();
    const category = categoryValue.trim();
    const icon = iconValue.trim();
    const proficiencyValue = data.proficiencyLevel ?? existing.proficiencyLevel ?? "";
    if (typeof proficiencyValue !== "string") return null;
    const proficiencyLevel = proficiencyValue.trim();

    const orderValue = data.displayOrder ?? existing.displayOrder ?? 0;
    const displayOrder = typeof orderValue === "number" ? orderValue : Number(orderValue);
    if (!Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 10000) {
        return null;
    }

    let isActive = data.isActive ?? existing.isActive ?? true;
    if (isActive === "true") isActive = true;
    if (isActive === "false") isActive = false;
    if (typeof isActive !== "boolean") return null;

    if (
        !name || name.length > 80 ||
        !SKILL_CATEGORIES.includes(category) ||
        (proficiencyLevel && !PROFICIENCY_LEVELS.includes(proficiencyLevel)) ||
        icon.length > 2048
    ) {
        return null;
    }

    if (icon) {
        try {
            const parsedIcon = new URL(icon);
            if (parsedIcon.protocol !== "https:" && parsedIcon.protocol !== "http:") return null;
        } catch {
            return null;
        }
    }

    return {
        name,
        category,
        ...(proficiencyLevel ? { proficiencyLevel } : {}),
        icon,
        displayOrder,
        isActive
    };
};

const getPublicSkills = async (req, res) => {
    try {
        const skills = await Skill.find({ isActive: true })
            .sort({ category: 1, displayOrder: 1, name: 1 })
            .select("name category proficiencyLevel icon displayOrder")
            .lean();

        return res.status(200).json({ success: true, data: skills });
    } catch (error) {
        console.error("Fetch Skills Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch skills." });
    }
};

const getAdminSkills = async (req, res) => {
    try {
        const skills = await Skill.find().sort({ category: 1, displayOrder: 1, name: 1 }).lean();
        return res.status(200).json({ success: true, data: skills });
    } catch (error) {
        console.error("Fetch Admin Skills Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch skills." });
    }
};

const createSkill = async (req, res) => {
    const skillData = normalizeSkill(req.body);
    if (!skillData) {
        return res.status(400).json({ success: false, message: "Skill details are invalid." });
    }

    try {
        const skill = await Skill.create(skillData);
        return res.status(201).json({
            success: true,
            message: "Skill created successfully.",
            data: skill
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "This skill already exists in that category." });
        }
        console.error("Create Skill Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to create skill." });
    }
};

const updateSkill = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid skill ID." });
    }

    try {
        const existing = await Skill.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Skill not found." });
        }

        const skillData = normalizeSkill(req.body, existing);
        if (!skillData) {
            return res.status(400).json({ success: false, message: "Skill details are invalid." });
        }

        const update = skillData.proficiencyLevel
            ? { $set: skillData }
            : { $set: skillData, $unset: { proficiencyLevel: 1 } };
        const skill = await Skill.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true
        });
        return res.status(200).json({
            success: true,
            message: "Skill updated successfully.",
            data: skill
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "This skill already exists in that category." });
        }
        console.error("Update Skill Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update skill." });
    }
};

const deleteSkill = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid skill ID." });
    }

    try {
        const skill = await Skill.findByIdAndDelete(req.params.id);
        if (!skill) {
            return res.status(404).json({ success: false, message: "Skill not found." });
        }
        return res.status(200).json({ success: true, message: "Skill deleted successfully." });
    } catch (error) {
        console.error("Delete Skill Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to delete skill." });
    }
};

module.exports = {
    createSkill,
    deleteSkill,
    getAdminSkills,
    getPublicSkills,
    updateSkill
};