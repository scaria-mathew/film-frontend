import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { resetPassword } from "../api/client";
import { Eye, EyeOff } from "lucide-react";
import "./Auth.css";

function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const emailFromState = location.state?.email || "";

    const [formData, setFormData] = useState({
        email: emailFromState,
        otp: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validatePassword = (password) => {
        const missing = [];
        if (password.length < 8) missing.push("8 characters");
        if (!/[A-Z]/.test(password)) missing.push("a capital letter");
        if (!/[0-9]/.test(password)) missing.push("a number");
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) missing.push("a special character");
        return missing;
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.email.trim() || !formData.otp.trim()) {
            return setError("Email and OTP are required.");
        }

        if (formData.newPassword !== formData.confirmPassword) {
            return setError("Passwords do not match!");
        }

        const missingRequirements = validatePassword(formData.newPassword);
        if (missingRequirements.length > 0) {
            return setError(`Password needs ${missingRequirements.join(', ')}`);
        }

        setLoading(true);
        try {
            const data = await resetPassword({
                email: formData.email.trim(),
                otp: formData.otp.trim(),
                newPassword: formData.newPassword
            });

            alert(data.message || "Password successfully reset!");
            navigate("/login");
        } catch (err) {
            setError(err.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    const eyeStyle = {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'pointer',
        color: '#888',
        display: 'flex',
        alignItems: 'center'
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h1 className="auth-title">Reset Password</h1>
                <p style={{ textAlign: 'center', marginBottom: '20px', color: '#ccc' }}>
                    Enter the OTP sent to your email and your new password.
                </p>

                <form className="auth-form" onSubmit={handleReset}>
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        className="auth-input"
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="otp"
                        type="text"
                        placeholder="6-Digit OTP"
                        value={formData.otp}
                        className="auth-input"
                        onChange={handleChange}
                        required
                        maxLength={6}
                    />

                    <div style={{ position: 'relative', width: '100%' }}>
                        <input
                            name="newPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
                            value={formData.newPassword}
                            className="auth-input"
                            onChange={handleChange}
                            required
                            style={{ paddingRight: '40px' }}
                        />
                        <span onClick={() => setShowPassword(!showPassword)} style={eyeStyle}>
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>

                    <div style={{ position: 'relative', width: '100%' }}>
                        <input
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm New Password"
                            value={formData.confirmPassword}
                            className="auth-input"
                            onChange={handleChange}
                            required
                            style={{ paddingRight: '40px' }}
                        />
                        <span onClick={() => setShowPassword(!showPassword)} style={eyeStyle}>
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>

                    <button className="auth-button" type="submit" disabled={loading}>
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                    {error && <p className="auth-error">{error}</p>}
                </form>

                <p className="auth-footer">
                    Remembered it? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default ResetPassword;
