import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config/api";
import "./AboutManagement.css";

const fields = [
    {
        name: "heading",
        label: "About heading",
        maxLength: 200,
        rows: 2,
        required: true
    },
    {
        name: "shortIntroduction",
        label: "Short introduction",
        maxLength: 1000,
        rows: 3,
        required: true
    },
    {
        name: "professionalBiography",
        label: "Full professional biography",
        maxLength: 4000,
        rows: 7,
        required: true
    },
    {
        name: "educationDetails",
        label: "Education details",
        maxLength: 1000,
        rows: 3
    },
    {
        name: "careerGoals",
        label: "Career goals",
        maxLength: 1000,
        rows: 3
    },
    {
        name: "additionalInformation",
        label: "Additional information",
        maxLength: 1000,
        rows: 3
    }
];

const emptyAbout = Object.fromEntries(fields.map(({ name }) => [name, ""]));

function AboutManagement() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("adminToken");
    const [about, setAbout] = useState(emptyAbout);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        let isActive = true;

        const fetchAbout = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/about/admin`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const result = await response.json();

                if (!isActive) return;
                if (response.status === 401) {
                    sessionStorage.removeItem("adminToken");
                    navigate("/admin/login");
                    return;
                }
                if (!response.ok) {
                    throw new Error(result.message || "Unable to fetch About content.");
                }

                setAbout({
                    ...emptyAbout,
                    ...Object.fromEntries(
                        fields.map(({ name }) => [name, result.data?.[name] || ""])
                    )
                });
            } catch (fetchError) {
                if (isActive) setError(fetchError.message);
            } finally {
                if (isActive) setLoading(false);
            }
        };

        Promise.resolve().then(() => {
            if (isActive) fetchAbout();
        });

        return () => {
            isActive = false;
        };
    }, [navigate, token]);

    const handleChange = (event) => {
        setAbout((current) => ({
            ...current,
            [event.target.name]: event.target.value
        }));
        setError("");
        setStatus("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setStatus("");
        setSaving(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/about`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(about)
            });
            const result = await response.json();

            if (response.status === 401) {
                sessionStorage.removeItem("adminToken");
                navigate("/admin/login");
                return;
            }
            if (!response.ok) {
                throw new Error(result.message || "Unable to save About content.");
            }

            setAbout({
                ...emptyAbout,
                ...Object.fromEntries(
                    fields.map(({ name }) => [name, result.data?.[name] || ""])
                )
            });
            setStatus(result.message || "About content saved successfully.");
        } catch (saveError) {
            setError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="admin-content about-management" id="about-management">
            <div className="messages-heading">
                <h2>About Management</h2>
                <span>Developer portfolio</span>
            </div>
            <p>Manage the content displayed in the public About section.</p>

            {loading && <p role="status">Loading About content...</p>}
            {!loading && (
                <form className="about-admin-form" onSubmit={handleSubmit}>
                    {fields.map(({ name, label, maxLength, rows, required }) => (
                        <label className={`about-field about-field-${name}`} key={name}>
                            {label}
                            <textarea
                                name={name}
                                value={about[name]}
                                onChange={handleChange}
                                rows={rows}
                                maxLength={maxLength}
                                required={required}
                            />
                            <span>{about[name].length}/{maxLength}</span>
                        </label>
                    ))}

                    {error && <p className="admin-error" role="alert">{error}</p>}
                    {status && <p className="about-admin-status" role="status">{status}</p>}

                    <div className="about-admin-actions">
                        <button className="refresh-btn" type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save About Content"}
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}

export default AboutManagement;
