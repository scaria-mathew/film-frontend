import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOTP } from "../api/client"; // Import the helper
import "./Auth.css";

function VerifyOTP({ setIsLoggedIn, setUser }) {
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const handleVerify = async (e) => {
        e.preventDefault(); // Prevent page refresh
        if (!otp) return setError("Please enter the OTP.");

        setError("");
        setLoading(true);

        try {
            // Use the client helper instead of a raw fetch
            const data = await verifyOTP({ email, otp });

            // This only runs if the response was ok (handled by client.js)
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            setIsLoggedIn(true);
            setUser(data.user);
            navigate("/"); // Go to home page
        } catch (err) {
            setError(err.message || "Invalid OTP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h1 className="auth-title">Verify OTP</h1>
                <p style={{ color: 'white', marginBottom: '1rem' }}>Code sent to: {email}</p>

                <form className="auth-form" onSubmit={handleVerify}>
                    <input
                        type="text"
                        placeholder="6-digit Code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="auth-input"
                        maxLength="6"
                    />
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? "Verifying..." : "Verify & Login"}
                    </button>
                    {error ? <p className="auth-error">{error}</p> : null}
                </form>
            </div>
        </div>
    );
}

export default VerifyOTP;