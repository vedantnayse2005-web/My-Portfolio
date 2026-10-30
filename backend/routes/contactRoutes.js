
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

const Contact = require("../models/Contact");
const protectAdmin = require("../middleware/authMiddleware");

// POST: Submit contact form (Public)
router.post("/", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body || {};

        // Validate field types
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof subject !== "string" ||
            typeof message !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields must be valid text."
            });
        }

        // Remove unnecessary whitespace
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanSubject = subject.trim();
        const cleanMessage = message.trim();

        // Check required fields
        if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        // Check maximum lengths
        if (
            cleanName.length > 80 ||
            cleanEmail.length > 254 ||
            cleanSubject.length > 120 ||
            cleanMessage.length > 3000
        ) {
            return res.status(400).json({
                success: false,
                message: "One or more fields exceed the allowed length."
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        const newContact = await Contact.create({
            name: cleanName,
            email: cleanEmail,
            subject: cleanSubject,
            message: cleanMessage
        });

        return res.status(201).json({
            success: true,
            message: "Your message has been submitted successfully.",
            data: newContact
        });

    } catch (error) {
        console.error("Contact API Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
});

// GET: Fetch all contact messages (Admin Only)
router.get("/", protectAdmin, async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts
        });

    } catch (error) {
        console.error("Fetch Contacts Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch contact messages."
        });
    }
});

// DELETE: Delete contact message (Admin Only)
router.delete("/:id", protectAdmin, async (req, res) => {
    try {
        // Validate MongoDB ID
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contact ID."
            });
        }

        const deletedContact = await Contact.findByIdAndDelete(
            req.params.id
        );

        if (!deletedContact) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Contact message deleted successfully."
        });

    } catch (error) {
        console.error("Delete Contact Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete contact message."
        });
    }
});

// PATCH: Mark a contact message as read or unread (Admin Only)
router.patch("/:id/read", protectAdmin, async (req, res) => {
    try {
        // Validate MongoDB ID
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contact ID."
            });
        }

        const { isRead } = req.body || {};

        if (typeof isRead !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isRead must be true or false."
            });
        }

        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { isRead },
            { new: true, runValidators: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Message not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: isRead
                ? "Message marked as read."
                : "Message marked as unread.",
            data: contact
        });

    } catch (error) {
        console.error("Update Contact Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update message."
        });
    }
});

module.exports = router;
