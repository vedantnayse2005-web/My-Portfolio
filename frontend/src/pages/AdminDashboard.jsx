
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import CertificateManagement from "../components/admin/CertificateManagement";
import SkillsManagement from "../components/admin/SkillsManagement";
import EditingOverview from "../components/admin/editing/EditingOverview";
import EditingShowreel from "../components/admin/editing/EditingShowreel";
import EditingProjects from "../components/admin/editing/EditingProjects";
import EditingSkills from "../components/admin/editing/EditingSkills";
import EditingExperience from "../components/admin/editing/EditingExperience";
import EditingProfile from "../components/admin/editing/EditingProfile";
import "./AdminDashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();
    const [adminNavScrolled, setAdminNavScrolled] = useState(() => window.scrollY > 16);
    const [activeDashboardSection, setActiveDashboardSection] = useState(() => window.location.hash || "#overview");

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
    const [profilePhotoAvailable, setProfilePhotoAvailable] = useState(false);
    const [profilePhotoLoading, setProfilePhotoLoading] = useState(true);
    const [profilePhotoError, setProfilePhotoError] = useState("");
    const [profilePhotoStatus, setProfilePhotoStatus] = useState("");
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
    const [profilePhotoVersion, setProfilePhotoVersion] = useState(0);
    const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
    const [removingProfilePhoto, setRemovingProfilePhoto] = useState(false);
    const [projectForm, setProjectForm] = useState({
        title: "",
        description: "",
        imageUrl: "",
        technologies: "",
        githubLink: "",
        liveDemoLink: ""
    });

    const token = sessionStorage.getItem("adminToken");

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 16;
            setAdminNavScrolled((current) => current === scrolled ? current : scrolled);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const updateActiveSection = () => {
            setActiveDashboardSection(window.location.hash || "#overview");
        };
        window.addEventListener("hashchange", updateActiveSection);
        return () => window.removeEventListener("hashchange", updateActiveSection);
    }, []);

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

    const fetchProfilePhotoStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile-photo`);
            if (response.status === 404) {
                setProfilePhotoAvailable(false);
                return;
            }

            if (!response.ok) {
                throw new Error("Unable to fetch profile photo status.");
            }

            await response.body?.cancel();
            setProfilePhotoAvailable(true);
        } catch (fetchError) {
            setProfilePhotoError(fetchError.message);
        } finally {
            setProfilePhotoLoading(false);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
        };
    }, [profilePhotoPreview]);

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
                fetchProfilePhotoStatus();
            }
        });

        return () => {
            isActive = false;
        };
    }, [token, navigate, fetchContacts, fetchProjects, fetchResumeStatus, fetchProfilePhotoStatus]);

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

    const handleProfilePhotoFileChange = (event) => {
        const selectedFile = event.target.files?.[0] || null;
        const allowedTypes = new Map([
            ["image/jpeg", [".jpg", ".jpeg"]],
            ["image/png", [".png"]],
            ["image/webp", [".webp"]]
        ]);
        const extension = selectedFile?.name.slice(selectedFile.name.lastIndexOf(".")).toLowerCase();
        setProfilePhotoError("");
        setProfilePhotoStatus("");

        if (selectedFile && !allowedTypes.get(selectedFile.type)?.includes(extension)) {
            setProfilePhotoFile(null);
            setProfilePhotoPreview("");
            setProfilePhotoError("Choose a JPG, JPEG, PNG, or WebP image.");
            event.target.value = "";
            return;
        }

        if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
            setProfilePhotoFile(null);
            setProfilePhotoPreview("");
            setProfilePhotoError("Profile photos must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }

        setProfilePhotoFile(selectedFile);
    setProfilePhotoPreview(selectedFile ? URL.createObjectURL(selectedFile) : "");
    };

    const handleProfilePhotoUpload = async (event) => {
        event.preventDefault();
        if (!profilePhotoFile) {
            setProfilePhotoError("Choose a photo to upload.");
            return;
        }

        setUploadingProfilePhoto(true);
        setProfilePhotoError("");
        setProfilePhotoStatus("");
        const formData = new FormData();
        formData.append("photo", profilePhotoFile);

        try {
            const response = await fetch(`${API_BASE_URL}/api/profile-photo`, {
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

                throw new Error(result.message || "Unable to upload profile photo.");
            }

            setProfilePhotoAvailable(true);
            setProfilePhotoVersion(Date.now());
            setProfilePhotoFile(null);
            setProfilePhotoPreview("");
            setProfilePhotoStatus(result.warning || "Profile photo uploaded successfully.");
            const fileInput = document.getElementById("profile-photo-file");
            if (fileInput) fileInput.value = "";
        } catch (uploadError) {
            setProfilePhotoError(uploadError.message);
        } finally {
            setUploadingProfilePhoto(false);
        }
    };

    const handleProfilePhotoRemove = async () => {
        if (!window.confirm("Remove the current profile photo from your portfolio?")) return;

        setRemovingProfilePhoto(true);
        setProfilePhotoError("");
        setProfilePhotoStatus("");
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile-photo`, {
                method: "DELETE",
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

                throw new Error(result.message || "Unable to remove profile photo.");
            }

            setProfilePhotoAvailable(false);
            setProfilePhotoVersion(Date.now());
            setProfilePhotoStatus(result.warning || "Profile photo removed successfully.");
        } catch (removeError) {
            setProfilePhotoError(removeError.message);
        } finally {
            setRemovingProfilePhoto(false);
        }
    };

    return (
        <div className="admin-dashboard">

            {/* Sidebar */}
            <aside className={`admin-sidebar ${adminNavScrolled ? "scrolled" : ""}`}>
                <h2>VEDANT<span>.</span></h2>

                <p className="sidebar-label">ADMIN PANEL</p>

                <nav>
                    <div className="admin-nav-group">
                        <span className="admin-nav-group-label">DEVELOPER PORTFOLIO</span>
                        {[
                            ["#overview", "Overview", "⌂"],
                            ["#projects", "Projects", "▤"],
                            ["#skills-management", "Skills", "◇"],
                            ["#certificates", "Certificates", "▧"],
                            ["#developer-experience", "Experience & Education", "↗"]
                        ].map(([href, label, icon]) => (
                            <a className={activeDashboardSection === href ? "active" : ""} href={href} key={href}>
                                <span aria-hidden="true">{icon}</span>{label}
                            </a>
                        ))}
                    </div>
                    <div className="admin-nav-group">
                        <span className="admin-nav-group-label">EDITING PORTFOLIO</span>
                        {[
                            ["#editing-overview", "Editing Overview", "◉"],
                            ["#editing-showreel-admin", "Manage Showreel", "▷"],
                            ["#editing-projects-admin", "Editing Projects", "▣"],
                            ["#editing-skills-admin", "Editing Skills", "◇"],
                            ["#editing-experience-admin", "Editing Experience", "↗"],
                            ["#editing-profile-admin", "About Me", "◎"]
                        ].map(([href, label, icon]) => (
                            <a className={activeDashboardSection === href ? "active" : ""} href={href} key={href}>
                                <span aria-hidden="true">{icon}</span>{label}
                            </a>
                        ))}
                    </div>
                    <div className="admin-nav-group">
                        <span className="admin-nav-group-label">PORTFOLIO MEDIA</span>
                        {[["#profile-photo", "Profile Photo", "◉"], ["#resume", "Resume", "▧"]].map(([href, label, icon]) => (
                            <a className={activeDashboardSection === href ? "active" : ""} href={href} key={href}>
                                <span aria-hidden="true">{icon}</span>{label}
                            </a>
                        ))}
                    </div>
                    <div className="admin-nav-group">
                        <span className="admin-nav-group-label">COMMON</span>
                        {[["#messages", "Contact Messages", "✉"], ["#account-settings", "Account Settings", "⚙"]].map(([href, label, icon]) => (
                            <a className={activeDashboardSection === href ? "active" : ""} href={href} key={href}>
                                <span aria-hidden="true">{icon}</span>{label}
                            </a>
                        ))}
                    </div>
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
                            setProfilePhotoLoading(true);
                            setProfilePhotoError("");
                            fetchContacts();
                            fetchProjects();
                            fetchResumeStatus();
                            fetchProfilePhotoStatus();
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

                <EditingOverview />

                <section className="admin-content" id="profile-photo">
                    <div className="messages-heading">
                        <h2>Profile Photo Management</h2>
                        <span>
                            {profilePhotoLoading
                                ? "Loading..."
                                : profilePhotoAvailable ? "Active" : "Not set"}
                        </span>
                    </div>

                    <div className="profile-photo-management">
                        <div className="profile-photo-preview">
                            {profilePhotoPreview ? (
                                <img src={profilePhotoPreview} alt="Selected profile photo preview" />
                            ) : profilePhotoAvailable && !profilePhotoLoading ? (
                                <img
                                    src={`${API_BASE_URL}/api/profile-photo?v=${profilePhotoVersion}`}
                                    alt="Current profile photo"
                                />
                            ) : (
                                <span>{profilePhotoLoading ? "Loading" : "VN"}</span>
                            )}
                        </div>

                        <form className="profile-photo-form" onSubmit={handleProfilePhotoUpload}>
                            <label htmlFor="profile-photo-file">
                                Profile image (JPG, JPEG, PNG, or WebP; maximum 5 MB)
                            </label>
                            <input
                                id="profile-photo-file"
                                className="profile-photo-input"
                                name="photo"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                onChange={handleProfilePhotoFileChange}
                            />
                            <label className="refresh-btn profile-photo-choose" htmlFor="profile-photo-file">
                                Choose Photo
                            </label>
                            {profilePhotoFile && <p>Selected: {profilePhotoFile.name}</p>}
                            {profilePhotoError && (
                                <p className="admin-error" role="alert">{profilePhotoError}</p>
                            )}
                            {profilePhotoStatus && (
                                <p className="profile-photo-status" role="status">
                                    {profilePhotoStatus}
                                </p>
                            )}
                            <div className="profile-photo-actions">
                                <button
                                    className="refresh-btn"
                                    type="submit"
                                    disabled={uploadingProfilePhoto || !profilePhotoFile}
                                >
                                    {uploadingProfilePhoto ? "Uploading..." : "Upload Profile Photo"}
                                </button>
                                {profilePhotoAvailable && (
                                    <button
                                        className="delete-message-btn"
                                        type="button"
                                        onClick={handleProfilePhotoRemove}
                                        disabled={removingProfilePhoto || uploadingProfilePhoto}
                                    >
                                        {removingProfilePhoto ? "Removing..." : "Remove Photo"}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </section>

                <CertificateManagement />
                <SkillsManagement />

                <section className="admin-content" id="developer-experience">
                    <div className="messages-heading"><h2>Experience &amp; Education</h2><span>Developer portfolio</span></div>
                    <p>These existing developer portfolio sections remain unchanged.</p>
                    <a className="admin-section-link" href="/#experience" target="_blank" rel="noreferrer">View public experience section ↗</a>
                </section>

                <EditingShowreel />
                <EditingProjects />
                <EditingSkills />
                <EditingExperience />
                <EditingProfile />

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

                <section className="admin-content" id="account-settings">
                    <div className="messages-heading">
                        <h2>Account Settings</h2>
                        <span>Administrator session</span>
                    </div>
                    <p>Admin access continues to use the existing protected login and JWT session.</p>
                    <button className="refresh-btn account-logout-button" type="button" onClick={handleLogout}>
                        Sign Out
                    </button>
                </section>

            </main>
        </div>
    );
}

export default AdminDashboard;
