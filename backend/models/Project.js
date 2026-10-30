
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 3000
        },

        imageUrl: {
            type: String,
            trim: true,
            default: "",
            maxlength: 2048
        },

        imageFileId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        imageContentType: {
            type: String,
            trim: true,
            default: ""
        },

        technologies: {
            type: [
                {
                    type: String,
                    trim: true,
                    maxlength: 40
                }
            ],
            default: [],
            validate: {
                validator: function (technologies) {
                    return technologies.length <= 20;
                },
                message: "A project cannot have more than 20 technologies."
            }
        },

        githubLink: {
            type: String,
            trim: true,
            default: "",
            maxlength: 2048
        },

        liveDemoLink: {
            type: String,
            trim: true,
            default: "",
            maxlength: 2048
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Project", projectSchema);
