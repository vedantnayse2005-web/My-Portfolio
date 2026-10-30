const path = require("path");
const { Readable } = require("stream");
const mongoose = require("mongoose");
const Resume = require("../models/Resume");

const CURRENT_RESUME_KEY = "current";
const RESUME_BUCKET = "resumes";

const getResumeBucket = () => {
    const database = mongoose.connection.db;
    if (!database) {
        throw new Error("MongoDB is not connected.");
    }

    return new mongoose.mongo.GridFSBucket(database, { bucketName: RESUME_BUCKET });
};

const getCurrentResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ key: CURRENT_RESUME_KEY }).lean();

        res.status(200).json({
            success: true,
            data: resume
                ? {
                    filename: resume.filename,
                    fileSize: resume.fileSize,
                    uploadedAt: resume.uploadedAt
                }
                : null
        });
    } catch (error) {
        console.error("Fetch Resume Status Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to fetch resume status."
        });
    }
};

const downloadResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ key: CURRENT_RESUME_KEY }).lean();

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "No resume has been uploaded yet."
            });
        }

        const downloadStream = getResumeBucket().openDownloadStream(resume.gridFsId);
        downloadStream.on("error", (error) => {
            console.error("Download Resume Error:", error.message);
            if (res.headersSent) {
                res.destroy(error);
                return;
            }

            res.status(500).json({
                success: false,
                message: "Unable to download the current resume."
            });
        });

        res.set("Content-Type", resume.contentType);
        res.set("Content-Length", String(resume.fileSize));
        res.set("Cache-Control", "no-store");
        res.attachment(resume.filename);
        downloadStream.pipe(res);
    } catch (error) {
        console.error("Download Resume Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to download the current resume."
        });
    }
};

const uploadResume = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Select a PDF resume to upload."
        });
    }

    if (req.file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
        return res.status(400).json({
            success: false,
            message: "The uploaded file is not a valid PDF."
        });
    }

    const filename = path
        .basename(req.file.originalname.replace(/\\/g, "/"))
        .replace(/[^\w.-]/g, "_");
    const safeFilename = filename.toLowerCase().endsWith(".pdf")
        ? filename
        : "resume.pdf";
    const uploadedAt = new Date();
    let uploadedFileId;

    try {
        const uploadStream = getResumeBucket().openUploadStream(safeFilename, {
            contentType: "application/pdf"
        });
        uploadedFileId = await new Promise((resolve, reject) => {
            uploadStream.once("finish", () => resolve(uploadStream.id));
            uploadStream.once("error", reject);
            Readable.from(req.file.buffer).pipe(uploadStream);
        });

        const previousResume = await Resume.findOneAndUpdate(
            { key: CURRENT_RESUME_KEY },
            {
                key: CURRENT_RESUME_KEY,
                filename: safeFilename,
                contentType: "application/pdf",
                fileSize: req.file.size,
                gridFsId: uploadedFileId,
                uploadedAt
            },
            {
                new: false,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        let previousFileCleanupWarning;
        if (previousResume?.gridFsId) {
            try {
                await getResumeBucket().delete(previousResume.gridFsId);
            } catch (error) {
                console.error("Previous Resume Cleanup Error:", error.message);
                previousFileCleanupWarning =
                    "The new resume is active, but the previous stored file could not be removed.";
            }
        }

        return res.status(200).json({
            success: true,
            message: "Resume uploaded successfully.",
            data: {
                filename: safeFilename,
                fileSize: req.file.size,
                uploadedAt
            },
            ...(previousFileCleanupWarning
                ? { warning: previousFileCleanupWarning }
                : {})
        });
    } catch (error) {
        if (uploadedFileId) {
            try {
                await getResumeBucket().delete(uploadedFileId);
            } catch (cleanupError) {
                console.error("Failed Resume Upload Cleanup Error:", cleanupError.message);
            }
        }

        console.error("Upload Resume Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to store the uploaded resume."
        });
    }
};

module.exports = {
    downloadResume,
    getCurrentResume,
    uploadResume
};
