const { Readable } = require("stream");
const mongoose = require("mongoose");
const ProfilePhoto = require("../models/ProfilePhoto");

const CURRENT_PROFILE_PHOTO_KEY = "current";
const PROFILE_PHOTO_BUCKET = "profilePhotos";

const getProfilePhotoBucket = () => {
    const database = mongoose.connection.db;
    if (!database) {
        throw new Error("MongoDB is not connected.");
    }

    return new mongoose.mongo.GridFSBucket(database, {
        bucketName: PROFILE_PHOTO_BUCKET
    });
};

const getVerifiedImageContentType = (buffer) => {
    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        return "image/png";
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return "image/jpeg";
    }
    if (
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
        return "image/webp";
    }

    return null;
};

const getCurrentProfilePhoto = async (req, res) => {
    try {
        const profilePhoto = await ProfilePhoto.findOne({
            key: CURRENT_PROFILE_PHOTO_KEY
        }).lean();

        if (!profilePhoto) {
            return res.status(404).json({
                success: false,
                message: "No profile photo has been uploaded."
            });
        }

        const bucket = getProfilePhotoBucket();
        const storedFile = await bucket.find({ _id: profilePhoto.gridFsId }).next();
        if (!storedFile) {
            return res.status(404).json({
                success: false,
                message: "Profile photo not found."
            });
        }

        res.set({
            "Content-Type": profilePhoto.contentType,
            "Content-Length": String(storedFile.length),
            "Content-Disposition": 'inline; filename="profile-photo"',
            "Cache-Control": "no-store",
            "Cross-Origin-Resource-Policy": "cross-origin",
            "X-Content-Type-Options": "nosniff"
        });

        const downloadStream = bucket.openDownloadStream(profilePhoto.gridFsId);
        downloadStream.on("error", (error) => {
            console.error("Download Profile Photo Error:", error.message);
            if (res.headersSent) {
                res.destroy(error);
                return;
            }

            res.status(500).json({
                success: false,
                message: "Unable to retrieve the profile photo."
            });
        });
        downloadStream.pipe(res);
    } catch (error) {
        console.error("Fetch Profile Photo Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the profile photo."
        });
    }
};

const uploadProfilePhoto = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Select a JPG, PNG, or WebP profile photo to upload."
        });
    }

    const contentType = getVerifiedImageContentType(req.file.buffer);
    if (!contentType || contentType !== req.file.mimetype) {
        return res.status(400).json({
            success: false,
            message: "The uploaded file is not a valid supported image."
        });
    }

    const extensionByType = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp"
    };
    const uploadedAt = new Date();
    let uploadedFileId;

    try {
        const uploadStream = getProfilePhotoBucket().openUploadStream(
            `profile-photo${extensionByType[contentType]}`,
            { contentType }
        );
        uploadedFileId = await new Promise((resolve, reject) => {
            uploadStream.once("finish", () => resolve(uploadStream.id));
            uploadStream.once("error", reject);
            Readable.from(req.file.buffer).pipe(uploadStream);
        });

        const previousPhoto = await ProfilePhoto.findOneAndUpdate(
            { key: CURRENT_PROFILE_PHOTO_KEY },
            {
                key: CURRENT_PROFILE_PHOTO_KEY,
                contentType,
                fileSize: req.file.size,
                gridFsId: uploadedFileId,
                uploadedAt
            },
            {
                returnDocument: "before",
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        let warning;
        if (previousPhoto?.gridFsId) {
            try {
                await getProfilePhotoBucket().delete(previousPhoto.gridFsId);
            } catch (error) {
                console.error("Previous Profile Photo Cleanup Error:", error.message);
                warning = "The new photo is active, but the previous stored file could not be removed.";
            }
        }

        return res.status(200).json({
            success: true,
            message: "Profile photo uploaded successfully.",
            data: {
                contentType,
                fileSize: req.file.size,
                uploadedAt
            },
            ...(warning ? { warning } : {})
        });
    } catch (error) {
        if (uploadedFileId) {
            try {
                await getProfilePhotoBucket().delete(uploadedFileId);
            } catch (cleanupError) {
                console.error("Failed Profile Photo Upload Cleanup Error:", cleanupError.message);
            }
        }

        console.error("Upload Profile Photo Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to store the uploaded profile photo."
        });
    }
};

const removeProfilePhoto = async (req, res) => {
    try {
        const profilePhoto = await ProfilePhoto.findOneAndDelete({
            key: CURRENT_PROFILE_PHOTO_KEY
        });

        if (!profilePhoto) {
            return res.status(404).json({
                success: false,
                message: "No profile photo is currently uploaded."
            });
        }

        let warning;
        try {
            await getProfilePhotoBucket().delete(profilePhoto.gridFsId);
        } catch (error) {
            console.error("Profile Photo Cleanup Error:", error.message);
            warning = "The photo was removed from the portfolio, but its stored file could not be deleted.";
        }

        return res.status(200).json({
            success: true,
            message: "Profile photo removed successfully.",
            ...(warning ? { warning } : {})
        });
    } catch (error) {
        console.error("Remove Profile Photo Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to remove the profile photo."
        });
    }
};

module.exports = {
    getCurrentProfilePhoto,
    removeProfilePhoto,
    uploadProfilePhoto
};