
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import "./AdminDashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();

    const [contacts, setContacts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [projectsError, setProjectsError] = useState("");
    const [projectFormError, setProjectFormError] = useState("");
    const [projectFormSuccess, setProjectFormSuccess] = useState("");
    const [savingProject, setSavingProject] = useState(false);
    const [deletingProjectId, setDeletingProjectId] = useState(null);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [projectImageFile, setProjectImageFile] = useState(null);
    const [resume, setResume] = useState(null);
    const [resumeLoading, setResumeLoading] = useState(true);
    const [resumeError, setResumeError] = useState("");
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeUploadStatus, setResumeUploadStatus] = useState("");
    const [uploadingResume, setUploadingResume] = useState(false);
    const [projectForm, setProjectForm] = useState({
        title: "",
        description: "",
        imageUrl: "",
        technologies: "",
        githubLink: "",
        liveDemoLink: ""
    });

    const token = sessionStorage.getItem("adminToken");

    // Fetch contact messages
    const fetchContacts = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/contact`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    sessionStorage.removeItem("adminToken");
                    navigate("/admin/login");
                    return;
                }

                throw new Error(result.message || "Unable to fetch messages.");
            }

            setContacts(result.data || []);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [navigate, token]);

    const fetchProjects = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/projects`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Unable to fetch projects.");
            }

            setProjects(result.data || []);
        } catch (error) {
            setProjectsError(error.message);
        } finally {
            setProjectsLoading(false);
        }
    }, []);

    const fetchResumeStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/resume/status`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    sessionStorage.removeItem("adminToken");
                    navigate("/admin/login");
                    return;
                }

                throw new Error(result.message || "Unable to fetch resume status.");
            }

            setResume(result.data);
        } catch (fetchError) {
            setResumeError(fetchError.message);
        } finally {
            setResumeLoading(false);
        }
    }, [navigate, token]);

    useEffect(() => {
        if (!token) {
            navigate("/admin/login");
            return;
        }

        let isActive = true;
        Promise.resolve().then(() => {
            if (isActive) {
                fetchContacts();
                fetchProjects();
                fetchResumeStatus();
            }
        });

        return () => {
            isActive = false;
        };
    }, [token, navigate, fetchContacts, fetchProjects, fetchResumeStatus]);

    // Logout
    const handleLogout = () => {
        sessionStorage.removeItem("adminToken");
        navigate("/admin/login");
    };

    // Delete contact message
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this message?"
        );

        if (!confirmDelete) return;

        try {
            setDeletingId(id);

            const response = await fetch(
                `${API_BASE_URL}/api/contact/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Delete failed.");
            }

            setContacts((prev) =>
                prev.filter((contact) => contact._id !== id)
            );

        } catch (error) {
            alert(error.message);
        } finally {
            setDeletingId(null);
        }
    };


    //  Mark contact message as read/unread
    const handleReadToggle = async (id, currentStatus) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/contact/${id}/read`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        isRead: !currentStatus
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Unable to update status.");
            }

            setContacts((prev) =>
                prev.map((contact) =>
                    contact._id === id
                        ? { ...contact, isRead: result.data.isRead }
                        : contact
                )
            );
        } catch (error) {
            alert(error.message);
        }
    };

    const handleProjectFormChange = (event) => {
        setProjectForm((current) => ({
            ...current,
            [event.target.name]: event.target.value
        }));
        setProjectFormError("");
        setProjectFormSuccess("");
    };

    const handleProjectImageChange = (event) => {
        const selectedFile = event.target.files?.[0] || null;
        const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
        setProjectFormError("");
        setProjectFormSuccess("");

        if (selectedFile && !allowedTypes.includes(selectedFile.type)) {
            setProjectImageFile(null);
            setProjectFormError("Choose a PNG, JPEG, WebP, or GIF image.");
            event.target.value = "";
            return;
        }

        if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
            setProjectImageFile(null);
            setProjectFormError("Project images must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }

        setProjectImageFile(selectedFile);
    };

    const resetProjectForm = () => {
        setProjectForm({
            title: "",
            description: "",
            imageUrl: "",
            technologies: "",
            githubLink: "",
            liveDemoLink: ""
        });
        setProjectImageFile(null);
        setEditingProjectId(null);
        setProjectFormError("");
        setProjectFormSuccess("");
    };

    const handleProjectSubmit = async (event) => {
        event.preventDefault();
        setProjectFormError("");
        setProjectFormSuccess("");

        const title = projectForm.title.trim();
        const description = projectForm.description.trim();
        const imageUrl = projectForm.imageUrl.trim();
        const githubLink = projectForm.githubLink.trim();
        const liveDemoLink = projectForm.liveDemoLink.trim();
        const technologies = projectForm.technologies
            .split(",")
            .map((technology) => technology.trim())
            .filter(Boolean);

        if (!title || !description) {
            setProjectFormError("Project title and description are required.");
            return;
        }

        if (title.length > 100) {
            setProjectFormError("Project title must be 100 characters or fewer.");
            return;
        }

        if (description.length > 3000) {
            setProjectFormError("Description must be 3,000 characters or fewer.");
            return;
        }

        if (technologies.length > 20) {
            setProjectFormError("Enter no more than 20 technologies.");
            return;
        }

        if (technologies.some((technology) => technology.length > 40)) {
            setProjectFormError("Each technology must be 40 characters or fewer.");
            return;
        }

        const urls = [
            ["Image URL", imageUrl],
            ["GitHub URL", githubLink],
            ["Live demo URL", liveDemoLink]
        ];

        for (const [label, value] of urls) {
            if (value.length > 2048) {
                setProjectFormError(`${label} must be 2,048 characters or fewer.`);
                return;
            }

            if (value) {
                try {
                    const parsedUrl = new URL(value);
                    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
                        throw new Error();
                    }
                } catch {
                    setProjectFormError(`${label} must be a valid HTTP or HTTPS URL.`);
                    return;
                }
            }
        }

        const projectData = {
            title,
            description,
            imageUrl: projectImageFile ? "" : imageUrl,
            technologies: technologies.join(", "),
            githubLink,
            liveDemoLink
        };
        const isEditing = Boolean(editingProjectId);

        setSavingProject(true);
        try {
            const formData = new FormData();
            Object.entries(projectData).forEach(([key, value]) => {
                formData.append(key, value);
            });
            if (projectImageFile) {
                formData.append("image", projectImageFile);
            }

            const response = await fetch(
                isEditing
                    ? `${API_BASE_URL}/api/projects/${editingProjectId}`
                    : `${API_BASE_URL}/api/projects`,
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );
            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    sessionStorage.removeItem("adminToken");
                    navigate("/admin/login");
                    return;
                }

                throw new Error(result.message || "Unable to save project.");
            }

            setProjects((current) =>
                isEditing
                    ? current.map((project) =>
                        project._id === editingProjectId ? result.data : project
                    )
                    : [result.data, ...current]
            );
            resetProjectForm();
            setProjectFormSuccess(
                isEditing
                    ? "Project updated successfully."
                    : "Project added successfully."
            );
        } catch (error) {
            setProjectFormError(error.message);
        } finally {
            setSavingProject(false);
        }
    };

    const handleEditProject = (project) => {
        setProjectImageFile(null);
        setProjectForm({
            title: project.title || "",
            description: project.description || "",
            imageUrl: project.imageUrl || "",
            technologies: (project.technologies || []).join(", "),
            githubLink: project.githubLink || "",
            liveDemoLink: project.liveDemoLink || ""
        });
        setEditingProjectId(project._id);
        setProjectFormError("");
        setProjectFormSuccess("");
        document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;

        try {
            setDeletingProjectId(id);
            const response = await fetch(
                `${API_BASE_URL}/api/projects/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    sessionStorage.removeItem("adminToken");
                    navigate("/admin/login");
                    return;
                }

                throw new Error(result.message || "Unable to delete project.");
            }

            setProjects((current) =>
                current.filter((project) => project._id !== id)
            );
            if (editingProjectId === id) resetProjectForm();
        } catch (error) {
            setProjectsError(error.message);
        } finally {
            setDeletingProjectId(null);
        }
    };

    const handleResumeFileChange = (event) => {
        const selectedFile = event.target.files?.[0] || null;
        setResumeUploadStatus("");

        if (
            selectedFile &&
            (
                selectedFile.type !== "application/pdf" ||
                !selectedFile.name.toLowerCase().endsWith(".pdf")
            )
        ) {
            setResumeFile(null);
            setResumeUploadStatus("Only PDF files are accepted.");
            event.target.value = "";
            return;
        }

        if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
            setResumeFile(null);
            setResumeUploadStatus("Resume must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }

        setResumeFile(selectedFile);
    };

    const handleResumeUpload = async (event) => {
        event.preventDefault();
        if (!resumeFile) {
            setResumeUploadStatus("Choose a PDF file to upload.");
            return;
        }

        setUploadingResume(true);
        setResumeUploadStatus("");
        setResumeError("");

        const formData = new FormData();
        formData.append("resume", resumeFile);

        try {
            const response = await fetch(`${API_BASE_URL}/api/resume`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });
            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    sessionStorage.removeItem("adminToken");
                    navigate("/admin/login");
                    return;
                }

                throw new Error(result.message || "Unable to upload resume.");
            }

            setResume(result.data);
            setResumeFile(null);
            setResumeUploadStatus(result.warning || "Resume uploaded successfully.");
            event.target.reset();
        } catch (uploadError) {
            setResumeUploadStatus(uploadError.message);
        } finally {
            setUploadingResume(false);
        }
    };

    return (
        <div className="admin-dashboard">

            {/* Sidebar */}
            <aside className="admin-sidebar">
                <h2>VEDANT<span>.</span></h2>

                <p className="sidebar-label">ADMIN PANEL</p>

                <nav>
                    <a href="#overview">Overview</a>
                    <a href="#projects">Projects</a>
                    <a href="#resume">Resume</a>
                    <a href="#messages">Messages</a>
                </nav>

                <button onClick={handleLogout}>
                    Logout ↗
                </button>
            </aside>

            {/* Main Dashboard */}
            <main className="admin-main" id="overview">

                <div className="admin-topbar">
                    <div>
                        <span className="admin-label">DASHBOARD</span>
                        <h1>Welcome Back!</h1>
                        <p>Manage your portfolio from here.</p>
                    </div>

                    <button
                        className="refresh-btn"
                        onClick={() => {
                            setLoading(true);
                            setError("");
                            setProjectsLoading(true);
                            setProjectsError("");
                            setResumeLoading(true);
                            setResumeError("");
                            fetchContacts();
                            fetchProjects();
                            fetchResumeStatus();
                        }}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "↻ Refresh"}
                    </button>
                </div>

                {/* Statistics */}
                <div className="admin-stats">

                    <div className="admin-stat-card">
                        <h3>Total Messages</h3>
                        <p>{contacts.length}</p>
                        <span>Contact submissions</span>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Projects</h3>
                        <p>{projects.length}</p>
                        <span>Portfolio projects</span>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Status</h3>
                        <p>Active</p>
                        <span>Admin account</span>
                    </div>

                </div>

                <section className="admin-content" id="projects">
                    <div className="messages-heading">
                        <h2>{editingProjectId ? "Edit Project" : "Add Project"}</h2>
                        <span>{projects.length} Total</span>
                    </div>

                    <form className="project-admin-form" onSubmit={handleProjectSubmit} noValidate>
                        <label>
                            Project title
                            <input
                                name="title"
                                maxLength={100}
                                value={projectForm.title}
                                onChange={handleProjectFormChange}
                                required
                            />
                        </label>
                        <label>
                            Description
                            <textarea
                                name="description"
                                value={projectForm.description}
                                onChange={handleProjectFormChange}
                                rows="4"
                                maxLength={3000}
                                required
                            />
                        </label>
                        <label>
                            Project image (PNG, JPEG, WebP, or GIF; max 5 MB)
                            <input
                                name="image"
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                onChange={handleProjectImageChange}
                            />
                            {projectImageFile && <span>{projectImageFile.name}</span>}
                            {!projectImageFile && projectForm.imageUrl && (
                                <span>Current image will be kept unless you choose a new one.</span>
                            )}
                        </label>
                        <label>
                            Technologies (comma-separated)
                            <input
                                name="technologies"
                                value={projectForm.technologies}
                                onChange={handleProjectFormChange}
                                placeholder="React, Node.js, MongoDB"
                            />
                        </label>
                        <label>
                            GitHub link
                            <input
                                name="githubLink"
                                type="text"
                                maxLength={2048}
                                value={projectForm.githubLink}
                                onChange={handleProjectFormChange}
                            />
                        </label>
                        <label>
                            Live demo link
                            <input
                                name="liveDemoLink"
                                type="text"
                                maxLength={2048}
                                value={projectForm.liveDemoLink}
                                onChange={handleProjectFormChange}
                            />
                        </label>

                        {projectFormError && (
                            <p className="admin-error" role="alert">{projectFormError}</p>
                        )}
                        {projectFormSuccess && (
                            <p className="project-form-success" role="status">
                                {projectFormSuccess}
                            </p>
                        )}

                        <div className="project-form-actions">
                            <button className="refresh-btn" type="submit" disabled={savingProject}>
                                {savingProject
                                    ? "Saving..."
                                    : editingProjectId ? "Save Changes" : "Add Project"}
                            </button>
                            {editingProjectId && (
                                <button
                                    className="cancel-project-btn"
                                    type="button"
                                    onClick={resetProjectForm}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="messages-heading project-list-heading">
                        <h2>Portfolio Projects</h2>
                        <button
                            className="refresh-btn"
                            onClick={() => {
                                setProjectsLoading(true);
                                setProjectsError("");
                                fetchProjects();
                            }}
                            disabled={projectsLoading}
                        >
                            {projectsLoading ? "Refreshing..." : "↻ Refresh"}
                        </button>
                    </div>

                    {projectsLoading && <p>Loading projects...</p>}
                    {projectsError && (
                        <p className="admin-error" role="alert">{projectsError}</p>
                    )}
                    {!projectsLoading && !projectsError && projects.length === 0 && (
                        <p>No projects added yet.</p>
                    )}
                    {!projectsLoading && projects.map((project) => (
                        <article className="admin-project" key={project._id}>
                            <div>
                                <h3>{project.title}</h3>
                                <p>{project.description}</p>
                                <p>
                                    <strong>Technologies:</strong>{" "}
                                    {(project.technologies || []).join(", ") || "None"}
                                </p>
                            </div>
                            <div className="project-admin-actions">
                                <button
                                    className="edit-project-btn"
                                    type="button"
                                    onClick={() => handleEditProject(project)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="delete-message-btn"
                                    type="button"
                                    onClick={() => handleDeleteProject(project._id)}
                                    disabled={deletingProjectId === project._id}
                                >
                                    {deletingProjectId === project._id ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="admin-content" id="resume">
                    <div className="messages-heading">
                        <h2>Resume Management</h2>
                        <span>{resume ? "Uploaded" : "Not uploaded"}</span>
                    </div>

                    {resumeLoading && <p>Loading resume status...</p>}
                    {resumeError && (
                        <p className="admin-error" role="alert">{resumeError}</p>
                    )}
                    {!resumeLoading && !resumeError && (
                        <div className="resume-current">
                            <p>
                                <strong>Current resume:</strong>{" "}
                                {resume?.filename || "No resume uploaded"}
                            </p>
                            {resume && (
                                <p>
                                    <strong>Last uploaded:</strong>{" "}
                                    {new Date(resume.uploadedAt).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}

                    <form className="resume-upload-form" onSubmit={handleResumeUpload}>
                        <label htmlFor="resume-file">Upload a PDF resume (maximum 5 MB)</label>
                        <input
                            id="resume-file"
                            name="resume"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleResumeFileChange}
                        />
                        {resumeFile && <p>Selected: {resumeFile.name}</p>}
                        {resumeUploadStatus && (
                            <p className="resume-upload-status" role="status">
                                {resumeUploadStatus}
                            </p>
                        )}
                        <button
                            className="refresh-btn"
                            type="submit"
                            disabled={uploadingResume || !resumeFile}
                        >
                            {uploadingResume
                                ? "Uploading..."
                                : resume ? "Replace Resume" : "Upload Resume"}
                        </button>
                    </form>
                </section>

                {/* Contact Messages */}
                <section className="admin-content" id="messages">

                    <div className="messages-heading">
                        <h2>Contact Messages</h2>
                        <span>{contacts.length} Total</span>
                    </div>

                    {loading && (
                        <p>Loading messages...</p>
                    )}

                    {error && (
                        <p className="admin-error">{error}</p>
                    )}

                    {!loading && !error && contacts.length === 0 && (
                        <p>No messages received yet.</p>
                    )}

                    {!loading && !error && contacts.map((contact) => (

                        <div className="admin-message" key={contact._id}>

                            <h3>{contact.name}</h3>
                            <span className={`message-status ${contact.isRead ? "read" : "unread"}`}>
                                {contact.isRead ? "READ" : "UNREAD"}
                            </span>
                            <p>
                                <strong>Email:</strong> {contact.email}
                            </p>

                            <p>
                                <strong>Subject:</strong> {contact.subject}
                            </p>

                            <p className="message-text">
                                {contact.message}
                            </p>

                            <small>
                                {new Date(contact.createdAt).toLocaleString()}
                            </small>

                            <div className="message-actions">
                                <button
                                    className="delete-message-btn"
                                    onClick={() => handleDelete(contact._id)}
                                    disabled={deletingId === contact._id}
                                >
                                    {deletingId === contact._id
                                        ? "Deleting..."
                                        : "Delete Message"}
                                </button>

                                   {/* // Toggle read/unread status */}
                                <button
                                    className="read-toggle-btn"
                                    onClick={() => handleReadToggle(contact._id, contact.isRead)}
                                >
                                    {contact.isRead ? "Mark as Unread" : "Mark as Read"}
                                </button>

                            </div>

                        </div>

                    ))}

                </section>

            </main>
        </div>
    );
}

export default AdminDashboard;
