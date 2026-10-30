
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

        if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error("Admin environment variables are missing.");
        }

        const existingAdmin = await Admin.findOne({
            $or: [
                { username: ADMIN_USERNAME },
                { email: ADMIN_EMAIL }
            ]
        });

        if (existingAdmin) {
            throw new Error("An admin with this username or email already exists.");
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

        await Admin.create({
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            password: hashedPassword
        });

        console.log("Admin account created successfully!");

    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();
