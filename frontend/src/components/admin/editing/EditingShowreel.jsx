import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    editingAdminRequest,
    getVideoEmbedUrl,
    getVideoPlatform,
    handleEditingAdminError,
    isHostedVideoUrl,
    isValidVideoUrl
} from "./editingAdminApi";

const initialForm = { title: "", description: "", videoUrl: "", enabled: false };

function EditingShowreel() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("adminToken");
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [previewError, setPreviewError] = useState(false);
    const [removing, setRemoving] = useState(false);

    useEffect(() => {
        let isActive = true;
        Promise.resolve().then(async () => {
            try {
                const result = await editingAdminRequest("/showreel/admin", token);
                if (isActive && result.data) {
                    setForm({
                        title: result.data.title || "",
                        description: result.data.description || "",
                        videoUrl: result.data.videoUrl || "",
                        enabled: Boolean(result.data.enabled)
                    });
                }
            } catch (fetchError) {
                if (isActive && !handleEditingAdminError(fetchError, navigate)) setError(fetchError.message);
            } finally {
                if (isActive) setLoading(false);
            }
        });
        return () => { isActive = false; };
    }, [navigate, token]);

    const updateField = (event) => {
        const { name, value, checked, type } = event.target;
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
        setError("");
        setStatus("");
        setPreviewError(false);
    };

    const save = async (event) => {
        event.preventDefault();
        setError("");
        setStatus("");
        if (!form.title.trim() || !isValidVideoUrl(form.videoUrl.trim())) {
            setError("Add a title and a valid YouTube, Instagram, Vimeo, or hosted video URL.");
            return;
        }
        setSaving(true);
        try {
            const result = await editingAdminRequest("/showreel", token, {
                method: "PUT",
                body: JSON.stringify({ ...form, title: form.title.trim(), videoUrl: form.videoUrl.trim() })
            });
            setForm({ ...form, ...result.data });
            setStatus(result.message || "Showreel saved.");
        } catch (saveError) {
            if (!handleEditingAdminError(saveError, navigate)) setError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    const embedUrl = getVideoEmbedUrl(form.videoUrl);
    const platform = getVideoPlatform(form.videoUrl);
    const platformLabel = {
        youtube: "YouTube video or Short",
        instagram: "Instagram Reel or video post",
        vimeo: "Vimeo video",
        hosted: "Hosted video"
    }[platform] || "Unsupported URL";

    const removeShowreel = async () => {
        if (!window.confirm("Remove the configured showreel from the public editing portfolio?")) return;
        setRemoving(true);
        setError("");
        setStatus("");
        try {
            const result = await editingAdminRequest("/showreel", token, { method: "DELETE" });
            setForm(initialForm);
            setPreviewError(false);
            setStatus(result.message || "Showreel removed.");
        } catch (removeError) {
            if (!handleEditingAdminError(removeError, navigate)) setError(removeError.message);
        } finally {
            setRemoving(false);
        }
    };

    return (
        <section className="editing-admin editing-admin-section" id="editing-showreel-admin">
            <div className="editing-admin-header">
                <h2>Manage Showreel</h2>
                <span>{loading ? "Loading..." : form.enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <form className="editing-admin-form" onSubmit={save}>
                <label>
                    Showreel title
                    <input name="title" maxLength={160} value={form.title} onChange={updateField} required />
                </label>
                <label>
                    Video URL (YouTube, Shorts, Instagram Reel/post, Vimeo, or hosted video)
                    <input name="videoUrl" type="url" maxLength={2048} value={form.videoUrl} onChange={updateField} required />
                    <small className="editing-admin-platform">Detected: {platformLabel}</small>
                </label>
                <label className="editing-admin-wide">
                    Description
                    <textarea name="description" rows="3" maxLength={1500} value={form.description} onChange={updateField} />
                </label>
                <label className="editing-admin-toggle">
                    <input name="enabled" type="checkbox" checked={form.enabled} onChange={updateField} />
                    Show on public editing portfolio
                </label>
                {error && <p className="editing-admin-error editing-admin-wide" role="alert">{error}</p>}
                {status && <p className="editing-admin-success editing-admin-wide" role="status">{status}</p>}
                <div className="editing-admin-actions editing-admin-wide">
                    <button className="editing-admin-button editing-admin-button-primary" type="submit" disabled={saving || loading}>
                        {saving ? "Saving..." : "Save Showreel"}
                    </button>
                    {(form.title || form.videoUrl) && (
                        <button className="editing-admin-button editing-admin-button-danger" type="button" onClick={removeShowreel} disabled={removing || saving}>
                            {removing ? "Removing..." : "Delete Showreel"}
                        </button>
                    )}
                </div>
            </form>
            {form.videoUrl && (
                <div className="editing-admin-preview">
                    <h3>Video preview</h3>
                    {isHostedVideoUrl(form.videoUrl) ? (
                        <div className="editing-admin-preview-frame">
                            <video controls playsInline preload="metadata" onError={() => setPreviewError(true)}><source src={form.videoUrl} /></video>
                        </div>
                    ) : embedUrl ? (
                        <div className={`editing-admin-preview-frame ${platform === "instagram" ? "editing-admin-preview-instagram" : ""}`}>
                            <iframe
                                src={embedUrl}
                                title="Showreel preview"
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                allowFullScreen
                                onError={() => setPreviewError(true)}
                            />
                        </div>
                    ) : (
                        <a href={form.videoUrl} target="_blank" rel="noreferrer">Open video URL ↗</a>
                    )}
                    {previewError && <p className="editing-admin-embed-fallback" role="status">Preview unavailable. The video may be private, deleted, or block embedding.</p>}
                    {platform === "instagram" && (
                        <p className="editing-admin-embed-fallback">
                            If the Instagram embed is unavailable, <a href={form.videoUrl} target="_blank" rel="noreferrer">watch on Instagram ↗</a>.
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}

export default EditingShowreel;