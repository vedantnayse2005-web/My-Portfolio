import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { editingAdminRequest, handleEditingAdminError } from "./editingAdminApi";

const categories = [
    "Video Editing",
    "Color Grading",
    "Motion Graphics",
    "Sound Design",
    "Storytelling",
    "Social Media Content Editing",
    "Other"
];
const levels = ["Beginner", "Intermediate", "Advanced"];
const blankSkill = { name: "", category: "Video Editing", proficiencyLevel: "", isTool: false, displayOrder: 1, enabled: true };

function EditingSkills() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("adminToken");
    const [skills, setSkills] = useState([]);
    const [form, setForm] = useState(blankSkill);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        let isActive = true;
        Promise.resolve().then(async () => {
            try {
                const result = await editingAdminRequest("/skills/admin", token);
                if (isActive) setSkills(result.data || []);
            } catch (fetchError) {
                if (isActive && !handleEditingAdminError(fetchError, navigate)) setError(fetchError.message);
            } finally {
                if (isActive) setLoading(false);
            }
        });
        return () => { isActive = false; };
    }, [navigate, token]);

    const change = (event) => {
        const { name, value, checked, type } = event.target;
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
        setError("");
        setStatus("");
    };

    const reset = () => {
        setEditingId(null);
        setForm(blankSkill);
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setStatus("");
        setSaving(true);
        try {
            const result = await editingAdminRequest(editingId ? `/skills/${editingId}` : "/skills", token, {
                method: editingId ? "PUT" : "POST",
                body: JSON.stringify({ ...form, displayOrder: Number(form.displayOrder) })
            });
            setSkills((current) => editingId
                ? current.map((skill) => skill._id === editingId ? result.data : skill)
                : [...current, result.data]);
            setStatus(result.message);
            reset();
        } catch (saveError) {
            if (!handleEditingAdminError(saveError, navigate)) setError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    const edit = (skill) => {
        setEditingId(skill._id);
        setForm({
            name: skill.name,
            category: skill.category,
            proficiencyLevel: skill.proficiencyLevel || "",
            isTool: Boolean(skill.isTool),
            displayOrder: skill.displayOrder || 1,
            enabled: Boolean(skill.enabled)
        });
        setError("");
        setStatus("");
        document.getElementById("editing-skills-admin")?.scrollIntoView({ behavior: "smooth" });
    };

    const remove = async (skill) => {
        if (!window.confirm(`Delete “${skill.name}”?`)) return;
        try {
            const result = await editingAdminRequest(`/skills/${skill._id}`, token, { method: "DELETE" });
            setSkills((current) => current.filter((item) => item._id !== skill._id));
            setStatus(result.message);
            if (editingId === skill._id) reset();
        } catch (deleteError) {
            if (!handleEditingAdminError(deleteError, navigate)) setError(deleteError.message);
        }
    };

    const toggleEnabled = async (skill) => {
        try {
            const result = await editingAdminRequest(`/skills/${skill._id}`, token, {
                method: "PUT",
                body: JSON.stringify({ ...skill, enabled: !skill.enabled })
            });
            setSkills((current) => current.map((item) => item._id === skill._id ? result.data : item));
            setStatus(result.message);
        } catch (updateError) {
            if (!handleEditingAdminError(updateError, navigate)) setError(updateError.message);
        }
    };

    return (
        <section className="admin-content editing-admin-section" id="editing-skills-admin">
            <div className="messages-heading"><h2>Manage Editing Skills</h2><span>{skills.length} Total</span></div>
            <form className="editing-admin-form" onSubmit={submit}>
                <label>Skill or software name<input name="name" maxLength={100} value={form.name} onChange={change} required /></label>
                <label>Category<select name="category" value={form.category} onChange={change}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label>Proficiency (optional)<select name="proficiencyLevel" value={form.proficiencyLevel} onChange={change}><option value="">Not set</option>{levels.map((level) => <option key={level}>{level}</option>)}</select></label>
                <label>Display order<input name="displayOrder" type="number" min="1" max="10000" step="1" value={form.displayOrder} onChange={change} required /></label>
                <label className="editing-admin-toggle"><input name="isTool" type="checkbox" checked={form.isTool} onChange={change} /> Software or tool</label>
                <label className="editing-admin-toggle"><input name="enabled" type="checkbox" checked={form.enabled} onChange={change} /> Enabled on public page</label>
                {error && <p className="admin-error editing-admin-wide" role="alert">{error}</p>}
                {status && <p className="editing-admin-success editing-admin-wide" role="status">{status}</p>}
                <div className="editing-admin-actions editing-admin-wide">
                    <button className="refresh-btn" type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Skill" : "Add Skill"}</button>
                    {editingId && <button className="cancel-project-btn" type="button" onClick={reset}>Cancel</button>}
                </div>
            </form>
            <div className="editing-admin-record-list">
                {loading && <p>Loading editing skills...</p>}
                {!loading && skills.length === 0 && <p>No editing skills added yet.</p>}
                {skills.map((skill) => (
                    <article className="editing-admin-record" key={skill._id}>
                        <div className="editing-admin-record-copy">
                            <span>{skill.category} · Order {skill.displayOrder} · {skill.isTool ? "Tool" : "Skill"} · {skill.enabled ? "Enabled" : "Disabled"}</span>
                            <h3>{skill.name}</h3>
                            <p>{skill.proficiencyLevel || "Proficiency not set"}</p>
                        </div>
                        <div className="editing-admin-record-actions">
                            <button className="edit-project-btn" type="button" onClick={() => edit(skill)}>Edit</button>
                            <button className="read-toggle-btn" type="button" onClick={() => toggleEnabled(skill)}>{skill.enabled ? "Disable" : "Enable"}</button>
                            <button className="delete-message-btn" type="button" onClick={() => remove(skill)}>Delete</button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default EditingSkills;