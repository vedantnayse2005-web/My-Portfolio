const { Readable } = require("stream");
const mongoose = require("mongoose");
const path = require("path");
const Certificate = require("../models/Certificate");

const CERTIFICATE_BUCKET = "certificateFiles";

const getCertificateBucket = () => {
    const database = mongoose.connection.db;
    if (!database) {
        throw new Error("MongoDB is not connected.");
    }

    return new mongoose.mongo.GridFSBucket(database, {
        bucketName: CERTIFICATE_BUCKET
    });
};

const getVerifiedContentType = (buffer) => {
    if (buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
        return "application/pdf";
    }
    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        return "image/png";
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return "image/jpeg";
    }

    return null;
};

const serializeCertificate = (certificate) => ({
    _id: certificate._id,
    title: certificate.title,
    issuer: certificate.issuer,
    issueDate: certificate.issueDate,
    credentialId: certificate.credentialId,
    category: certificate.category,
    description: certificate.description,
    fileName: certificate.fileName,
    contentType: certificate.contentType,
    fileSize: certificate.fileSize,
    published: certificate.published,
    createdAt: certificate.createdAt,
    updatedAt: certificate.updatedAt,
    fileUrl: `/api/certificates/${certificate._id}/file`
});

const normalizeCertificate = (data, existing = {}) => {
    const fields = ["title", "issuer", "issueDate", "credentialId", "category", "description"];
    if (!data || fields.some((field) => data[field] !== undefined && typeof data[field] !== "string")) {
        return null;
    }

    const title = (data.title ?? existing.title ?? "").trim();
    const issuer = (data.issuer ?? existing.issuer ?? "").trim();
    const issueDateValue = data.issueDate ?? existing.issueDate;
    const issueDate = issueDateValue ? new Date(issueDateValue) : null;
    const credentialId = (data.credentialId ?? existing.credentialId ?? "").trim();
    const category = (data.category ?? existing.category ?? "Other").trim();
    const description = (data.description ?? existing.description ?? "").trim();

    if (
        !title || title.length > 160 ||
        !issuer || issuer.length > 160 ||
        !issueDate || Number.isNaN(issueDate.getTime()) ||
        credentialId.length > 160 ||
        !["Frontend", "Backend", "Database", "Cloud", "Other"].includes(category) ||
        description.length > 1000
    ) {
        return null;
    }

    const normalized = {
        title,
        issuer,
        issueDate,
        credentialId,
        category,
        description
    };

    if (data.published !== undefined) {
        if (typeof data.published === "boolean") {
            normalized.published = data.published;
        } else if (data.published === "true" || data.published === "false") {
            normalized.published = data.published === "true";
        } else {
            return null;
        }
    } else if (!existing._id) {
        normalized.published = false;
    }

    return normalized;
};

const uploadFile = async (file) => {
    const contentType = getVerifiedContentType(file.buffer);
    if (!contentType || contentType !== file.mimetype) {
        const error = new Error("The uploaded file is not a valid supported certificate.");
        error.code = "INVALID_CERTIFICATE_CONTENT";
        throw error;
    }

    const extension = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png"
    }[contentType];
    const uploadStream = getCertificateBucket().openUploadStream(
        `certificate-${Date.now()}${extension}`,
        { contentType }
    );
    const gridFsId = await new Promise((resolve, reject) => {
        uploadStream.once("finish", () => resolve(uploadStream.id));
        uploadStream.once("error", reject);
        Readable.from(file.buffer).pipe(uploadStream);
    });

    const fileName = path.basename(file.originalname).slice(0, 255);
    return { gridFsId, contentType, fileSize: file.size, fileName };
};

const removeStoredFile = async (gridFsId) => {
    if (!gridFsId) return;
    await getCertificateBucket().delete(gridFsId);
};

const getPublishedCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find({ published: true })
            .sort({ issueDate: -1, createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: certificates.map(serializeCertificate)
        });
    } catch (error) {
        console.error("Fetch Published Certificates Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch certificates."
        });
    }
};

const getAdminCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find()
            .sort({ issueDate: -1, createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: certificates.map(serializeCertificate)
        });
    } catch (error) {
        console.error("Fetch Admin Certificates Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch certificates."
        });
    }
};

const getPublishedCertificate = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid certificate ID." });
    }

    try {
        const certificate = await Certificate.findOne({
            _id: req.params.id,
            published: true
        }).lean();

        if (!certificate) {
            return res.status(404).json({ success: false, message: "Certificate not found." });
        }

        return res.status(200).json({
            success: true,
            data: serializeCertificate(certificate)
        });
    } catch (error) {
        console.error("Fetch Certificate Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch certificate." });
    }
};

