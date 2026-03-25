import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/client";
import { Eye, EyeOff } from "lucide-react";
import "./Auth.css";

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
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

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match!");
        }

        const missingRequirements = validatePassword(formData.password);
        if (missingRequirements.length > 0) {
            return setError(`Password needs ${missingRequirements.join(', ')}`);
        }

        setLoading(true);
        try {
            const { confirmPassword, ...submitData } = formData;
            const data = await registerUser(submitData);
            alert(data.message);
            navigate("/verify-otp", { state: { email: formData.email } });
        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    // Helper for the Eye Icon Style
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
                <h1 className="auth-title">Register</h1>
                <form className="auth-form" onSubmit={handleRegister}>
                    <input name="username" placeholder="Username" className="auth-input" onChange={handleChange} required />

                    <input name="email" type="email" placeholder="Email" className="auth-input" onChange={handleChange} required />

                    {/* Password Field */}
                    <div style={{ position: 'relative', width: '100%' }}>
                        <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="auth-input"
                            onChange={handleChange}
                            required
                            style={{ paddingRight: '40px' }}
                        />
                        <span onClick={() => setShowPassword(!showPassword)} style={eyeStyle}>
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>

                    {/* Confirm Password Field */}
                    <div style={{ position: 'relative', width: '100%' }}>
                        <input
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            className="auth-input"
                            onChange={handleChange}
                            required
                            style={{ paddingRight: '40px' }}
                        />
                        <span onClick={() => setShowPassword(!showPassword)} style={eyeStyle}>
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>

                    <button className="auth-button" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                    {error && <p className="auth-error">{error}</p>}
                </form>
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;