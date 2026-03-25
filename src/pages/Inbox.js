import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../api/client";
import "./Inbox.css";

const TYPE_LABELS = {
    review_removed:    { icon: "📝", label: "Review Removed" },
    comment_removed:   { icon: "💬", label: "Comment Removed" },
    fanart_rejected:   { icon: "🎨", label: "Fan Art Rejected" },
    discussion_removed:{ icon: "🗣️", label: "Discussion Removed" },
};

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days  > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins  > 0) return `${mins}m ago`;
    return "just now";
}

function Inbox() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) return setLoading(false);
        fetchNotifications(token)
            .then(data => setNotifications(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [token]);

    const handleMarkAllRead = async () => {
        await markAllNotificationsRead(token);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleMarkOne = async (id) => {
        await markNotificationRead(id, token);
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (!token) {
        return (
            <div className="inbox-page">
                <div className="inbox-login-prompt">
                    <span className="inbox-lock">🔒</span>
                    <h2>Sign in to view your Inbox</h2>
                    <p>Your moderation notices and updates will appear here.</p>
                    <Link to="/login" className="inbox-login-btn">Log In</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="inbox-page">
            <div className="inbox-header">
                <div className="inbox-title-row">
                    <h1>Inbox</h1>
                    {unreadCount > 0 && (
                        <span className="inbox-unread-pill">{unreadCount} unread</span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button className="mark-all-btn" onClick={handleMarkAllRead}>
                        Mark all as read
                    </button>
                )}
            </div>

            {loading ? (
                <p className="inbox-state-msg">Loading notifications...</p>
            ) : notifications.length === 0 ? (
                <div className="inbox-empty">
                    <span className="inbox-empty-icon">📭</span>
                    <h3>You're all caught up!</h3>
                    <p>No notifications yet. Moderation notices will appear here.</p>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map(n => {
                        const meta = TYPE_LABELS[n.type] || { icon: "📌", label: n.type };
                        return (
                            <div
                                key={n._id}
                                className={`notification-card ${n.read ? "read" : "unread"}`}
                                onClick={() => !n.read && handleMarkOne(n._id)}
                            >
                                {!n.read && <div className="unread-dot" />}
                                <div className="notif-icon">{meta.icon}</div>
                                <div className="notif-body">
                                    <div className="notif-top-row">
                                        <span className="notif-type-label">{meta.label}</span>
                                        <span className="notif-time">{timeAgo(n.createdAt)}</span>
                                    </div>
                                    <p className="notif-content-title">
                                        "{n.contentTitle}"
                                    </p>
                                    <div className="notif-reason-box">
                                        <span className="notif-reason-label">Reason: </span>
                                        {n.reason}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Inbox;
