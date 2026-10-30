const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: "current"
        },
        filename: {
            type: String,
            required: true
        },
        contentType: {
            type: String,
            required: true,
            default: "application/pdf"
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
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Resume", resumeSchema);
