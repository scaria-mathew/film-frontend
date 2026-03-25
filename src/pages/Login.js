import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../api/client";
import "./Auth.css";

function Login({ setIsLoggedIn, setUser }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            const data = await loginUser({
                email: formData.email.trim(),
                password: formData.password
            });

            if (data.message && data.message.includes("OTP")) {
                navigate("/verify-otp", { state: { email: formData.email.trim() } });
            } else if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                setIsLoggedIn(true);
                setUser(data.user);
                navigate("/");
            }
        } catch (err) {
            setError(err.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h1 className="auth-title">Login</h1>

                <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="auth-input"
                    />

                    <div className="password-input-wrapper" style={{ marginBottom: 0 }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                            className="auth-input"
                        />
                        <span
                            className="eye-icon"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            )}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="auth-button"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Login"}
                    </button>
                    {error ? <p className="auth-error">{error}</p> : null}
                </form>

                <p className="auth-footer">
                    <Link to="/forgot-password" style={{ display: 'block', marginBottom: '10px' }}>Forgot Password?</Link>
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;