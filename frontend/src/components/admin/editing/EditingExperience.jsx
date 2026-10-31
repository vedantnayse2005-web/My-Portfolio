import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { editingAdminRequest, handleEditingAdminError } from "./editingAdminApi";

const employmentTypes = ["Freelance", "Internship", "Full-time", "Part-time", "Contract", "Other"];
const blankExperience = { role: "", organization: "", employmentType: "Freelance", startDate: "", endDate: "", currentlyWorking: false, description: "", displayOrder: 1, published: false };

function EditingExperience() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("adminToken");
    const [entries, setEntries] = useState([]);
    const [form, setForm] = useState(blankExperience);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        let isActive = true;
        Promise.resolve().then(async () => {
            try {
                const result = await editingAdminRequest("/experience/admin", token);
                if (isActive) setEntries(result.data || []);
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

    const reset = () => { setEditingId(null); setForm(blankExperience); };

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setStatus("");
        setSaving(true);
        try {
            const result = await editingAdminRequest(editingId ? `/experience/${editingId}` : "/experience", token, {
                method: editingId ? "PUT" : "POST",
                body: JSON.stringify({
                    ...form,
                    displayOrder: Number(form.displayOrder),
                    endDate: form.currentlyWorking ? "" : form.endDate
                })
            });
            setEntries((current) => editingId
                ? current.map((entry) => entry._id === editingId ? result.data : entry)
                : [...current, result.data]);
            setStatus(result.message);
            reset();
        } catch (saveError) {
            if (!handleEditingAdminError(saveError, navigate)) setError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    const edit = (entry) => {
        setEditingId(entry._id);
        setForm({
            role: entry.role,
            organization: entry.organization,
            employmentType: entry.employmentType,
            startDate: new Date(entry.startDate).toISOString().slice(0, 10),
            endDate: entry.endDate ? new Date(entry.endDate).toISOString().slice(0, 10) : "",
            currentlyWorking: Boolean(entry.currentlyWorking),
            description: entry.description,
            displayOrder: entry.displayOrder || 1,
            published: Boolean(entry.published)
        });
        document.getElementById("editing-experience-admin")?.scrollIntoView({ behavior: "smooth" });
    };

    const togglePublished = async (entry) => {
        try {
            const result = await editingAdminRequest(`/experience/${entry._id}/publish`, token, {
                method: "PATCH",
                body: JSON.stringify({ published: !entry.published })
            });
            setEntries((current) => current.map((item) => item._id === entry._id ? result.data : item));
            setStatus(result.message);
        } catch (updateError) {
            if (!handleEditingAdminError(updateError, navigate)) setError(updateError.message);
        }
    };

    const remove = async (entry) => {
        if (!window.confirm(`Delete experience entry “${entry.role}”?`)) return;
        try {
            const result = await editingAdminRequest(`/experience/${entry._id}`, token, { method: "DELETE" });
            setEntries((current) => current.filter((item) => item._id !== entry._id));
            setStatus(result.message);
            if (editingId === entry._id) reset();
        } catch (deleteError) {
            if (!handleEditingAdminError(deleteError, navigate)) setError(deleteError.message);
        }
    };

    return (
        <section className="editing-admin editing-admin-section" id="editing-experience-admin">
            <div className="editing-admin-header"><h2>Manage Editing Experience</h2><span>{entries.length} Total</span></div>
            <form className="editing-admin-form" onSubmit={submit}>
                <label>Role<input name="role" maxLength={140} value={form.role} onChange={change} required /></label>
                <label>Organization or client<input name="organization" maxLength={160} value={form.organization} onChange={change} required /></label>
                <label>Employment type<select name="employmentType" value={form.employmentType} onChange={change}>{employmentTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
                <label>Start date<input name="startDate" type="date" value={form.startDate} onChange={change} required /></label>
                <label>End date<input name="endDate" type="date" value={form.endDate} onChange={change} disabled={form.currentlyWorking} required={!form.currentlyWorking} /></label>
                <label>Display order<input name="displayOrder" type="number" min="1" max="10000" step="1" value={form.displayOrder} onChange={change} required /></label>
                <label className="editing-admin-toggle"><input name="currentlyWorking" type="checkbox" checked={form.currentlyWorking} onChange={change} /> Currently working</label>
                <label className="editing-admin-toggle"><input name="published" type="checkbox" checked={form.published} onChange={change} /> Publish entry</label>
                <label className="editing-admin-wide">Description<textarea name="description" rows="4" maxLength={3000} value={form.description} onChange={change} required /></label>
                {error && <p className="editing-admin-error editing-admin-wide" role="alert">{error}</p>}
                {status && <p className="editing-admin-success editing-admin-wide" role="status">{status}</p>}
                <div className="editing-admin-actions editing-admin-wide">
                    <button className="editing-admin-button editing-admin-button-primary" type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Experience" : "Add Experience"}</button>
                    {editingId && <button className="editing-admin-button" type="button" onClick={reset}>Cancel</button>}
                </div>
            </form>
            <div className="editing-admin-record-list">
                {loading && <p>Loading editing experience...</p>}
                {!loading && entries.length === 0 && <p>No editing experience entries added yet.</p>}
                {entries.map((entry) => (
                    <article className="editing-admin-record" key={entry._id}>
                        <div className="editing-admin-record-copy">
                            <span>{entry.employmentType} · {entry.published ? "Published" : "Draft"}</span>
                            <h3>{entry.role}</h3>
                            <p>{entry.organization} · {new Date(entry.startDate).toLocaleDateString()} – {entry.currentlyWorking ? "Present" : entry.endDate ? new Date(entry.endDate).toLocaleDateString() : "Not set"}</p>
                            <p>{entry.description}</p>
                        </div>
                        <div className="editing-admin-record-actions">
                            <button className="editing-admin-button" type="button" onClick={() => edit(entry)}>Edit</button>
                            <button className="editing-admin-button editing-admin-button-toggle" type="button" onClick={() => togglePublished(entry)}>{entry.published ? "Unpublish" : "Publish"}</button>
                            <button className="editing-admin-button editing-admin-button-danger" type="button" onClick={() => remove(entry)}>Delete</button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default EditingExperience;