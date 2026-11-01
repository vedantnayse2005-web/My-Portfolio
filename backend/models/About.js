const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: "primary"
        },
        heading: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        shortIntroduction: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        professionalBiography: {
            type: String,
            required: true,
            trim: true,
            maxlength: 4000
        },
        educationDetails: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000
        },
        careerGoals: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000
        },
        additionalInformation: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("About", aboutSchema);
