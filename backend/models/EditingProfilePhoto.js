const mongoose = require("mongoose");

const editingProfilePhotoSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: "current"
        },
        contentType: {
            type: String,
            required: true,
            enum: ["image/jpeg", "image/png", "image/webp"]
        },
        fileSize: {
            type: Number,
            required: true
        },
        gridFsId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        uploadedAt: {
            type: Date,
            required: true,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("EditingProfilePhoto", editingProfilePhotoSchema);