const getCertificateFile = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid certificate ID." });
    }

    try {
        const certificate = await Certificate.findOne({
            _id: req.params.id,
            published: true
        }).select("gridFsId contentType fileName").lean();

        if (!certificate) {
            return res.status(404).json({ success: false, message: "Certificate file not found." });
        }

        const bucket = getCertificateBucket();
        const storedFile = await bucket.find({ _id: certificate.gridFsId }).next();
        if (!storedFile) {
            return res.status(404).json({ success: false, message: "Certificate file not found." });
        }

        const extension = certificate.contentType === "application/pdf" ? ".pdf"
            : certificate.contentType === "image/png" ? ".png" : ".jpg";
        res.set({
            "Content-Type": certificate.contentType,
            "Content-Length": String(storedFile.length),
            "Content-Disposition": `inline; filename="certificate${extension}"`,
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
        });

        const downloadStream = bucket.openDownloadStream(certificate.gridFsId);
        downloadStream.on("error", (error) => {
            console.error("Download Certificate Error:", error.message);
            if (res.headersSent) {
                res.destroy(error);
                return;
            }
            res.status(500).json({ success: false, message: "Unable to retrieve certificate file." });
        });
        downloadStream.pipe(res);
    } catch (error) {
        console.error("Fetch Certificate File Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to retrieve certificate file." });
    }
};

const createCertificate = async (req, res) => {
    const data = normalizeCertificate(req.body);
    if (!data || !req.file) {
        return res.status(400).json({
            success: false,
            message: "Valid certificate details and a certificate file are required."
        });
    }

    let uploadedFile;
    try {
        uploadedFile = await uploadFile(req.file);
        const certificate = await Certificate.create({ ...data, ...uploadedFile });
        return res.status(201).json({
            success: true,
            message: "Certificate created successfully.",
            data: serializeCertificate(certificate)
        });
    } catch (error) {
        if (uploadedFile?.gridFsId) {
            try {
                await removeStoredFile(uploadedFile.gridFsId);
            } catch (cleanupError) {
                console.error("Certificate Upload Cleanup Error:", cleanupError.message);
            }
        }
        if (error.code === "INVALID_CERTIFICATE_CONTENT") {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("Create Certificate Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to create certificate." });
    }
};

const updateCertificate = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid certificate ID." });
    }

    let uploadedFile;
    try {
        const current = await Certificate.findById(req.params.id);
        if (!current) {
            return res.status(404).json({ success: false, message: "Certificate not found." });
        }

        const data = normalizeCertificate(req.body, current);
        if (!data) {
            return res.status(400).json({ success: false, message: "Certificate details are invalid." });
        }

        if (req.file) {
            uploadedFile = await uploadFile(req.file);
        }

        const previousFileId = current.gridFsId;
        const certificate = await Certificate.findByIdAndUpdate(
            req.params.id,
            { ...data, ...(uploadedFile || {}) },
            { new: true, runValidators: true }
        );

        let warning;
        if (uploadedFile) {
            try {
                await removeStoredFile(previousFileId);
            } catch (error) {
                console.error("Previous Certificate Cleanup Error:", error.message);
                warning = "The certificate was updated, but its previous file could not be removed.";
            }
        }

        return res.status(200).json({
            success: true,
            message: "Certificate updated successfully.",
            data: serializeCertificate(certificate),
            ...(warning ? { warning } : {})
        });
    } catch (error) {
        if (uploadedFile?.gridFsId) {
            try {
                await removeStoredFile(uploadedFile.gridFsId);
            } catch (cleanupError) {
                console.error("Certificate Update Cleanup Error:", cleanupError.message);
            }
        }
        if (error.code === "INVALID_CERTIFICATE_CONTENT") {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("Update Certificate Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update certificate." });
    }
};

const setCertificatePublished = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid certificate ID." });
    }
    if (typeof req.body?.published !== "boolean") {
        return res.status(400).json({ success: false, message: "Published must be true or false." });
    }

    try {
        const certificate = await Certificate.findByIdAndUpdate(
            req.params.id,
            { published: req.body.published },
            { new: true, runValidators: true }
        );
        if (!certificate) {
            return res.status(404).json({ success: false, message: "Certificate not found." });
        }

        return res.status(200).json({
            success: true,
            message: req.body.published ? "Certificate published." : "Certificate unpublished.",
            data: serializeCertificate(certificate)
        });
    } catch (error) {
        console.error("Publish Certificate Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update publication status." });
    }
};

const deleteCertificate = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid certificate ID." });
    }

    try {
        const certificate = await Certificate.findByIdAndDelete(req.params.id);
        if (!certificate) {
            return res.status(404).json({ success: false, message: "Certificate not found." });
        }

        let warning;
        try {
            await removeStoredFile(certificate.gridFsId);
        } catch (error) {
            console.error("Delete Certificate File Error:", error.message);
            warning = "Certificate removed, but its stored file could not be deleted.";
        }

        return res.status(200).json({
            success: true,
            message: "Certificate deleted successfully.",
            ...(warning ? { warning } : {})
        });
    } catch (error) {
        console.error("Delete Certificate Error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to delete certificate." });
    }
};

module.exports = {
    createCertificate,
    deleteCertificate,
    getAdminCertificates,
    getCertificateFile,
    getPublishedCertificate,
    getPublishedCertificates,
    setCertificatePublished,
    updateCertificate
};