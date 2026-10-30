
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    const [savingProject, setSavingProject] = useState(false);
    const [deletingProjectId, setDeletingProjectId] = useState(null);
    const [editingProjectId, setEditingProjectId] = useState(null);
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
                "http://localhost:5000/api/contact",
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
            const response = await fetch("http://localhost:5000/api/projects");
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
            }
        });

        return () => {
            isActive = false;
        };
    }, [token, navigate, fetchContacts, fetchProjects]);

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
                `http://localhost:5000/api/contact/${id}`,
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
                `http://localhost:5000/api/contact/${id}/read`,
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
        setEditingProjectId(null);
        setProjectFormError("");
    };

    const handleProjectSubmit = async (event) => {
        event.preventDefault();
        setSavingProject(true);
        setProjectFormError("");

        const projectData = {
            ...projectForm,
            technologies: projectForm.technologies
                .split(",")
                .map((technology) => technology.trim())
                .filter(Boolean)
        };
        const isEditing = Boolean(editingProjectId);

        try {
            const response = await fetch(
                isEditing
                    ? `http://localhost:5000/api/projects/${editingProjectId}`
                    : "http://localhost:5000/api/projects",
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(projectData)
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
        } catch (error) {
            setProjectFormError(error.message);
        } finally {
            setSavingProject(false);
        }
    };

    const handleEditProject = (project) => {
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
        document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;

        try {
            setDeletingProjectId(id);
            const response = await fetch(
                `http://localhost:5000/api/projects/${id}`,
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

    return (
        <div className="admin-dashboard">

            {/* Sidebar */}
            <aside className="admin-sidebar">
                <h2>VEDANT<span>.</span></h2>

                <p className="sidebar-label">ADMIN PANEL</p>

                <nav>
                    <a href="#overview">Overview</a>
                    <a href="#projects">Projects</a>
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
                            fetchContacts();
                            fetchProjects();
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

                    <form className="project-admin-form" onSubmit={handleProjectSubmit}>
                        <label>
                            Project title
                            <input
                                name="title"
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
                                required
                            />
                        </label>
                        <label>
                            Image URL
                            <input
                                name="imageUrl"
                                type="url"
                                value={projectForm.imageUrl}
                                onChange={handleProjectFormChange}
                            />
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
                                type="url"
                                value={projectForm.githubLink}
                                onChange={handleProjectFormChange}
                            />
                        </label>
                        <label>
                            Live demo link
                            <input
                                name="liveDemoLink"
                                type="url"
                                value={projectForm.liveDemoLink}
                                onChange={handleProjectFormChange}
                            />
                        </label>

                        {projectFormError && (
                            <p className="admin-error" role="alert">{projectFormError}</p>
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
