const mongoose = require("mongoose");

const editingExperienceSchema = new mongoose.Schema(
    {
        role: { type: String, required: true, trim: true, maxlength: 140 },
        organization: { type: String, required: true, trim: true, maxlength: 160 },
        employmentType: {
            type: String,
            required: true,
            enum: ["Freelance", "Internship", "Full-time", "Part-time", "Contract", "Other"]
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, default: null },
        currentlyWorking: { type: Boolean, default: false },
        description: { type: String, required: true, trim: true, maxlength: 3000 },
        displayOrder: { type: Number, min: 1, max: 10000, default: 1 },
        published: { type: Boolean, default: false }
    },
    { timestamps: true }
);

editingExperienceSchema.index({ published: 1, displayOrder: 1, startDate: -1 });

module.exports = mongoose.model("EditingExperience", editingExperienceSchema);