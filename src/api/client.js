const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
    const fetchOptions = { ...options };

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Server returned non-JSON:", text);
        throw new Error("Server returned invalid response");
    }

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401 && options.headers?.Authorization) {
            // Only treat as session expired for authenticated requests (those with Authorization header)
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            throw new Error("Your session has expired. Please log in again.");
        }
        throw new Error(data.message || data.msg || data.error || "Request failed");
    }

    return data;
}

/* ---------------- AUTH ---------------- */

export async function registerUser(payload) {
    return request("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export async function loginUser(payload) {
    return request("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

// --- ADD THIS NEW FUNCTION ---
export async function verifyOTP(payload) {
    return request("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export async function forgotPassword(payload) {
    return request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export async function resetPassword(payload) {
    return request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}
// -----------------------------

/* ---------------- MOVIES ---------------- */

export async function fetchMovies() {
    return request("/movies");
}

export async function fetchMovieById(id) {
    return request(`/movies/${id}`);
}

/* ---------------- REVIEWS ---------------- */

export async function fetchReviews(movieId) {
    return request(`/reviews/${movieId}`);
}

export async function fetchUserReviews(userId, token) {
    return requestWithAuth(`/reviews/user/${userId}`, null, token, "GET");
}

export async function fetchUserDiscussions(userId, token) {
    return requestWithAuth(`/discussions/user/${userId}`, null, token, "GET");
}

export async function fetchUserFanArt(userId, token) {
    return requestWithAuth(`/fanart/user/${userId}`, null, token, "GET");
}

export async function createReview(payload, token) {
    const options = {
        method: "POST",
        body: JSON.stringify(payload)
    };
    if (token) {
        options.headers = {
            "Authorization": `Bearer ${token}`
        };
    }
    const fetchOptions = { ...options };

    const response = await fetch(`${API_BASE_URL}/reviews`, {
        ...fetchOptions,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || data.msg || data.error || "Request failed");
    }
    return data;
}

export async function voteReview(reviewId, action, token) {
    return requestWithAuth(`/reviews/${reviewId}/vote`, { action }, token, "PUT");
}

export async function deleteReview(reviewId, token, reason = '') {
    return requestWithAuth(`/reviews/${reviewId}`, { reason }, token, "DELETE");
}

/* ---------------- DISCUSSIONS & AMAs ---------------- */

export async function fetchAllDiscussions() {
    return request(`/discussions`);
}

export async function fetchDiscussions(movieId) {
    return request(`/discussions/movie/${movieId}`);
}

export async function fetchAllAMAs() {
    return request(`/discussions/amas/all`);
}

export async function fetchDiscussionDetails(discussionId) {
    return request(`/discussions/${discussionId}`);
}

// Helper to attach authorization token for authenticated POST/PUT
async function requestWithAuth(path, payload, token, method = "POST") {
    const options = {
        method,
        headers: {
            "Authorization": `Bearer ${token}`
        }
    };
    if (payload) {
        options.body = JSON.stringify(payload);
    }
    const fetchOptions = { ...options };

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });
    const data = await response.json();
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            throw new Error("Your session has expired. Please log in again.");
        }
        throw new Error(data.message || data.msg || data.error || "Request failed");
    }
    return data;
}

export async function createDiscussion(payload, token) {
    return requestWithAuth("/discussions", payload, token);
}

export async function addComment(discussionId, payload, token) {
    return requestWithAuth(`/discussions/${discussionId}/comments`, payload, token);
}

export async function closeDiscussion(discussionId, token) {
    return requestWithAuth(`/discussions/${discussionId}/close`, null, token, "PUT");
}

export async function deleteDiscussion(discussionId, token, reason = '') {
    return requestWithAuth(`/discussions/${discussionId}`, { reason }, token, "DELETE");
}

export async function deleteComment(commentId, token, reason = '') {
    return requestWithAuth(`/discussions/comments/${commentId}`, { reason }, token, "DELETE");
}

/* ---------------- FAN ART ---------------- */

export async function fetchApprovedFanArt(movieId = "") {
    const url = movieId ? `/fanart?movieId=${movieId}` : `/fanart`;
    return request(url);
}

export async function fetchPendingFanArt(token) {
    return requestWithAuth(`/fanart/pending`, null, token, "GET");
}

export async function uploadFanArt(payload, token) {
    return requestWithAuth(`/fanart`, payload, token, "POST");
}

export async function moderateFanArt(fanArtId, status, token, reason = '') {
    return requestWithAuth(`/fanart/${fanArtId}/moderate`, { status, reason }, token, "PUT");
}

export async function deleteFanArt(fanArtId, token) {
    return requestWithAuth(`/fanart/${fanArtId}`, null, token, "DELETE");
}

/* ---------------- USER MANAGEMENT (Admin) ---------------- */

export async function fetchAllUsers(token) {
    return requestWithAuth(`/users`, null, token, "GET");
}

export async function promoteUser(userId, token) {
    return requestWithAuth(`/users/${userId}/promote`, null, token, "PUT");
}

export async function demoteUser(userId, token) {
    return requestWithAuth(`/users/${userId}/demote`, null, token, "PUT");
}

export async function adminDeleteUser(userId, token) {
    return requestWithAuth(`/users/${userId}`, null, token, "DELETE");
}

export { API_BASE_URL };

/* ---------------- NOTIFICATIONS ---------------- */

export async function fetchNotifications(token) {
    return requestWithAuth('/notifications', null, token, 'GET');
}

export async function markNotificationRead(id, token) {
    return requestWithAuth(`/notifications/${id}/read`, null, token, 'PUT');
}

export async function markAllNotificationsRead(token) {
    return requestWithAuth('/notifications/read-all', null, token, 'PUT');
}