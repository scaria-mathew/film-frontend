import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPendingFanArt, moderateFanArt, fetchAllDiscussions, fetchAllAMAs, deleteDiscussion } from "../api/client";
import DeleteReasonModal from "../components/DeleteReasonModal";
import "./AdminDashboard.css";

function AdminDashboard() {
    const [pendingArt, setPendingArt] = useState([]);
    const [loadingArts, setLoadingArts] = useState(true);

    const [discussions, setDiscussions] = useState([]);
    const [loadingDiscussions, setLoadingDiscussions] = useState(true);

    const [amas, setAmas] = useState([]);
    const [loadingAMAs, setLoadingAMAs] = useState(true);

    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(null); // { type, id }

    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        if (!token || user?.role !== 'Administrator') {
            setError("Unauthorized to view this dashboard.");
            setLoadingArts(false);
            setLoadingDiscussions(false);
            setLoadingAMAs(false);
            return;
        }

        const loadAll = async () => {
            try {
                const artData = await fetchPendingFanArt(token);
                setPendingArt(artData);
            } catch (err) {
                // Non-fatal
            } finally {
                setLoadingArts(false);
            }

            try {
                const discData = await fetchAllDiscussions();
                setDiscussions(discData.filter(d => !d.isAMA));
            } catch (err) {
                // Non-fatal
            } finally {
                setLoadingDiscussions(false);
            }

            try {
                const amaData = await fetchAllAMAs();
                setAmas(amaData);
            } catch (err) {
                // Non-fatal
            } finally {
                setLoadingAMAs(false);
            }
        };

        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleApprove = async (id) => {
        try {
            await moderateFanArt(id, 'Approved', token);
            setPendingArt(pendingArt.filter(art => art._id !== id));
        } catch (err) {
            alert(err.message || "Action failed.");
        }
    };

    const handleDeleteDiscussion = (id) => setDeleteModal({ type: 'discussion', id });
    const handleDeleteAMA = (id) => setDeleteModal({ type: 'ama', id });
    const handleRejectFanArt = (id) => setDeleteModal({ type: 'fanart', id });

    const confirmModalAction = async (reason) => {
        const modal = deleteModal;
        setDeleteModal(null);
        try {
            if (modal.type === 'discussion') {
                await deleteDiscussion(modal.id, token, reason);
                setDiscussions(discussions.filter(d => d._id !== modal.id));
            } else if (modal.type === 'ama') {
                await deleteDiscussion(modal.id, token, reason);
                setAmas(amas.filter(a => a._id !== modal.id));
            } else if (modal.type === 'fanart') {
                await moderateFanArt(modal.id, 'Rejected', token, reason);
                setPendingArt(pendingArt.filter(art => art._id !== modal.id));
            }
        } catch (err) {
            alert(err.message || "Action failed.");
        }
    };

    if (error) {
        return (
            <div className="admin">
                <h1 className="admin-title">Admin Dashboard</h1>
                <div style={{ color: '#ff4d4f', padding: '20px', backgroundColor: 'rgba(255,77,79,0.1)' }}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="admin">
            {deleteModal && (
                <DeleteReasonModal
                    contentLabel={
                        deleteModal.type === 'fanart' ? 'this fan art'
                        : deleteModal.type === 'ama'  ? 'this AMA session'
                        : 'this discussion thread'
                    }
                    onConfirm={confirmModalAction}
                    onCancel={() => setDeleteModal(null)}
                />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="admin-title" style={{ margin: 0 }}>Admin Dashboard</h1>
                <button
                    onClick={() => navigate('/admin/users')}
                    style={{
                        background: '#e00054',
                        color: '#fff',
                        border: 'none',
                        padding: '9px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        letterSpacing: '0.04em'
                    }}
                >
                    👥 Manage Users
                </button>
            </div>

            {/* Stats */}
            <div className="admin-stats">
                <div className="stat-card">
                    <h2>Discussions</h2>
                    <p>{loadingDiscussions ? "…" : discussions.length}</p>
                </div>
                <div className="stat-card">
                    <h2>AMA Sessions</h2>
                    <p>{loadingAMAs ? "…" : amas.length}</p>
                </div>
                <div className="stat-card">
                    <h2>Pending Art</h2>
                    <p>{loadingArts ? "…" : pendingArt.length}</p>
                </div>
            </div>

            {/* ── Discussion Threads Moderation ── */}
            <div className="admin-section">
                <h2>🗂 Discussion Threads</h2>

                {loadingDiscussions ? (
                    <p>Loading discussions...</p>
                ) : discussions.length === 0 ? (
                    <p style={{ color: '#aaa' }}>No discussion threads found.</p>
                ) : (
                    <div className="mod-list">
                        {discussions.map(d => (
                            <div key={d._id} className="admin-item mod-item">
                                <div className="mod-info">
                                    <p className="mod-title">
                                        {d.isSpoiler && <span className="mod-tag spoiler-tag">Spoiler</span>}
                                        {d.isClosed && <span className="mod-tag closed-tag">Closed</span>}
                                        {d.title}
                                    </p>
                                    <p className="mod-meta">
                                        By <strong>{d.user?.username || 'Unknown'}</strong>
                                        {d.user?.role === 'Verified' && <span className="verified-dot">✓</span>}
                                        {d.movie && <span> · <em>{d.movie.title}</em></span>}
                                    </p>
                                </div>
                                <div className="admin-actions">
                                    <button className="danger-delete" onClick={() => handleDeleteDiscussion(d._id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── AMA Sessions Moderation ── */}
            <div className="admin-section" style={{ marginTop: '36px' }}>
                <h2>🎙 AMA Sessions</h2>

                {loadingAMAs ? (
                    <p>Loading AMA sessions...</p>
                ) : amas.length === 0 ? (
                    <p style={{ color: '#aaa' }}>No AMA sessions found.</p>
                ) : (
                    <div className="mod-list">
                        {amas.map(a => (
                            <div key={a._id} className="admin-item mod-item">
                                <div className="mod-info">
                                    <p className="mod-title">
                                        <span className="mod-tag ama-tag">AMA</span>
                                        {a.isClosed && <span className="mod-tag closed-tag">Closed</span>}
                                        {a.title}
                                    </p>
                                    <p className="mod-meta">
                                        Hosted by <strong>{a.user?.username || 'Unknown'}</strong>
                                        {a.user?.role === 'Verified' && <span className="verified-dot">✓</span>}
                                        {a.movie && <span> · <em>{a.movie.title}</em></span>}
                                    </p>
                                </div>
                                <div className="admin-actions">
                                    <button className="danger-delete" onClick={() => handleDeleteAMA(a._id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Fan Art Moderation ── */}
            <div className="admin-section" style={{ marginTop: '36px' }}>
                <h2>🖼 Pending Fan Art Approvals</h2>

                {loadingArts ? (
                    <p>Loading queue...</p>
                ) : pendingArt.length === 0 ? (
                    <p style={{ color: '#aaa' }}>No artwork pending approval. All caught up!</p>
                ) : (
                    <div className="art-queue">
                        {pendingArt.map(art => (
                            <div key={art._id} className="admin-item art-admin-item">
                                <div className="art-preview">
                                    <img src={art.imageData} alt={art.title} />
                                </div>
                                <div className="art-info">
                                    <p><strong>{art.title}</strong> added to <em>{art.movie?.title || 'Unknown'}</em></p>
                                    <p style={{ fontSize: '0.85rem', color: '#aaa' }}>Uploaded by: {art.user?.username}</p>
                                </div>
                                <div className="admin-actions">
                                    <button className="approve" onClick={() => handleApprove(art._id)}>Approve</button>
                                    <button className="reject" onClick={() => handleRejectFanArt(art._id)}>Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
