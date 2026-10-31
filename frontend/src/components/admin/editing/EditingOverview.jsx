import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { editingAdminRequest, handleEditingAdminError } from "./editingAdminApi";

const emptyStats = {
    totalProjects: 0,
    publishedProjects: 0,
    draftProjects: 0,
    showreelEnabled: false,
    showreelTitle: "",
    totalSkills: 0,
    experienceEntries: 0
};

function EditingOverview() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("adminToken");
    const [stats, setStats] = useState(emptyStats);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isActive = true;
        Promise.resolve().then(async () => {
            try {
                const result = await editingAdminRequest("/overview", token);
                if (isActive) setStats({ ...emptyStats, ...result.data });
            } catch (fetchError) {
                if (isActive && !handleEditingAdminError(fetchError, navigate)) setError(fetchError.message);
            } finally {
                if (isActive) setLoading(false);
            }
        });
        return () => { isActive = false; };
    }, [navigate, token]);

    const cards = [
        ["Total editing projects", stats.totalProjects],
        ["Published projects", stats.publishedProjects],
        ["Draft projects", stats.draftProjects],
        ["Editing skills", stats.totalSkills],
        ["Experience entries", stats.experienceEntries],
        ["Showreel", stats.showreelEnabled ? "Enabled" : "Disabled"]
    ];

    return (
        <section className="admin-content editing-admin-section" id="editing-overview">
            <div className="messages-heading">
                <div>
                    <span className="admin-label">EDITING PORTFOLIO</span>
                    <h2>Editing Overview</h2>
                </div>
                <span>{loading ? "Loading..." : `${stats.totalProjects} Projects`}</span>
            </div>
            {error && <p className="admin-error" role="alert">{error}</p>}
            {!loading && !error && (
                <div className="editing-overview-grid">
                    {cards.map(([label, value]) => (
                        <article className="editing-overview-stat" key={label}>
                            <span>{label}</span>
                            <strong>{value}</strong>
                            {label === "Showreel" && stats.showreelTitle && <small>{stats.showreelTitle}</small>}
                        </article>
                    ))}
                </div>
            )}
            <div className="editing-quick-actions">
                <a className="refresh-btn" href="#editing-projects-admin">Add New Project</a>
                <a className="refresh-btn" href="#editing-showreel-admin">Update Showreel</a>
                <a className="refresh-btn" href="#editing-skills-admin">Add Editing Skill</a>
                <a className="refresh-btn" href="#editing-profile-admin">Edit About Me</a>
            </div>
        </section>
    );
}

export default EditingOverview;