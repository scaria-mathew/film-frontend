import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchDiscussionDetails, addComment, closeDiscussion, deleteDiscussion, deleteComment } from "../api/client";
import DeleteReasonModal from "../components/DeleteReasonModal";
import "./DiscussionDetail.css";

function DiscussionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [discussion, setDiscussion] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [commentText, setCommentText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [commentError, setCommentError] = useState("");
    const [deleteModal, setDeleteModal] = useState(null); // { type: 'thread'|'comment', id? }

    // Auth context (in a real app, use Context API)
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        const loadDetails = async () => {
            try {
                const data = await fetchDiscussionDetails(id);
                setDiscussion(data.discussion);
                setComments(data.comments);
            } catch (err) {
                setError(err.message || "Failed to load thread.");
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [id]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmitting(true);
        setCommentError("");
        try {
            if (!token) {
                setCommentError("__not_logged_in__");
                return;
            }

            const newComment = await addComment(id, { content: commentText }, token);
            // Ensure optimistic reply has a default user string if none returned
            const optimisticComment = {
                ...newComment,
                user: newComment.user || { username: user ? user.username : 'Anonymous', role: user?.role || 'Standard' }
            };
            setComments([...comments, optimisticComment]);
            setCommentText("");
        } catch (err) {
            setCommentError(err.message || "Failed to post reply.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseThread = async () => {
        if (!window.confirm("Are you sure you want to close this discussion?")) return;
        try {
            const res = await closeDiscussion(id, token);
            setDiscussion(res.discussion);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteThread = () => setDeleteModal({ type: 'thread' });
    const handleDeleteComment = (commentId) => setDeleteModal({ type: 'comment', id: commentId });

    const confirmDelete = async (reason) => {
        const modal = deleteModal;
        setDeleteModal(null);
        try {
            if (modal.type === 'thread') {
                await deleteDiscussion(id, token, reason);
                navigate('/discussions');
            } else {
                await deleteComment(modal.id, token, reason);
                setComments(comments.filter(c => c._id !== modal.id));
            }
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <h2 style={{ padding: "20px" }}>Loading thread...</h2>;
    if (error || !discussion) return <h2 style={{ padding: "20px" }}>{error || "Thread not found"}</h2>;

    const isOwner = user && user.id === discussion.user._id;
    const isAdmin = user && user.role === 'Administrator';
    const canClose = !discussion.isClosed && (isOwner || isAdmin);

    return (
        <div className="discussion-detail">
            {deleteModal && (
                <DeleteReasonModal
                    contentLabel={deleteModal.type === 'thread' ? 'this discussion thread' : 'this comment'}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteModal(null)}
                />
            )}
            <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
            <div className={`original-post ${discussion.isAMA ? 'ama-post' : ''}`}>
                <div className="post-header">
                    <h1>
                        {discussion.isAMA && <span className="ama-badge">AMA</span>}
                        {discussion.isSpoiler && <span className="spoiler-badge">Spoiler</span>}
                        {discussion.title}
                    </h1>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {discussion.isClosed && <span className="closed-badge">Closed</span>}
                        {isAdmin && (
                            <button
                                onClick={handleDeleteThread}
                                style={{ background: 'transparent', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}
                                title="Admin Delete Thread"
                            >
                                Delete Thread
                            </button>
                        )}
                    </div>
                </div>

                <div className="post-meta">
                    Started by: <strong>{discussion.user?.username || 'Unknown'}</strong>
                    {discussion.user?.role === 'Verified' && <span className="verified-check">✓</span>}
                    {discussion.user?.role === 'Administrator' && <span className="admin-tag">Admin</span>}
                </div>

                <div className="post-content">
                    <p>{discussion.content}</p>
                </div>

                {canClose && (
                    <button className="close-thread-btn" onClick={handleCloseThread}>
                        Close Discussion
                    </button>
                )}
            </div>

            <div className="comments-section">
                <h2>{comments.length} Comments</h2>

                {!discussion.isClosed ? (
                    <form className="comment-form" onSubmit={handleAddComment}>
                        {commentError && (
                            <p className="comment-error">
                                {commentError === "__not_logged_in__" ? (
                                    <>Please <Link to="/login" className="login-link">log in</Link> to post a reply.</>
                                ) : commentError}
                            </p>
                        )}
                        <textarea
                            placeholder="Write a reply..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={submitting}>
                            {submitting ? "Posting..." : "Post Reply"}
                        </button>
                    </form>
                ) : (
                    <div className="locked-notice">
                        🔒 This discussion has been closed. No new replies can be added.
                    </div>
                )}

                <div className="comments-list">
                    {comments.map((comment, index) => (
                        <div key={comment._id || index} className={`comment-card ${comment.user?.role === 'Verified' ? 'verified-reply' : ''}`}>
                            <div className="comment-header">
                                <strong>{comment.user?.username || 'Unknown'}</strong>
                                {comment.user?.role === 'Verified' && <span className="verified-check">✓</span>}
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDeleteComment(comment._id)}
                                        style={{ marginLeft: 'auto', background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                                        title="Admin Delete Comment"
                                    >
                                        [Delete]
                                    </button>
                                )}
                            </div>
                            <div className="comment-body">
                                <p>{comment.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DiscussionDetail;
