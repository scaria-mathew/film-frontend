import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { fetchNotifications } from "../../api/client";
import "./Navbar.css";

function Navbar({ isLoggedIn, user, setIsLoggedIn, setUser }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        setUser(null);
        navigate("/");
    };

    // close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // fetch unread notification count when logged in
    useEffect(() => {
        if (!isLoggedIn) return;
        const token = localStorage.getItem("token");
        fetchNotifications(token)
            .then(data => setUnreadCount(Array.isArray(data) ? data.filter(n => !n.read).length : 0))
            .catch(() => {});
    }, [isLoggedIn]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery(""); // Optional: clear on search
        }
    };

    return (
        <nav className="navbar">

            {/* LEFT */}
            <div className="navbar-left">
                <Link to="/" className="logo">
                    <img src="../logo-1.png" className="logo-img" />
                </Link>

                <Link to="/movies" className="nav-link">Movies</Link>
                <Link to="/amas" className="nav-link">AMAs</Link>
                <Link to="/discussions" className="nav-link">Discussions</Link>
                <Link to="/fanart" className="nav-link">Fan Art</Link>
            </div>

            {/* CENTER */}
            <div className="navbar-center">
                <input
                    type="text"
                    placeholder="Search movies (Press Enter)"
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                />
                {isLoggedIn && (
                    <Link to="/inbox" className="inbox-bell" title="Inbox">
                        🔔
                        {unreadCount > 0 && (
                            <span className="inbox-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </Link>
                )}
            </div>

            {/* RIGHT */}
            <div className="navbar-right">
                {!isLoggedIn ? (
                    <>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/register" className="nav-link register-btn">
                            Register
                        </Link>
                    </>
                ) : (
                    <div className="avatar-wrapper" ref={menuRef}>

                        <div
                            className="avatar"
                            onClick={() => setOpen(!open)}
                        >
                            {user?.username?.[0]?.toUpperCase()}
                        </div>

                        {open && (
                            <div className="avatar-dropdown">
                                <button onClick={() => {
                                    navigate("/profile");
                                    setOpen(false);
                                }}>
                                    Profile
                                </button>

                                {user?.role === "Administrator" && (
                                    <button onClick={() => {
                                        navigate("/admin");
                                        setOpen(false);
                                    }}>
                                        ⚙ Admin Dashboard
                                    </button>
                                )}

                                <button onClick={handleLogout}>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;