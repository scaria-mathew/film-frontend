import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchMovieById, fetchReviews, createReview, voteReview, deleteReview, fetchDiscussions } from "../api/client";
import ReviewForm from "../components/ReviewForm";
import DeleteReasonModal from "../components/DeleteReasonModal";
import "./MovieDetails.css";

function MovieDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(null); // { reviewId } | null

    // Maintain a set of revealed spoiler review IDs
    const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const userId = user ? (user._id || user.id) : null;

    useEffect(() => {
        const loadMovieData = async () => {
            try {
                const [movieData, reviewsData, discussionsData] = await Promise.all([
                    fetchMovieById(id),
                    fetchReviews(id).catch(() => []),
                    fetchDiscussions(id).catch(() => [])
                ]);
                setMovie(movieData);
                setReviews(reviewsData);
                setDiscussions(Array.isArray(discussionsData) ? discussionsData : []);
            } catch (err) {
                setError(err.message || "Failed to load movie.");
            } finally {
                setLoading(false);
            }
        };

        loadMovieData();
    }, [id]);

    const handleReviewAdded = async (payload, token) => {
        const newReview = await createReview(payload, token);
        // Assuming the backend populates user later, update local state optimistically
        const optimisticReview = {
            ...newReview,
            user: { username: "You" } // Dummy
        };
        setReviews([optimisticReview, ...reviews]);
    };

    const handleVote = async (reviewId, action) => {
        if (!token) {
            alert("Please log in to vote.");
            return;
        }
        try {
            const updatedReview = await voteReview(reviewId, action, token);
            setReviews(reviews.map(r => r._id === reviewId ? updatedReview : r));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteReview = (reviewId) => {
        setDeleteModal({ reviewId });
    };

    const handleOwnerDelete = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete your review?")) return;
        try {
            await deleteReview(reviewId, token);
            setReviews(reviews.filter(r => r._id !== reviewId));
        } catch (err) {
            alert(err.message || "Failed to delete review.");
        }
    };

    const confirmDeleteReview = async (reason) => {
        const { reviewId } = deleteModal;
        setDeleteModal(null);
        try {
            await deleteReview(reviewId, token, reason);
            setReviews(reviews.filter(r => r._id !== reviewId));
        } catch (err) {
            alert(err.message);
        }
    };

    const toggleSpoiler = (reviewId) => {
        setRevealedSpoilers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(reviewId)) {
                newSet.delete(reviewId);
            } else {
                newSet.add(reviewId);
            }
            return newSet;
        });
    };

    if (loading) {
        return <h2 style={{ padding: "20px" }}>Loading movie...</h2>;
    }

    if (error || !movie) {
        return <h2 style={{ padding: "20px" }}>{error || "Movie not found"}</h2>;
    }

    const genreText = Array.isArray(movie.genre) ? movie.genre.join(", ") : "";
    const ottList = Object.entries(movie.ottLinks || {}).filter(([, value]) => Boolean(value));

    // Simple star rating display helper
    const renderStars = (rating) => {
        return "★".repeat(rating) + "☆".repeat(5 - rating);
    };

    return (
        <div className="movie-details-page">
            {deleteModal && (
                <DeleteReasonModal
                    contentLabel="this review"
                    onConfirm={confirmDeleteReview}
                    onCancel={() => setDeleteModal(null)}
                />
            )}
            <div
                className="movie-backdrop"
                style={{
                    backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`
                }}
            >
                <div className="backdrop-fade"></div>
            </div>

            <div className="content-container">
                <aside className="poster-column">
                    <div className="detail-poster-wrapper">
                        <img src={movie.posterUrl} alt={movie.title} className="detail-poster" />
                    </div>
                    <div className="watch-panel">
                        <div className="rating-box">
                            <span className="rating-label">Average Rating</span>
                            <div className="avg-rating">★ {movie.rating || "4.5"}</div>
                        </div>
                        {ottList.length > 0 && (
                            <div className="where-to-watch">
                                <span className="watch-label">Where to watch</span>
                                <div className="ott-links">
                                    {ottList.map(([platform, link]) => (
                                        <a key={platform} href={link} target="_blank" rel="noreferrer" className="ott-btn">
                                            {platform}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                <main className="info-column">
                    <div className="title-block">
                        <h1 className="movie-title">{movie.title}</h1>
                        <span className="movie-year">{movie.releaseYear || "N/A"}</span>
                    </div>
                    <p className="director-line">Directed by <strong>{movie.director || "Unknown"}</strong></p>

                    <div className="movie-tagline">
                        {genreText}
                    </div>

                    <div className="movie-description">
                        <p>{movie.description || "No description available."}</p>
                    </div>

                    <div className="reviews-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>Reviews</h2>
                            <button
                                className="discussion-link-btn"
                                onClick={() => navigate(`/discussions?movie=${movie._id}`)}
                            >
                                View Discussions
                            </button>
                        </div>

                        <ReviewForm movieId={movie._id} onReviewAdded={handleReviewAdded} />

                        <div className="reviews-list">
                            {reviews.map(review => {
                                const isRevealed = revealedSpoilers.has(review._id);
                                return (
                                    <div key={review._id} className={`review-card ${review.isSpoiler ? 'spoiler' : ''}`}>
                                        <div className="vote-column">
                                            <button
                                                className={`vote-btn upvote ${review.upvotes?.includes(userId) ? 'active' : ''}`}
                                                onClick={() => handleVote(review._id, 'upvote')}
                                            >
                                                ▲
                                            </button>
                                            <span className="vote-count">
                                                {(review.upvotes?.length || 0) - (review.downvotes?.length || 0)}
                                            </span>
                                            <button
                                                className={`vote-btn downvote ${review.downvotes?.includes(userId) ? 'active' : ''}`}
                                                onClick={() => handleVote(review._id, 'downvote')}
                                            >
                                                ▼
                                            </button>
                                        </div>
                                        <div className="review-content-col">
                                            <div className="review-header">
                                                <span className="review-user">{review.user?.username || 'Unknown'}</span>
                                                {review.isSpoiler && <span className="review-tag spoiler-tag">Spoiler</span>}
                                                <span className="review-stars">{renderStars(review.rating)}</span>
                                                {user?.role === 'Administrator' && user?.id !== review.user?._id && (
                                                    <button
                                                        onClick={() => handleDeleteReview(review._id)}
                                                        style={{ marginLeft: 'auto', background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                                                        title="Admin Delete"
                                                    >
                                                        [Admin Delete]
                                                    </button>
                                                )}
                                                {user?.id === review.user?._id && (
                                                    <button
                                                        onClick={() => handleOwnerDelete(review._id)}
                                                        style={{ marginLeft: user?.role === 'Administrator' ? '10px' : 'auto', background: 'transparent', color: '#678', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                                                        title="Delete my review"
                                                    >
                                                        [Delete]
                                                    </button>
                                                )}
                                            </div>
                                            <div className="review-body">
                                                {review.isSpoiler && !isRevealed ? (
                                                    <div className="spoiler-warning" onClick={() => toggleSpoiler(review._id)}>
                                                        <p>This review contains spoilers. Click to reveal.</p>
                                                    </div>
                                                ) : (
                                                    <div className="review-text-container">
                                                        <p className="review-text">{review.reviewText}</p>
                                                        {review.isSpoiler && (
                                                            <button className="hide-spoiler-btn" onClick={() => toggleSpoiler(review._id)}>
                                                                Hide Spoiler
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {reviews.length === 0 && (
                                <p style={{ color: '#8899aa', fontStyle: 'italic' }}>
                                    No reviews yet. Be the first to review this film!
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Discussions Preview Section ── */}
                    <div className="discussions-preview-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2>Discussions</h2>
                            <button
                                className="discussion-link-btn"
                                onClick={() => navigate(`/discussions?movie=${movie._id}`)}
                            >
                                View All Discussions
                            </button>
                        </div>

                        {discussions.length === 0 ? (
                            <p style={{ color: '#8899aa', fontStyle: 'italic' }}>
                                No discussions yet for this film. <button className="start-discussion-inline-btn" onClick={() => navigate(`/discussions?movie=${movie._id}`)}>Start one!</button>
                            </p>
                        ) : (
                            <div className="discussion-preview-list">
                                {discussions.slice(0, 3).map(d => (
                                    <div
                                        key={d._id}
                                        className="discussion-preview-card"
                                        onClick={() => navigate(`/discussions/${d._id}`)}
                                    >
                                        <div className="discussion-preview-badges">
                                            {d.isAMA && <span className="preview-badge ama">AMA</span>}
                                            {d.isClosed && <span className="preview-badge closed">Closed</span>}
                                            {d.isSpoiler && <span className="preview-badge spoiler">Spoiler</span>}
                                        </div>
                                        <p className="discussion-preview-title">{d.title}</p>
                                        <p className="discussion-preview-meta">
                                            by <strong>{d.user?.username || 'Unknown'}</strong>
                                            {d.user?.role === 'Verified' && <span className="verified-inline">✓</span>}
                                        </p>
                                    </div>
                                ))}
                                {discussions.length > 3 && (
                                    <p className="more-discussions-hint" onClick={() => navigate(`/discussions?movie=${movie._id}`)}>
                                        +{discussions.length - 3} more discussion{discussions.length - 3 > 1 ? 's' : ''} →
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default MovieDetails;
