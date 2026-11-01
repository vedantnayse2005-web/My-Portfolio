const About = require("../models/About");

const ABOUT_KEY = "primary";
const INITIAL_ABOUT_CONTENT = {
    heading: "Turning curiosity into meaningful code.",
    shortIntroduction:
        "I'm Vedant Nayse, a final-year Computer Science Engineering student passionate about software development and building modern web applications.",
    professionalBiography:
        "I enjoy working with JavaScript, React, Node.js, and databases to create practical digital solutions. Through projects like MelodyStream and TaskFlow, I've explored frontend development, CRUD operations, database management, and API integration.\n\nI'm currently focused on strengthening my full-stack development skills and growing as a software developer.",
    educationDetails:
        "B.Tech — Computer Science\nFinal Year · Prof. Ram Meghe Institute of Technology and Research",
    careerGoals:
        "Full-Stack Development\nBuilding responsive interfaces and practical web applications.",
    additionalInformation:
        "React & Backend Development\nImproving my skills through hands-on projects and practice."
};

const getOrCreateAbout = async () => {
    let about = await About.findOne({ key: ABOUT_KEY });
    if (about) return about;

    try {
        return await About.create({
            key: ABOUT_KEY,
            ...INITIAL_ABOUT_CONTENT
        });
    } catch (error) {
        if (error.code !== 11000) throw error;

        about = await About.findOne({ key: ABOUT_KEY });
        if (!about) throw error;
        return about;
    }
};

const getAboutContent = async (req, res) => {
    try {
        const about = await getOrCreateAbout();
        return res.status(200).json({ success: true, data: about });
    } catch (error) {
        console.error("Fetch About Content Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch About content."
        });
    }
};

const updateAboutContent = async (req, res) => {
    const fields = [
        ["heading", 200],
        ["shortIntroduction", 1000],
        ["professionalBiography", 4000],
        ["educationDetails", 1000],
        ["careerGoals", 1000],
        ["additionalInformation", 1000]
    ];

    if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body) ||
        fields.some(([field]) => typeof req.body[field] !== "string")
    ) {
        return res.status(400).json({
            success: false,
            message: "All About fields must be provided as text."
        });
    }

    const content = Object.fromEntries(
        fields.map(([field]) => [field, req.body[field].trim()])
    );

    if (!content.heading || !content.shortIntroduction || !content.professionalBiography) {
        return res.status(400).json({
            success: false,
            message: "Heading, short introduction, and biography are required."
        });
    }

    const oversizedField = fields.find(
        ([field, maxLength]) => content[field].length > maxLength
    );
    if (oversizedField) {
        return res.status(400).json({
            success: false,
            message: `${oversizedField[0]} must be ${oversizedField[1]} characters or fewer.`
        });
    }

    try {
        const about = await About.findOneAndUpdate(
            { key: ABOUT_KEY },
            { $set: content },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "About content saved successfully.",
            data: about
        });
    } catch (error) {
        console.error("Update About Content Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to save About content."
        });
    }
};

module.exports = {
    getAboutContent,
    updateAboutContent
};
