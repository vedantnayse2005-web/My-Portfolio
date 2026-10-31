const { Readable } = require("stream");
const mongoose = require("mongoose");
const EditingProfilePhoto = require("../models/EditingProfilePhoto");

const CURRENT_KEY = "current";
const BUCKET_NAME = "editingProfilePhotos";

const getBucket = () => {
    const database = mongoose.connection.db;
    if (!database) throw new Error("MongoDB is not connected.");
    return new mongoose.mongo.GridFSBucket(database, { bucketName: BUCKET_NAME });
};

const getVerifiedImageContentType = (buffer) => {
    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
    if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
    return null;
};

const getEditingProfilePhotoStatus = async (req, res) => {
    try {
        const photo = await EditingProfilePhoto.findOne({ key: CURRENT_KEY }).select("contentType fileSize uploadedAt").lean();
        return res.status(200).json({ success: true, data: { exists: Boolean(photo), ...(photo || {}) } });
    } catch (error) {
        console.error("Fetch Editing Profile Photo Status Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to retrieve the editing profile photo status." });
    }
};

const getEditingProfilePhoto = async (req, res) => {
    try {
        const photo = await EditingProfilePhoto.findOne({ key: CURRENT_KEY }).lean();
        if (!photo) return res.status(404).json({ success: false, message: "No editing profile photo has been uploaded." });

        const bucket = getBucket();
        const storedFile = await bucket.find({ _id: photo.gridFsId }).next();
        if (!storedFile) return res.status(404).json({ success: false, message: "Editing profile photo not found." });

        res.set({
            "Content-Type": photo.contentType,
            "Content-Length": String(storedFile.length),
            "Content-Disposition": 'inline; filename="editing-profile-photo"',
            "Cache-Control": "no-store",
            "Cross-Origin-Resource-Policy": "cross-origin",
            "X-Content-Type-Options": "nosniff"
        });
        const downloadStream = bucket.openDownloadStream(photo.gridFsId);
        downloadStream.on("error", (error) => {
            console.error("Download Editing Profile Photo Error:", error.message);
            if (res.headersSent) return res.destroy(error);
            return res.status(500).json({ success: false, message: "Unable to retrieve the editing profile photo." });
        });
        downloadStream.pipe(res);
    } catch (error) {
        console.error("Fetch Editing Profile Photo Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to retrieve the editing profile photo." });
    }
};

const uploadEditingProfilePhoto = async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "Select a JPG, JPEG, PNG, or WebP editing profile photo to upload." });

    const contentType = getVerifiedImageContentType(req.file.buffer);
    if (!contentType || contentType !== req.file.mimetype) {
        return res.status(400).json({ success: false, message: "The uploaded file is not a valid supported image." });
    }

    const extension = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[contentType];
    let uploadedFileId;
    try {
        const bucket = getBucket();
        const uploadStream = bucket.openUploadStream(`editing-profile-photo${extension}`, { contentType });
        uploadedFileId = await new Promise((resolve, reject) => {
            uploadStream.once("finish", () => resolve(uploadStream.id));
            uploadStream.once("error", reject);
            Readable.from(req.file.buffer).pipe(uploadStream);
        });

        const previousPhoto = await EditingProfilePhoto.findOneAndUpdate(
            { key: CURRENT_KEY },
            { key: CURRENT_KEY, contentType, fileSize: req.file.size, gridFsId: uploadedFileId, uploadedAt: new Date() },
            { returnDocument: "before", upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        let warning;
        if (previousPhoto?.gridFsId) {
            try {
                await bucket.delete(previousPhoto.gridFsId);
            } catch (error) {
                console.error("Previous Editing Profile Photo Cleanup Error:", error.message);
                warning = "The new editing photo is active, but the previous stored file could not be removed.";
            }
        }
        return res.status(200).json({
            success: true,
            message: "Editing profile photo uploaded successfully.",
            data: { contentType, fileSize: req.file.size },
            ...(warning ? { warning } : {})
        });
    } catch (error) {
        if (uploadedFileId) {
            try {
                await getBucket().delete(uploadedFileId);
            } catch (cleanupError) {
                console.error("Failed Editing Profile Photo Upload Cleanup Error:", cleanupError.message);
            }
        }
        console.error("Upload Editing Profile Photo Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to store the uploaded editing profile photo." });
    }
};

const removeEditingProfilePhoto = async (req, res) => {
    try {
        const photo = await EditingProfilePhoto.findOneAndDelete({ key: CURRENT_KEY });
        if (!photo) return res.status(404).json({ success: false, message: "No editing profile photo is currently uploaded." });

        let warning;
        try {
            await getBucket().delete(photo.gridFsId);
        } catch (error) {
            console.error("Editing Profile Photo Cleanup Error:", error.message);
            warning = "The editing photo was removed from the portfolio, but its stored file could not be deleted.";
        }
        return res.status(200).json({ success: true, message: "Editing profile photo removed successfully.", ...(warning ? { warning } : {}) });
    } catch (error) {
        console.error("Remove Editing Profile Photo Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to remove the editing profile photo." });
    }
};

module.exports = {
    getEditingProfilePhoto,
    getEditingProfilePhotoStatus,
    removeEditingProfilePhoto,
    uploadEditingProfilePhoto
};
