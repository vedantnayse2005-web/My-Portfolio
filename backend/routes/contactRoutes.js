
const express = require("express");
const router = express.Router();

const Contact = require("../models/Contact");
const protectAdmin = require("../middleware/authMiddleware");

// POST: Submit contact form (Public)
router.post("/", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const newContact = await Contact.create({
            name,
            email,
            subject,
            message
        });

        res.status(201).json({
            success: true,
            message: "Your message has been submitted successfully.",
            data: newContact
        });

    } catch (error) {
        console.error("Contact API Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
});

// GET: Fetch all contact messages (Admin Only)
router.get("/", protectAdmin, async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts
        });

    } catch (error) {
        console.error("Fetch Contacts Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch contact messages."
        });
    }
});

// DELETE: Delete contact message (Admin Only)
router.delete("/:id", protectAdmin, async (req, res) => {
    try {
        const deletedContact = await Contact.findByIdAndDelete(
            req.params.id
        );

        if (!deletedContact) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Contact message deleted successfully."
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to delete contact message."
        });
    }
});

// Mark a contact message as read or unread
router.patch("/:id/read", protectAdmin, async (req, res) => {
    try {
        const { isRead } = req.body;

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

        res.status(200).json({
            success: true,
            message: isRead
                ? "Message marked as read."
                : "Message marked as unread.",
            data: contact
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to update message.",
            error: error.message
        });
    }
});

module.exports = router;


