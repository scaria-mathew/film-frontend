import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/client";
import "./Auth.css";

function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            return setError("Please enter your email.");
        }

        setLoading(true);
        try {
            const data = await forgotPassword({ email: email.trim() });
            alert(data.message || "OTP sent to email");

            // On success, redirect to ResetPassword and safely pass the email via router state
            navigate("/reset-password", { state: { email: email.trim() } });
        } catch (err) {
            setError(err.message || "Failed to process request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h1 className="auth-title">Forgot Password</h1>
                <p style={{ textAlign: 'center', marginBottom: '20px', color: '#ccc' }}>
                    Enter your email to receive a password reset OTP.
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Registered Email"
                        className="auth-input"
                    />

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send OTP"}
                    </button>
                    {error ? <p className="auth-error">{error}</p> : null}
                </form>

                <p className="auth-footer">
                    Remember your password? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;
