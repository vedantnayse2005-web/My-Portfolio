require("dotenv").config();

const mongoose = require("mongoose");
const Skill = require("../models/Skill");

const existingSkills = [
    { category: "Programming Languages", names: ["C++", "JavaScript", "Java", "SQL"] },
    { category: "Frontend Development", names: ["HTML", "CSS", "React", "Bootstrap"] },
    { category: "Backend Development", names: ["Node.js", "Express.js", "REST APIs", "CRUD Operations"] },
    { category: "Databases", names: ["MongoDB", "MySQL", "Mongoose"] },
    { category: "Developer Tools", names: ["Git", "GitHub", "VS Code"] }
];

const seedSkills = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const operations = existingSkills.flatMap((group) =>
            group.names.map((name, index) => ({
                updateOne: {
                    filter: { name, category: group.category },
                    update: {
                        $setOnInsert: {
                            name,
                            category: group.category,
                            displayOrder: (index + 1) * 10,
                            isActive: true
                        }
                    },
                    upsert: true
                }
            }))
        );

        const result = await Skill.bulkWrite(operations);
        console.log(`Skills seeded. Added ${result.upsertedCount} existing portfolio skills.`);
    } catch (error) {
        console.error("Skill seeding failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedSkills();