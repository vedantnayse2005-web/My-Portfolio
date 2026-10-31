import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../../config/api";
import {
    editingAdminRequest,
    getVideoEmbedUrl,
    handleEditingAdminError,
    isHostedVideoUrl,
    isValidVideoUrl
} from "./editingAdminApi";

const categories = [
    "Instagram Reels",
    "YouTube Videos",
    "Cinematic Editing",
    "Promotional Videos",
    "Motion Graphics",
    "Documentary",
    "Other"
];
const emptyForm = {
    title: "",
    category: "Other",
    description: "",
    videoUrl: "",
    software: "",
    completionDate: "",
    featured: false,
    displayOrder: 1,
    published: false
};

function EditingProjects() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("adminToken");
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        let isActive = true;
        Promise.resolve().then(async () => {
            try {
                const result = await editingAdminRequest("/projects/admin", token);
                if (isActive) setProjects(result.data || []);
            } catch (fetchError) {
                if (isActive && !handleEditingAdminError(fetchError, navigate)) setError(fetchError.message);
            } finally {
                if (isActive) setLoading(false);
            }
        });
        return () => { isActive = false; };
    }, [navigate, token]);

    useEffect(() => () => {
        if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const updateField = (event) => {
        const { name, value, checked, type } = event.target;
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
        setError("");
        setStatus("");
    };

    const handleThumbnail = (event) => {
        const file = event.target.files?.[0] || null;
        const types = new Map([
            ["image/jpeg", [".jpg", ".jpeg"]],
            ["image/png", [".png"]],
            ["image/webp", [".webp"]]
        ]);
        const extension = file?.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        setError("");
        setStatus("");
        if (file && !types.get(file.type)?.includes(extension)) {
            setThumbnailFile(null);
            setPreviewUrl("");
            event.target.value = "";
            setError("Choose a JPG, JPEG, PNG, or WebP thumbnail.");
            return;
        }
        if (file && file.size > 5 * 1024 * 1024) {
            setThumbnailFile(null);
            setPreviewUrl("");
            event.target.value = "";
            setError("Thumbnail must be 5 MB or smaller.");
            return;
        }
        setThumbnailFile(file);
        setPreviewUrl(file ? URL.createObjectURL(file) : "");
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setThumbnailFile(null);
        setPreviewUrl("");
        const input = document.getElementById("editing-project-thumbnail");
        if (input) input.value = "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setStatus("");
        if (!form.title.trim() || !form.description.trim() || !isValidVideoUrl(form.videoUrl.trim())) {
            setError("Enter a title, description, and valid YouTube, Vimeo, or hosted video URL.");
            return;
        }
        const formData = new FormData();
        Object.entries({ ...form, displayOrder: Number(form.displayOrder), software: form.software })
            .forEach(([key, value]) => formData.append(key, value));
        if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

        setSaving(true);
        try {
            const result = await editingAdminRequest(
                editingId ? `/projects/${editingId}` : "/projects",
                token,
                { method: editingId ? "PUT" : "POST", body: formData }
            );
            setProjects((current) => editingId
                ? current.map((project) => project._id === editingId ? result.data : project)
                : [result.data, ...current]);
            setStatus(result.warning || result.message);
            resetForm();
        } catch (saveError) {
            if (!handleEditingAdminError(saveError, navigate)) setError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async (project) => {
        setEditingId(project._id);
        setThumbnailFile(null);
        setForm({
            title: project.title,
            category: project.category,
            description: project.description,
            videoUrl: project.videoUrl,
            software: (project.software || []).join(", "),
            completionDate: project.completionDate ? new Date(project.completionDate).toISOString().slice(0, 10) : "",
            featured: Boolean(project.featured),
            displayOrder: project.displayOrder || 1,
            published: Boolean(project.published)
        });
        setPreviewUrl("");
        setError("");
        setStatus("");
        if (project.thumbnailUrl) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/editing/projects/${project._id}/thumbnail/admin`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 401) {
                    sessionStorage.removeItem("adminToken");
                    navigate("/admin/login");
                    return;
                }
                if (response.ok) setPreviewUrl(URL.createObjectURL(await response.blob()));
            } catch {
                setError("Unable to load the current thumbnail preview.");
            }
        }
        document.getElementById("editing-projects-admin")?.scrollIntoView({ behavior: "smooth" });
    };

    const handlePublish = async (project) => {
        setError("");
        setStatus("");
        try {
            const result = await editingAdminRequest(`/projects/${project._id}/publish`, token, {
                method: "PATCH",
                body: JSON.stringify({ published: !project.published })
            });
            setProjects((current) => current.map((item) => item._id === project._id ? result.data : item));
            setStatus(result.message);
        } catch (publishError) {
            if (!handleEditingAdminError(publishError, navigate)) setError(publishError.message);
        }
    };

    const handleDelete = async (project) => {
        if (!window.confirm(`Delete “${project.title}”? This also removes its stored thumbnail.`)) return;
        setDeletingId(project._id);
        setError("");
        setStatus("");
        try {
            const result = await editingAdminRequest(`/projects/${project._id}`, token, { method: "DELETE" });
            setProjects((current) => current.filter((item) => item._id !== project._id));
            setStatus(result.warning || result.message);
            if (editingId === project._id) resetForm();
        } catch (deleteError) {
            if (!handleEditingAdminError(deleteError, navigate)) setError(deleteError.message);
        } finally {
            setDeletingId(null);
        }
    };

    const embedUrl = getVideoEmbedUrl(form.videoUrl);

    return (
        <section className="admin-content editing-admin-section" id="editing-projects-admin">
            <div className="messages-heading">
                <h2>{editingId ? "Edit Editing Project" : "Manage Editing Projects"}</h2>
                <span>{projects.length} Total</span>
            </div>
            <form className="editing-admin-form" onSubmit={handleSubmit}>
                <label>
                    Project title
                    <input name="title" maxLength={140} value={form.title} onChange={updateField} required />
                </label>
                <label>
                    Category
                    <select name="category" value={form.category} onChange={updateField}>
                        {categories.map((category) => <option key={category}>{category}</option>)}
                    </select>
                </label>
                <label className="editing-admin-wide">
                    Description
                    <textarea name="description" rows="3" maxLength={3000} value={form.description} onChange={updateField} required />
                </label>
                <label className="editing-admin-wide">
                    Video URL
                    <input name="videoUrl" type="url" maxLength={2048} value={form.videoUrl} onChange={updateField} required />
                </label>
                <label>
                    Editing software (comma-separated)
                    <input name="software" maxLength={1000} value={form.software} onChange={updateField} placeholder="Premiere Pro, After Effects" />
                </label>
                <label>
                    Completion date
                    <input name="completionDate" type="date" value={form.completionDate} onChange={updateField} />
                </label>
                <label>
                    Display order
                    <input name="displayOrder" type="number" min="1" max="10000" step="1" value={form.displayOrder} onChange={updateField} required />
                </label>
                <label>
                    Thumbnail (JPG, PNG, WebP; max 5 MB)
                    <input id="editing-project-thumbnail" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleThumbnail} />
                    {editingId && !thumbnailFile && <small>Leave empty to keep the current thumbnail.</small>}
                </label>
                <label className="editing-admin-toggle">
                    <input name="featured" type="checkbox" checked={form.featured} onChange={updateField} /> Featured project
                </label>
                <label className="editing-admin-toggle">
                    <input name="published" type="checkbox" checked={form.published} onChange={updateField} /> Publish project
                </label>
                {thumbnailFile && <p className="editing-admin-wide">Selected: {thumbnailFile.name}</p>}
                {previewUrl && <div className="editing-admin-image-preview editing-admin-wide"><img src={previewUrl} alt="Editing project thumbnail preview" /></div>}
                {error && <p className="admin-error editing-admin-wide" role="alert">{error}</p>}
                {status && <p className="editing-admin-success editing-admin-wide" role="status">{status}</p>}
                <div className="editing-admin-actions editing-admin-wide">
                    <button className="refresh-btn" type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Project" : "Add Project"}</button>
                    {editingId && <button className="cancel-project-btn" type="button" onClick={resetForm}>Cancel</button>}
                </div>
            </form>

            {form.videoUrl && (
                <div className="editing-admin-preview">
                    <h3>Video preview</h3>
                    {isHostedVideoUrl(form.videoUrl) ? (
                        <video controls playsInline preload="metadata"><source src={form.videoUrl} /></video>
                    ) : embedUrl ? (
                        <iframe src={embedUrl} title="Editing project video preview" allowFullScreen />
                    ) : <a href={form.videoUrl} target="_blank" rel="noreferrer">Open video URL ↗</a>}
                </div>
            )}

            <div className="editing-admin-record-list">
                {loading && <p>Loading editing projects...</p>}
                {!loading && projects.length === 0 && <p>No editing projects added yet.</p>}
                {projects.map((project) => (
                    <article className="editing-admin-record" key={project._id}>
                        {project.published && project.thumbnailUrl && <img src={`${API_BASE_URL}${project.thumbnailUrl}`} alt="" />}
                        <div className="editing-admin-record-copy">
                            <span>{project.category} · Order {project.displayOrder} · {project.published ? "Published" : "Draft"}</span>
                            <h3>{project.title}</h3>
                            <p>{project.description}</p>
                        </div>
                        <div className="editing-admin-record-actions">
                            <button className="edit-project-btn" type="button" onClick={() => handleEdit(project)}>Edit</button>
                            <button className="read-toggle-btn" type="button" onClick={() => handlePublish(project)}>{project.published ? "Unpublish" : "Publish"}</button>
                            <button className="delete-message-btn" type="button" disabled={deletingId === project._id} onClick={() => handleDelete(project)}>{deletingId === project._id ? "Deleting..." : "Delete"}</button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default EditingProjects;