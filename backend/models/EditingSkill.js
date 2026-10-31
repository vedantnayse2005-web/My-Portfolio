const mongoose = require("mongoose");

const editingSkillSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        category: {
            type: String,
            required: true,
            enum: [
                "Video Editing",
                "Color Grading",
                "Motion Graphics",
                "Sound Design",
                "Storytelling",
                "Social Media Content Editing",
                "Other"
            ]
        },
        proficiencyLevel: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"]
        },
        isTool: { type: Boolean, default: false },
        displayOrder: { type: Number, min: 1, max: 10000, default: 1 },
        enabled: { type: Boolean, default: true }
    },
    { timestamps: true }
);

editingSkillSchema.index({ enabled: 1, displayOrder: 1, name: 1 });

module.exports = mongoose.model("EditingSkill", editingSkillSchema);