const mongoose = require("mongoose");

const editingProjectSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 140 },
        category: {
            type: String,
            required: true,
            enum: [
                "Instagram Reels",
                "YouTube Videos",
                "Cinematic Editing",
                "Promotional Videos",
                "Motion Graphics",
                "Documentary",
                "Other"
            ]
        },
        description: { type: String, required: true, trim: true, maxlength: 3000 },
        thumbnailFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
        thumbnailContentType: { type: String, default: "" },
        videoUrl: { type: String, required: true, trim: true, maxlength: 2048 },
        software: {
            type: [{ type: String, trim: true, maxlength: 80 }],
            default: [],
            validate: {
                validator: (software) => software.length <= 20,
                message: "A project can list at most 20 software/tools."
            }
        },
        completionDate: { type: Date, default: null },
        featured: { type: Boolean, default: false },
        displayOrder: { type: Number, min: 1, max: 10000, default: 1 },
        published: { type: Boolean, default: false }
    },
    { timestamps: true }
);

editingProjectSchema.index({ published: 1, featured: -1, displayOrder: 1 });

module.exports = mongoose.model("EditingProject", editingProjectSchema);