const mongoose = require("mongoose");

const editingProfileSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, default: "current" },
        professionalIntroduction: { type: String, trim: true, default: "", maxlength: 500 },
        aboutDescription: { type: String, trim: true, default: "", maxlength: 3000 },
        creativeApproach: { type: String, trim: true, default: "", maxlength: 2000 },
        editingInterests: {
            type: [{ type: String, trim: true, maxlength: 100 }],
            default: [],
            validate: {
                validator: (interests) => interests.length <= 30,
                message: "A profile can list at most 30 editing interests."
            }
        },
        instagramUrl: { type: String, trim: true, default: "", maxlength: 2048 },
        linkedinUrl: { type: String, trim: true, default: "", maxlength: 2048 },
        contactEmail: { type: String, trim: true, lowercase: true, default: "", maxlength: 254 }
    },
    { timestamps: true }
);

module.exports = mongoose.model("EditingProfile", editingProfileSchema);