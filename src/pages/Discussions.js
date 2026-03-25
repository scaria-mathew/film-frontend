import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { fetchDiscussions, fetchAllDiscussions, createDiscussion, fetchMovies } from "../api/client";
import moviesData from "../data/movies"; // Fallback static data for posters if needed
import "./Discussions.css";

function Discussions() {
    const { search } = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(search);
    const movieId = params.get("movie");

    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isAMA, setIsAMA] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    // Movie selector state (for all-discussions page)
    const [movies, setMovies] = useState([]);
    const [loadingMovies, setLoadingMovies] = useState(false);
    const [selectedMovieId, setSelectedMovieId] = useState("");

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        const loadDiscussions = async () => {
            try {
                // If a movieId is passed in URL, fetch for that movie.
                // Otherwise this endpoint could be expanded to fetch ALL recent discussions
                // For this demo, if no movieId, we just show empty or require selection.
                if (movieId) {
                    const data = await fetchDiscussions(movieId);
                    setDiscussions(data);
                } else {
                    const data = await fetchAllDiscussions();
                    setDiscussions(data);
                }
            } catch (err) {
                setError(err.message || "Failed to load discussions.");
            } finally {
                setLoading(false);
            }
        };
        loadDiscussions();
    }, [movieId]);

    const handleToggleForm = async () => {
        if (!showForm && !movieId && movies.length === 0) {
            setLoadingMovies(true);
            try {
                const data = await fetchMovies();
                setMovies(data);
            } catch (err) {
                // ignore, user will see empty dropdown
            } finally {
                setLoadingMovies(false);
            }
        }
        setShowForm(!showForm);
        setFormError("");
    };

    const handleCreateThread = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        const targetMovieId = movieId || selectedMovieId;
        if (!targetMovieId) {
            setFormError("Please select a movie for this discussion.");
            return;
        }
        if (!token) {
            setFormError("__not_logged_in__");
            return;
        }

        setSubmitting(true);
        setFormError("");
        try {
            const newThread = await createDiscussion({
                movieId: targetMovieId,
                title,
                content,
                isSpoiler,
                isAMA
            }, token);

            // Optimistically add securely populated user
            const optimisticThread = {
                ...newThread,
                user: { username: user ? user.username : "Anonymous", role: user?.role || 'Standard' }
            };

            setDiscussions([optimisticThread, ...discussions]);
            setTitle("");
            setContent("");
            setIsSpoiler(false);
            setIsAMA(false);
            setSelectedMovieId("");
            setShowForm(false);
        } catch (err) {
            setFormError(err.message || "Failed to post thread.");
        } finally {
            setSubmitting(false);
        }
    };

    const targetMovie = moviesData.find(m => m.id === parseInt(movieId));

    return (
        <div className="discussions">
            <div className="discussions-header">
                <h1 className="page-title">
                    {targetMovie ? `Discussions: ${targetMovie.title}` : "Discussions"}
                </h1>
                <button className="new-thread-btn" onClick={handleToggleForm}>
                    {showForm ? "Cancel" : "+ New Thread"}
                </button>
            </div>

            {showForm && (
                <form className="new-thread-form" onSubmit={handleCreateThread}>
                    <h3>Start a New Discussion</h3>

                    {formError && (
                        <p className="form-error-msg">
                            {formError === "__not_logged_in__" ? (
                                <>Please <Link to="/login" className="login-link">log in</Link> to post a discussion.</>
                            ) : formError}
                        </p>
                    )}

                    {/* Movie selector — only shown when not on a specific movie's discussion page */}
                    {!movieId && (
                        <div className="form-group">
                            {loadingMovies ? (
                                <p style={{ color: '#aaa', margin: '0 0 12px' }}>Loading movies...</p>
                            ) : (
                                <select
                                    value={selectedMovieId}
                                    onChange={e => setSelectedMovieId(e.target.value)}
                                    required
                                    className="movie-select"
                                >
                                    <option value="">— Select a Movie —</option>
                                    {movies.map(m => (
                                        <option key={m._id} value={m._id}>{m.title}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="Thread Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                    <textarea
                        placeholder="What's on your mind?"
                        value={content}
                        onChange={e => setContent(e.target.value)}
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

                        {/* Only show AMA option to verified users and admins */}
                        {user && (user.role === 'Verified' || user.role === 'Administrator') && (
                            <label className="ama-checkbox">
                                <input
                                    type="checkbox"
                                    checked={isAMA}
                                    onChange={e => setIsAMA(e.target.checked)}
                                />
                                Host as an AMA Session (Ask Me Anything)
                            </label>
                        )}
                    </div>

                    <button type="submit" disabled={submitting}>
                        {submitting ? "Posting..." : "Post Thread"}
                    </button>
                </form>
            )}

            {loading && movieId && <h2 style={{ padding: "20px" }}>Loading threads...</h2>}
            {error && <h2 style={{ padding: "20px" }}>{error}</h2>}

            {!loading && !error && (
                <div className="discussion-list">
                    {discussions.map((d) => (
                        <div key={d._id} className={`discussion-card ${d.isAMA ? 'ama-card' : ''}`} onClick={() => navigate(`/discussions/${d._id}`)}>
                            <div className="discussion-info">
                                <div className="card-header">
                                    {d.isAMA && <span className="ama-badge">AMA</span>}
                                    {d.isSpoiler && <span className="spoiler-badge">Spoiler</span>}
                                    {d.isClosed && <span className="closed-badge">Closed</span>}
                                </div>
                                <h3>{d.title}</h3>
                                <p className="thread-meta">
                                    Started by: <strong>{d.user?.username || 'Unknown'}</strong>
                                    {d.user?.role === 'Verified' && <span className="verified-check">✓</span>}
                                    {!movieId && d.movie && (
                                        <span style={{ marginLeft: "10px", color: "#ddd" }}>
                                            • {d.movie.title}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}

                    {discussions.length === 0 && (
                        <p style={{ color: "#aaa" }}>
                            No discussions for this movie yet. Be the first to start one!
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default Discussions;
