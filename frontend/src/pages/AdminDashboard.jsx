
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();

    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    const token = sessionStorage.getItem("adminToken");

    // Fetch contact messages
    const fetchContacts = async () => {
        try {
            setLoading(true);
            setError("");

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
    };

    useEffect(() => {
        if (!token) {
            navigate("/admin/login");
            return;
        }

        fetchContacts();
    }, [token]);

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

    return (
        <div className="admin-dashboard">

            {/* Sidebar */}
            <aside className="admin-sidebar">
                <h2>VEDANT<span>.</span></h2>

                <p className="sidebar-label">ADMIN PANEL</p>

                <nav>
                    <a href="#overview">Overview</a>
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
                        onClick={fetchContacts}
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
                        <p>0</p>
                        <span>Portfolio projects</span>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Status</h3>
                        <p>Active</p>
                        <span>Admin account</span>
                    </div>

                </div>

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
