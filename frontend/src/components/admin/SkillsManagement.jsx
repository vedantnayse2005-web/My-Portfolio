import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config/api";
import SkillIcon from "../SkillIcon";
import "./SkillsManagement.css";

const categories = [
    "Frontend Development",
    "Backend Development",
    "Databases",
    "Programming Languages",
    "Developer Tools"
];
const proficiencyLevels = ["Beginner", "Intermediate", "Advanced"];
const emptySkill = {
    name: "",
    category: categories[0],
    proficiencyLevel: "",
    icon: "",
    displayOrder: 1,
    isActive: true
};

function SkillsManagement() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("adminToken");
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All categories");
    const [statusFilter, setStatusFilter] = useState("all");
    const [form, setForm] = useState(emptySkill);

    useEffect(() => {
        let isActive = true;
        const fetchSkills = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/skills/admin`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const result = await response.json();
                if (!isActive) return;
                if (response.status === 401) {
                    sessionStorage.removeItem("adminToken");
                    navigate("/admin/login");
                    return;
                }
                if (!response.ok) throw new Error(result.message || "Unable to fetch skills.");
                setSkills(result.data || []);
            } catch (fetchError) {
                if (isActive) setError(fetchError.message);
            } finally {
                if (isActive) setLoading(false);
            }
        };

        Promise.resolve().then(() => {
            if (isActive) fetchSkills();
        });
        return () => {
            isActive = false;
        };
    }, [navigate, token]);

    const resetForm = () => {
        setEditingId(null);
        setForm(emptySkill);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setStatus("");
        setSaving(true);
        try {
            const payload = {
                ...form,
                displayOrder: Number(form.displayOrder),
                ...(form.proficiencyLevel ? {} : { proficiencyLevel: "" })
            };
            const response = await fetch(
                editingId
                    ? `${API_BASE_URL}/api/skills/${editingId}`
                    : `${API_BASE_URL}/api/skills`,
                {
                    method: editingId ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                }
            );
            const result = await response.json();
            if (response.status === 401) {
                sessionStorage.removeItem("adminToken");
                navigate("/admin/login");
                return;
            }
            if (!response.ok) throw new Error(result.message || "Unable to save skill.");
            setSkills((current) => editingId
                ? current.map((skill) => skill._id === editingId ? result.data : skill)
                : [...current, result.data]);
            setStatus(result.message);
            resetForm();
        } catch (saveError) {
            setError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (skill) => {
        setEditingId(skill._id);
        setForm({
            name: skill.name,
            category: skill.category,
            proficiencyLevel: skill.proficiencyLevel || "",
            icon: skill.icon || "",
            displayOrder: skill.displayOrder ?? 0,
            isActive: skill.isActive
        });
        setError("");
        setStatus("");
        document.getElementById("skills-management")?.scrollIntoView({ behavior: "smooth" });
    };

    const updateSkill = async (skill, changes) => {
        setError("");
        setStatus("");
        try {
            const response = await fetch(`${API_BASE_URL}/api/skills/${skill._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...skill, ...changes })
            });
            const result = await response.json();
            if (response.status === 401) {
                sessionStorage.removeItem("adminToken");
                navigate("/admin/login");
                return;
            }
            if (!response.ok) throw new Error(result.message || "Unable to update skill.");
            setSkills((current) => current.map((item) => item._id === skill._id ? result.data : item));
            setStatus(result.message);
        } catch (updateError) {
            setError(updateError.message);
        }
    };

    const handleDelete = async (skill) => {
        if (!window.confirm(`Delete ${skill.name}?`)) return;
        setError("");
        setStatus("");
        try {
            const response = await fetch(`${API_BASE_URL}/api/skills/${skill._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.status === 401) {
                sessionStorage.removeItem("adminToken");
                navigate("/admin/login");
                return;
            }
            if (!response.ok) throw new Error(result.message || "Unable to delete skill.");
            setSkills((current) => current.filter((item) => item._id !== skill._id));
            setStatus(result.message);
            if (editingId === skill._id) resetForm();
        } catch (deleteError) {
            setError(deleteError.message);
        }
    };

    const visibleSkills = skills
        .filter((skill) => skill.name.toLowerCase().includes(search.trim().toLowerCase()))
        .filter((skill) => categoryFilter === "All categories" || skill.category === categoryFilter)
        .filter((skill) => statusFilter === "all" || (statusFilter === "active" ? skill.isActive : !skill.isActive))
        .sort((first, second) => Number(first.displayOrder) - Number(second.displayOrder)
            || first.category.localeCompare(second.category)
            || first.name.localeCompare(second.name)
            || first._id.localeCompare(second._id));

    return (
        <section className="admin-content skills-admin-section" id="skills-management">
            <div className="messages-heading">
                <h2>Skills Management</h2>
                <span>{skills.length} Total</span>
            </div>

            <form className="skills-admin-form" onSubmit={handleSubmit}>
                <label>
                    Skill name
                    <input
                        value={form.name}
                        maxLength={80}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        required
                    />
                </label>
                <label>
                    Category
                    <select
                        value={form.category}
                        onChange={(event) => setForm({ ...form, category: event.target.value })}
                    >
                        {categories.map((category) => <option key={category}>{category}</option>)}
                    </select>
                </label>
                <label>
                    Proficiency level (optional)
                    <select
                        value={form.proficiencyLevel}
                        onChange={(event) => setForm({ ...form, proficiencyLevel: event.target.value })}
                    >
                        <option value="">Not set</option>
                        {proficiencyLevels.map((level) => <option key={level}>{level}</option>)}
                    </select>
                </label>
                <label>
                    Direct icon image URL (optional)
                    <input
                        type="url"
                        value={form.icon}
                        maxLength={2048}
                        onChange={(event) => setForm({ ...form, icon: event.target.value })}
                    />
                    <small>Use a direct image URL (including SVG, PNG, JPG, or WebP), not an icon gallery page.</small>
                </label>
                <label>
                    Display order
                    <input
                        type="number"
                        min="1"
                        max="10000"
                        step="1"
                        value={form.displayOrder}
                        onChange={(event) => setForm({ ...form, displayOrder: event.target.value })}
                        required
                    />
                </label>
                <label className="skill-active-field">
                    <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                    />
                    Active on portfolio
                </label>
                {error && <p className="admin-error" role="alert">{error}</p>}
                {status && <p className="skills-admin-status" role="status">{status}</p>}
                <div className="skills-admin-actions">
                    <button className="refresh-btn" type="submit" disabled={saving}>
                        {saving ? "Saving..." : editingId ? "Save Skill" : "Add Skill"}
                    </button>
                    {editingId && (
                        <button className="cancel-project-btn" type="button" onClick={resetForm}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="skills-admin-filters">
                <label>
                    Search skills
                    <input value={search} onChange={(event) => setSearch(event.target.value)} />
                </label>
                <label>
                    Category
                    <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                        <option>All categories</option>
                        {categories.map((category) => <option key={category}>{category}</option>)}
                    </select>
                </label>
                <label>
                    Status
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        <option value="all">All skills</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </label>
            </div>

            {loading && <p>Loading skills...</p>}
            {!loading && !error && visibleSkills.length === 0 && <p>No matching skills.</p>}
            <div className="skills-admin-list">
                {visibleSkills.map((skill) => (
                    <article className="skills-admin-item" key={skill._id}>
                        <div className="skills-admin-item-details">
                            <SkillIcon
                                key={`${skill._id}-${skill.icon || ""}`}
                                icon={skill.icon}
                                name={skill.name}
                                className="skills-admin-icon"
                            />
                            <div>
                                <h3>{skill.name}</h3>
                                <p>{skill.category} · Order {skill.displayOrder}</p>
                                <p>{skill.proficiencyLevel || "Proficiency not set"}</p>
                            </div>
                        </div>
                        <div className="skills-admin-item-actions">
                            <span className={skill.isActive ? "active" : "inactive"}>
                                {skill.isActive ? "Active" : "Inactive"}
                            </span>
                            <button className="edit-project-btn" type="button" onClick={() => handleEdit(skill)}>
                                Edit
                            </button>
                            <button
                                className="read-toggle-btn"
                                type="button"
                                onClick={() => updateSkill(skill, { isActive: !skill.isActive })}
                            >
                                {skill.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button className="delete-message-btn" type="button" onClick={() => handleDelete(skill)}>
                                Delete
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default SkillsManagement;