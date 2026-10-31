const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },
        category: {
            type: String,
            required: true,
            enum: [
                "Frontend Development",
                "Backend Development",
                "Databases",
                "Programming Languages",
                "Developer Tools"
            ]
        },
        proficiencyLevel: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"]
        },
        icon: {
            type: String,
            trim: true,
            default: "",
            maxlength: 2048
        },
        displayOrder: {
            type: Number,
            min: 0,
            max: 10000,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

skillSchema.index({ name: 1, category: 1 }, { unique: true });
skillSchema.index({ isActive: 1, category: 1, displayOrder: 1 });

module.exports = mongoose.model("Skill", skillSchema);