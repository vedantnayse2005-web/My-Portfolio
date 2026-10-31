import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { editingAdminRequest, handleEditingAdminError } from "./editingAdminApi";

const blankProfile = {
    professionalIntroduction: "",
    aboutDescription: "",
    creativeApproach: "",
    editingInterests: "",
    instagramUrl: "",
    linkedinUrl: "",
    contactEmail: ""
};

function EditingProfile() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("adminToken");
    const [form, setForm] = useState(blankProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        let isActive = true;
        Promise.resolve().then(async () => {
            try {
                const result = await editingAdminRequest("/profile/admin", token);
                if (isActive && result.data) {
                    setForm({
                        professionalIntroduction: result.data.professionalIntroduction || "",
                        aboutDescription: result.data.aboutDescription || "",
                        creativeApproach: result.data.creativeApproach || "",
                        editingInterests: (result.data.editingInterests || []).join(", "),
                        instagramUrl: result.data.instagramUrl || "",
                        linkedinUrl: result.data.linkedinUrl || "",
                        contactEmail: result.data.contactEmail || ""
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

    const change = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
        setError("");
        setStatus("");
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setStatus("");
        setSaving(true);
        try {
            const result = await editingAdminRequest("/profile", token, {
                method: "PUT",
                body: JSON.stringify({
                    ...form,
                    editingInterests: form.editingInterests.split(",").map((interest) => interest.trim()).filter(Boolean)
                })
            });
            setStatus(result.message);
        } catch (saveError) {
            if (!handleEditingAdminError(saveError, navigate)) setError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="admin-content editing-admin-section" id="editing-profile-admin">
            <div className="messages-heading"><h2>Manage About Me</h2><span>{loading ? "Loading..." : "Editing profile"}</span></div>
            <form className="editing-admin-form" onSubmit={submit}>
                <label className="editing-admin-wide">
                    Professional introduction
                    <textarea name="professionalIntroduction" rows="2" maxLength={500} value={form.professionalIntroduction} onChange={change} />
                </label>
                <label className="editing-admin-wide">
                    About description
                    <textarea name="aboutDescription" rows="4" maxLength={3000} value={form.aboutDescription} onChange={change} />
                </label>
                <label className="editing-admin-wide">
                    Creative approach
                    <textarea name="creativeApproach" rows="3" maxLength={2000} value={form.creativeApproach} onChange={change} />
                </label>
                <label className="editing-admin-wide">
                    Editing interests (comma-separated)
                    <input name="editingInterests" maxLength={3000} value={form.editingInterests} onChange={change} placeholder="Documentary, music videos, short-form" />
                </label>
                <label>Contact email<input name="contactEmail" type="email" maxLength={254} value={form.contactEmail} onChange={change} /></label>
                <label>Instagram URL<input name="instagramUrl" type="url" maxLength={2048} value={form.instagramUrl} onChange={change} /></label>
                <label className="editing-admin-wide">LinkedIn URL<input name="linkedinUrl" type="url" maxLength={2048} value={form.linkedinUrl} onChange={change} /></label>
                {error && <p className="admin-error editing-admin-wide" role="alert">{error}</p>}
                {status && <p className="editing-admin-success editing-admin-wide" role="status">{status}</p>}
                <div className="editing-admin-actions editing-admin-wide">
                    <button className="refresh-btn" type="submit" disabled={saving || loading}>{saving ? "Saving..." : "Save About Me"}</button>
                </div>
            </form>
        </section>
    );
}

export default EditingProfile;