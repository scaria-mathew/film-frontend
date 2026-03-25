import { useEffect, useState } from "react";
import { fetchAllAMAs, fetchMovies, createDiscussion, deleteDiscussion } from "../api/client";
import { useNavigate, Link } from "react-router-dom";
import "../pages/Discussions.css";

function AMAs() {
    const [amas, setAmas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const canStartAMA = user && (user.role === 'Verified' || user.role === 'Administrator');
    const isAdmin = user && user.role === 'Administrator';

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [movies, setMovies] = useState([]);
    const [loadingMovies, setLoadingMovies] = useState(false);
    const [amaTitle, setAmaTitle] = useState("");
    const [amaContent, setAmaContent] = useState("");
    const [amaMovieId, setAmaMovieId] = useState("");
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [amaError, setAmaError] = useState("");

    useEffect(() => {
        const loadAMAs = async () => {
            try {
                const data = await fetchAllAMAs();
                setAmas(data);
            } catch (err) {
                setError(err.message || "Failed to load AMAs.");
            } finally {
                setLoading(false);
            }
        };
        loadAMAs();
    }, []);

    const handleShowForm = async () => {
        if (!showForm && movies.length === 0) {
            setLoadingMovies(true);
            try {
                const data = await fetchMovies();
                setMovies(data);
            } catch (err) {
                alert("Could not load movies list.");
            } finally {
                setLoadingMovies(false);
            }
        }
        setShowForm(!showForm);
    };

    const handleStartAMA = async (e) => {
        e.preventDefault();
        if (!amaTitle.trim() || !amaContent.trim() || !amaMovieId) return;
        if (!token) {
            setAmaError("__not_logged_in__");
            return;
        }

        setSubmitting(true);
        try {
            const newAMA = await createDiscussion({
                movieId: amaMovieId,
                title: amaTitle,
                content: amaContent,
                isSpoiler,
                isAMA: true
            }, token);

            const optimistic = {
                ...newAMA,
                user: { username: user.username, role: user.role },
                movie: movies.find(m => m._id === amaMovieId) || null
            };

            setAmas([optimistic, ...amas]);
            setAmaTitle("");
            setAmaContent("");
            setAmaMovieId("");
            setIsSpoiler(false);
            setShowForm(false);
        } catch (err) {
            setAmaError(err.message || "Failed to start AMA.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAMA = async (e, amaId) => {
        e.stopPropagation(); // prevent navigation to detail page
        if (!window.confirm("Admin: Permanently delete this AMA session?")) return;
        try {
            await deleteDiscussion(amaId, token);
            setAmas(amas.filter(a => a._id !== amaId));
        } catch (err) {
            alert(err.message || "Failed to delete AMA.");
        }
    };

    return (
        <div className="discussions">
            <div className="discussions-header">
                <h1 className="page-title">Active AMA Sessions</h1>
                {canStartAMA && (
                    <button className="new-thread-btn" onClick={handleShowForm}>
                        {showForm ? "Cancel" : "+ Start New AMA"}
                    </button>
                )}
            </div>

            {/* New AMA form — only for Verified and Admin */}
            {showForm && (
                <form className="new-thread-form" onSubmit={handleStartAMA}>
                    <h3>Host a New AMA Session</h3>
                    {amaError && (
                        <p className="comment-error">
                            {amaError === "__not_logged_in__" ? (
                                <>Please <Link to="/login" className="login-link">log in</Link> to start an AMA.</>
                            ) : amaError}
                        </p>
                    )}

                    {loadingMovies ? (
                        <p style={{ color: '#aaa' }}>Loading movies...</p>
                    ) : (
                        <select
                            value={amaMovieId}
                            onChange={e => setAmaMovieId(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '0.95rem',
                                marginBottom: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">— Select a Movie —</option>
                            {movies.map(m => (
                                <option key={m._id} value={m._id}>{m.title}</option>
                            ))}
                        </select>
                    )}

                    <input
                        type="text"
                        placeholder="AMA Title (e.g. I'm the director of Inception — AMA!)"
                        value={amaTitle}
                        onChange={e => setAmaTitle(e.target.value)}
                        required
                    />
                    <textarea
                        placeholder="Introduce yourself and what people can ask you about..."
                        value={amaContent}
                        onChange={e => setAmaContent(e.target.value)}
                        required
                    />

                    <div className="checkbox-options">
                        <label>
                            <input
                                type="checkbox"
                                checked={isSpoiler}
                                onChange={e => setIsSpoiler(e.target.checked)}
                            />
                            Contains Spoilers
                        </label>
                    </div>

                    <button type="submit" disabled={submitting}>
                        {submitting ? "Starting AMA..." : "🎙 Start AMA Session"}
                    </button>
                </form>
            )}

            {loading && <h2 style={{ padding: "20px" }}>Loading AMAs...</h2>}
            {error && <h2 style={{ padding: "20px", color: "#ff4d4f" }}>{error}</h2>}

            {!loading && !error && (
                <div className="discussion-list">
                    {amas.map((d) => (
                        <div
                            key={d._id}
                            className="discussion-card ama-card"
                            onClick={() => navigate(`/discussions/${d._id}`)}
                        >
                            <div className="discussion-info">
                                <div className="card-header">
                                    <span className="ama-badge">AMA</span>
                                    {d.isClosed && <span className="closed-badge">Closed</span>}
                                </div>
                                <h3>{d.title}</h3>
                                <p className="thread-meta">
                                    Hosted by: <strong>{d.user?.username || 'Unknown'}</strong>
                                    {d.user?.role === 'Verified' && <span className="verified-check">✓</span>}
                                    {d.movie && <span> • <em>{d.movie.title}</em></span>}
                                </p>
                            </div>

                            {/* Admin-only delete button */}
                            {isAdmin && (
                                <button
                                    className="admin-delete-btn"
                                    onClick={(e) => handleDeleteAMA(e, d._id)}
                                    title="Admin: Delete this AMA"
                                >
                                    🗑 Delete
                                </button>
                            )}
                        </div>
                    ))}

                    {amas.length === 0 && (
                        <p style={{ color: "#aaa", textAlign: "center", padding: "40px" }}>
                            No active AMA sessions right now.
                            {canStartAMA
                                ? " Click \"+ Start New AMA\" above to host one!"
                                : " Verified accounts and Administrators can start AMA sessions."
                            }
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default AMAs;
