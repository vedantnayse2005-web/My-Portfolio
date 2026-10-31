import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config/api";
import "./CertificateManagement.css";

const certificateCategories = ["Frontend", "Backend", "Database", "Cloud", "Other"];
const emptyCertificate = {
    title: "",
    issuer: "",
    issueDate: "",
    credentialId: "",
    category: "Other",
    description: "",
    published: false
};

function CertificateManagement() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("adminToken");
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [certificateFile, setCertificateFile] = useState(null);
    const [form, setForm] = useState(emptyCertificate);

    useEffect(() => {
        let isActive = true;
        const fetchCertificates = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/certificates/admin`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const result = await response.json();
                if (!isActive) return;
                if (response.status === 401) {
                    sessionStorage.removeItem("adminToken");
                    navigate("/admin/login");
                    return;
                }
                if (!response.ok) throw new Error(result.message || "Unable to fetch certificates.");
                setCertificates(result.data || []);
            } catch (fetchError) {
                if (isActive) setError(fetchError.message);
            } finally {
                if (isActive) setLoading(false);
            }
        };

        Promise.resolve().then(() => {
            if (isActive) fetchCertificates();
        });
        return () => {
            isActive = false;
        };
    }, [navigate, token]);

    const resetForm = () => {
        setForm(emptyCertificate);
        setCertificateFile(null);
        setEditingId(null);
        const input = document.getElementById("certificate-file");
        if (input) input.value = "";
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] || null;
        const allowedTypes = new Map([
            ["application/pdf", [".pdf"]],
            ["image/jpeg", [".jpg", ".jpeg"]],
            ["image/png", [".png"]]
        ]);
        const extension = file?.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        setError("");
        setStatus("");
        if (file && !allowedTypes.get(file.type)?.includes(extension)) {
            setCertificateFile(null);
            setError("Choose a PDF, JPG, JPEG, or PNG certificate.");
            event.target.value = "";
            return;
        }
        if (file && file.size > 5 * 1024 * 1024) {
            setCertificateFile(null);
            setError("Certificate files must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }
        setCertificateFile(file);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setStatus("");
        if (!editingId && !certificateFile) {
            setError("Select a certificate file to upload.");
            return;
        }

        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => formData.append(key, value));
        if (certificateFile) formData.append("file", certificateFile);

        setSaving(true);
        try {
            const response = await fetch(
                editingId
                    ? `${API_BASE_URL}/api/certificates/${editingId}`
                    : `${API_BASE_URL}/api/certificates`,
                {
                    method: editingId ? "PUT" : "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                }
            );
            const result = await response.json();
            if (response.status === 401) {
                sessionStorage.removeItem("adminToken");
                navigate("/admin/login");
                return;
            }
            if (!response.ok) throw new Error(result.message || "Unable to save certificate.");

            const saved = result.data;
            setCertificates((current) => editingId
                ? current.map((item) => item._id === editingId ? saved : item)
                : [saved, ...current]);
            setStatus(result.warning || result.message);
            resetForm();
        } catch (saveError) {
            setError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (certificate) => {
        setEditingId(certificate._id);
        setCertificateFile(null);
        setForm({
            title: certificate.title,
            issuer: certificate.issuer,
            issueDate: new Date(certificate.issueDate).toISOString().slice(0, 10),
            credentialId: certificate.credentialId || "",
            category: certificate.category || "Other",
            description: certificate.description || "",
            published: Boolean(certificate.published)
        });
        setError("");
        setStatus("");
        document.getElementById("certificates")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleDelete = async (certificate) => {
        if (!window.confirm(`Delete “${certificate.title}”?`)) return;
        setError("");
        setStatus("");
        try {
            const response = await fetch(`${API_BASE_URL}/api/certificates/${certificate._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.status === 401) {
                sessionStorage.removeItem("adminToken");
                navigate("/admin/login");
                return;
            }
            if (!response.ok) throw new Error(result.message || "Unable to delete certificate.");
            setCertificates((current) => current.filter((item) => item._id !== certificate._id));
            setStatus(result.warning || result.message);
            if (editingId === certificate._id) resetForm();
        } catch (deleteError) {
            setError(deleteError.message);
        }
    };

    const handlePublish = async (certificate) => {
        setError("");
        setStatus("");
        try {
            const response = await fetch(`${API_BASE_URL}/api/certificates/${certificate._id}/publish`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ published: !certificate.published })
            });
            const result = await response.json();
            if (response.status === 401) {
                sessionStorage.removeItem("adminToken");
                navigate("/admin/login");
                return;
            }
            if (!response.ok) throw new Error(result.message || "Unable to change publication status.");
            setCertificates((current) => current.map((item) =>
                item._id === certificate._id ? result.data : item
            ));
            setStatus(result.message);
        } catch (publishError) {
            setError(publishError.message);
        }
    };

    return (
        <section className="admin-content certificate-admin-section" id="certificates">
            <div className="messages-heading">
                <h2>Certificates</h2>
                <span>{certificates.length} Total</span>
            </div>

            <form className="certificate-admin-form" onSubmit={handleSubmit}>
                <label>
                    Certificate name
                    <input
                        value={form.title}
                        maxLength={160}
                        onChange={(event) => setForm({ ...form, title: event.target.value })}
                        required
                    />
                </label>
                <label>
                    Issuing organization
                    <input
                        value={form.issuer}
                        maxLength={160}
                        onChange={(event) => setForm({ ...form, issuer: event.target.value })}
                        required
                    />
                </label>
                <label>
                    Issue date
                    <input
                        type="date"
                        value={form.issueDate}
                        onChange={(event) => setForm({ ...form, issueDate: event.target.value })}
                        required
                    />
                </label>
                <label>
                    Category
                    <select
                        value={form.category}
                        onChange={(event) => setForm({ ...form, category: event.target.value })}
                    >
                        {certificateCategories.map((item) => <option key={item}>{item}</option>)}
                    </select>
                </label>
                <label>
                    Credential ID (optional)
                    <input
                        value={form.credentialId}
                        maxLength={160}
                        onChange={(event) => setForm({ ...form, credentialId: event.target.value })}
                    />
                </label>
                <label>
                    Certificate file (PDF, JPG, or PNG; max 5 MB)
                    <input
                        id="certificate-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={handleFileChange}
                        required={!editingId}
                    />
                    {editingId && <small>Leave empty to keep the current file.</small>}
                    {certificateFile && <small>Selected: {certificateFile.name}</small>}
                </label>
                <label className="certificate-description-field">
                    Description (optional)
                    <textarea
                        value={form.description}
                        rows="3"
                        maxLength={1000}
                        onChange={(event) => setForm({ ...form, description: event.target.value })}
                    />
                </label>
                <label className="certificate-publish-field">
                    <input
                        type="checkbox"
                        checked={form.published}
                        onChange={(event) => setForm({ ...form, published: event.target.checked })}
                    />
                    Publish immediately
                </label>
                {error && <p className="admin-error" role="alert">{error}</p>}
                {status && <p className="certificate-admin-status" role="status">{status}</p>}
                <div className="certificate-admin-actions">
                    <button className="refresh-btn" type="submit" disabled={saving}>
                        {saving ? "Saving..." : editingId ? "Save Certificate" : "Add Certificate"}
                    </button>
                    {editingId && (
                        <button className="cancel-project-btn" type="button" onClick={resetForm}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {loading && <p>Loading certificates...</p>}
            {!loading && !error && certificates.length === 0 && <p>No certificates added yet.</p>}
            <div className="certificate-admin-list">
                {certificates.map((certificate) => (
                    <article className="certificate-admin-item" key={certificate._id}>
                        <div>
                            <h3>{certificate.title}</h3>
                            <p>{certificate.issuer} · {new Date(certificate.issueDate).toLocaleDateString()}</p>
                            <p>{certificate.fileName} · {certificate.category}</p>
                        </div>
                        <div className="certificate-admin-item-actions">
                            <span className={certificate.published ? "published" : "unpublished"}>
                                {certificate.published ? "Published" : "Draft"}
                            </span>
                            <button className="edit-project-btn" type="button" onClick={() => handleEdit(certificate)}>
                                Edit
                            </button>
                            <button className="read-toggle-btn" type="button" onClick={() => handlePublish(certificate)}>
                                {certificate.published ? "Unpublish" : "Publish"}
                            </button>
                            <button className="delete-message-btn" type="button" onClick={() => handleDelete(certificate)}>
                                Delete
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default CertificateManagement;