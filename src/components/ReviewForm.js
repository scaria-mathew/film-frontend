import { useState } from "react";
import { Link } from "react-router-dom";
import "./ReviewForm.css";

function StarPicker({ rating, onChange }) {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="star-picker" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`star-icon ${star <= (hovered || rating) ? "filled" : ""}`}
                    onMouseEnter={() => setHovered(star)}
                    onClick={() => onChange(star)}
                    title={`${star} Star${star > 1 ? "s" : ""}`}
                >
                    ★
                </span>
            ))}
            <span className="star-label">{rating} / 5</span>
        </div>
    );
}

function ReviewForm({ movieId, onReviewAdded }) {
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(5);
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reviewText.trim()) return;

        setSubmitting(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("__not_logged_in__");

            await onReviewAdded({
                movieId,
                reviewText,
                rating,
                isSpoiler
            }, token);

            // Reset form
            setReviewText("");
            setRating(5);
            setIsSpoiler(false);
        } catch (err) {
            setError(err.message || "Failed to submit review.");
        } finally {
            setSubmitting(false);
        }
    };

    const token = localStorage.getItem("token");

    return (
        <form className="review-form" onSubmit={handleSubmit}>
            <h3>Leave a Review</h3>
            {error && (
                <p className="error-text">
                    {error === "__not_logged_in__" ? (
                        <>Please <Link to="/login" className="login-link">log in</Link> to leave a review.</>
                    ) : error}
                </p>
            )}
            <div className="form-group">
                <label>Your Rating:</label>
                <StarPicker rating={rating} onChange={setRating} />
            </div>
            <div className="form-group">
                <textarea
                    placeholder="Write your review here..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                />
            </div>
            <div className="form-group checkbox-group">
                <label>
                    <input
                        type="checkbox"
                        checked={isSpoiler}
                        onChange={(e) => setIsSpoiler(e.target.checked)}
                    />
                    Contains Spoilers
                </label>
            </div>
            <button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
            </button>
        </form>
    );
}

export default ReviewForm;
