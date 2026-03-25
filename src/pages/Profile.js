import { useEffect, useState } from "react";
import { fetchUserReviews, fetchUserDiscussions, fetchUserFanArt } from "../api/client";
import { Link } from "react-router-dom";
import "./Profile.css";

function Profile() {
    const [user, setUser] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [discussions, setDiscussions] = useState([]);
    const [fanArt, setFanArt] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("reviews");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);

            const userId = parsed._id || parsed.id;
            Promise.all([
                fetchUserReviews(userId, token).catch(() => []),
                fetchUserDiscussions(userId, token).catch(() => []),
                fetchUserFanArt(userId, token).catch(() => [])
            ]).then(([revs, disc, art]) => {
                setReviews(revs);
                setDiscussions(disc);
                setFanArt(art);
            }).finally(() => {
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <div className="profile">
            {/* Header */}
            <div className="profile-header">
                <div className="profile-avatar">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>

                <div className="profile-info">
                    <h1>{user?.username || "Guest"}</h1>
                    <p>Film enthusiast • Sci-Fi lover</p>
                </div>
            </div>

            {/* Stats */}
            <div className="profile-stats">
                <div>
                    <strong>{reviews.length}</strong>
                    <span>Reviews</span>
                </div>
                <div>
                    <strong>{discussions.length}</strong>
                    <span>Threads</span>
                </div>
                <div>
                    <strong>{fanArt.length}</strong>
                    <span>Fan Art</span>
                </div>
            </div>

            {/* Activity Toggles */}
            <div className="profile-tabs">
                <button
                    className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                >
                    Reviews
                </button>
                <button
                    className={`tab-btn ${activeTab === 'discussions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('discussions')}
                >
                    Discussions
                </button>
            </div>

            {/* Activity Content */}
            <div className="profile-section">
                {loading ? (
                    <p>Loading activity...</p>
                ) : activeTab === 'reviews' ? (
                    reviews.length > 0 ? (
                        <div className="activity-list">
                            {reviews.map(review => (
                                <div key={review._id} className="activity-card">
                                    <div className="activity-card-header">
                                        <Link to={`/movies/${review.movie?._id}`}>
                                            <h3>{review.movie?.title || "Unknown Movie"}</h3>
                                        </Link>
                                    </div>
                                    <div className="activity-rating">
                                        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                                    </div>
                                    <p>"{review.reviewText}"</p>
                                    <div className="activity-votes">
                                        <span>▲ {review.upvotes?.length || 0}</span>
                                        <span>▼ {review.downvotes?.length || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#aaa', marginTop: '15px' }}>
                            No reviews posted yet.
                        </p>
                    )
                ) : (
                    discussions.length > 0 ? (
                        <div className="activity-list">
                            {discussions.map(disc => (
                                <div key={disc._id} className="activity-card">
                                    <div className="activity-card-header">
                                        <Link to={`/discussions/${disc._id}`}>
                                            <h3>{disc.title}</h3>
                                        </Link>
                                        <span className={`tag ${disc.isAMA ? 'ama' : 'thread'}`}>
                                            {disc.isAMA ? 'AMA' : 'Thread'}
                                        </span>
                                    </div>
                                    <p className="disc-movie-sub">Movie: {disc.movie?.title || "Unknown"}</p>
                                    <p className="disc-preview">{disc.content.substring(0, 150)}{disc.content.length > 150 ? "..." : ""}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#aaa', marginTop: '15px' }}>
                            No discussion threads created yet.
                        </p>
                    )
                )}
            </div>
        </div>
    );
}

export default Profile;