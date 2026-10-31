const mongoose = require("mongoose");

const editingShowreelSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, default: "current" },
        title: { type: String, required: true, trim: true, maxlength: 160 },
        description: { type: String, trim: true, default: "", maxlength: 1500 },
        videoUrl: { type: String, required: true, trim: true, maxlength: 2048 },
        enabled: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model("EditingShowreel", editingShowreelSchema);