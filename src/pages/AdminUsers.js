import { useEffect, useState } from "react";
import { fetchAllUsers, promoteUser, demoteUser, adminDeleteUser } from "../api/client";
import { useNavigate } from "react-router-dom";
import "./AdminUsers.css";

const ROLE_ORDER = { Standard: 0, Verified: 1, Administrator: 2 };
const ROLE_COLORS = {
    Standard: "#8899aa",
    Verified: "#2ecc71",
    Administrator: "#e00054"
};

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("All");
    const [actionLoading, setActionLoading] = useState(null); // userId being acted on

    const token = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const navigate = useNavigate();

    useEffect(() => {
        if (!token || currentUser?.role !== "Administrator") {
            setError("Unauthorized. Admins only.");
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                const data = await fetchAllUsers(token);
                setUsers(data);
            } catch (err) {
                setError(err.message || "Failed to load users.");
            } finally {
                setLoading(false);
            }
        };

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePromote = async (userId) => {
        if (!window.confirm("Promote this user to Verified?")) return;
        setActionLoading(userId);
        try {
            const res = await promoteUser(userId, token);
            setUsers(users.map(u => u._id === userId ? res.user : u));
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDemote = async (userId) => {
        if (!window.confirm("Demote this user back to Standard?")) return;
        setActionLoading(userId);
        try {
            const res = await demoteUser(userId, token);
            setUsers(users.map(u => u._id === userId ? res.user : u));
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId, username) => {
        if (!window.confirm(`Permanently delete account "${username}"? This cannot be undone.`)) return;
        setActionLoading(userId);
        try {
            await adminDeleteUser(userId, token);
            setUsers(users.filter(u => u._id !== userId));
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = users.filter(u => {
        const matchRole = filterRole === "All" || u.role === filterRole;
        const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        return matchRole && matchSearch;
    });

    // Sort: Admins first, then Verified, then Standard
    const sorted = [...filtered].sort((a, b) => ROLE_ORDER[b.role] - ROLE_ORDER[a.role]);

    if (error) {
        return (
            <div className="admin-users-page">
                <div className="au-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="admin-users-page">
            <div className="au-header">
                <div className="au-title-row">
                    <button className="au-back-btn" onClick={() => navigate("/admin")}>← Dashboard</button>
                    <h1 className="au-title">👥 User Management</h1>
                </div>
                <div className="au-summary">
                    {loading ? "Loading..." : (
                        <>
                            <span className="au-stat"><strong>{users.length}</strong> Total</span>
                            <span className="au-stat au-admin-stat"><strong>{users.filter(u => u.role === 'Administrator').length}</strong> Admins</span>
                            <span className="au-stat au-verified-stat"><strong>{users.filter(u => u.role === 'Verified').length}</strong> Verified</span>
                            <span className="au-stat au-standard-stat"><strong>{users.filter(u => u.role === 'Standard').length}</strong> Standard</span>
                        </>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="au-controls">
                <input
                    type="text"
                    className="au-search"
                    placeholder="Search by username or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="au-role-filters">
                    {["All", "Administrator", "Verified", "Standard"].map(role => (
                        <button
                            key={role}
                            className={`au-filter-btn ${filterRole === role ? "active" : ""}`}
                            onClick={() => setFilterRole(role)}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {/* User Table */}
            {loading ? (
                <div className="au-loading">Loading users...</div>
            ) : sorted.length === 0 ? (
                <div className="au-empty">No users found matching your filters.</div>
            ) : (
                <div className="au-table-wrapper">
                    <table className="au-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map(u => {
                                const isSelf = u._id === currentUser?.id;
                                const isAdmin = u.role === "Administrator";
                                const isLoading = actionLoading === u._id;

                                return (
                                    <tr key={u._id} className={isSelf ? "au-row-self" : ""}>
                                        <td className="au-username">
                                            {u.username}
                                            {isSelf && <span className="au-you-badge">you</span>}
                                        </td>
                                        <td className="au-email">{u.email}</td>
                                        <td>
                                            <span
                                                className="au-role-badge"
                                                style={{ backgroundColor: ROLE_COLORS[u.role] + "22", color: ROLE_COLORS[u.role], borderColor: ROLE_COLORS[u.role] + "55" }}
                                            >
                                                {u.role === "Verified" && "✓ "}
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="au-date">
                                            {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="au-actions">
                                            {!isAdmin && !isSelf && (
                                                <>
                                                    {u.role === "Standard" && (
                                                        <button
                                                            className="au-btn au-promote-btn"
                                                            onClick={() => handlePromote(u._id)}
                                                            disabled={isLoading}
                                                            title="Promote to Verified"
                                                        >
                                                            {isLoading ? "…" : "✓ Verify"}
                                                        </button>
                                                    )}
                                                    {u.role === "Verified" && (
                                                        <button
                                                            className="au-btn au-demote-btn"
                                                            onClick={() => handleDemote(u._id)}
                                                            disabled={isLoading}
                                                            title="Demote to Standard"
                                                        >
                                                            {isLoading ? "…" : "↓ Unverify"}
                                                        </button>
                                                    )}
                                                    <button
                                                        className="au-btn au-delete-btn"
                                                        onClick={() => handleDelete(u._id, u.username)}
                                                        disabled={isLoading}
                                                        title="Delete account"
                                                    >
                                                        {isLoading ? "…" : "🗑 Delete"}
                                                    </button>
                                                </>
                                            )}
                                            {(isAdmin || isSelf) && (
                                                <span className="au-protected">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminUsers;
