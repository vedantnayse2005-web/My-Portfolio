const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160
        },
        issuer: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160
        },
        issueDate: {
            type: Date,
            required: true
        },
        credentialId: {
            type: String,
            trim: true,
            default: "",
            maxlength: 160
        },
        category: {
            type: String,
            trim: true,
            default: "Other",
            enum: ["Frontend", "Backend", "Database", "Cloud", "Other"]
        },
        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000
        },
        fileName: {
            type: String,
            required: true,
            maxlength: 255
        },
        contentType: {
            type: String,
            required: true,
            enum: ["application/pdf", "image/jpeg", "image/png"]
        },
        fileSize: {
            type: Number,
            required: true,
            max: 5 * 1024 * 1024
        },
        gridFsId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        published: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

certificateSchema.index({ published: 1, issueDate: -1 });

module.exports = mongoose.model("Certificate", certificateSchema);