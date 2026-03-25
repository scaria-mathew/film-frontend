import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar/Navbar";

import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import Discussions from "./pages/Discussions";
import FanArt from "./pages/FanArt";
import AMAs from "./pages/AMAs";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import DiscussionDetail from "./pages/DiscussionDetail";
import Inbox from "./pages/Inbox";

// --- ADD THIS IMPORT ---
import VerifyOTP from "./pages/VerifyOTP";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");

    // Safety check: only parse if userJson is a valid string
    if (token && userJson && userJson !== "undefined") {
      try {
        setUser(JSON.parse(userJson));
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Failed to parse user from storage", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <Router>
      <Navbar
        isLoggedIn={isLoggedIn}
        user={user}
        setIsLoggedIn={setIsLoggedIn}
        setUser={setUser}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/discussions" element={<Discussions />} />
        <Route path="/amas" element={<AMAs />} />
        <Route path="/discussions/:id" element={<DiscussionDetail />} />
        <Route path="/fanart" element={<FanArt />} />

        <Route
          path="/login"
          element={
            <Login
              setIsLoggedIn={setIsLoggedIn}
              setUser={setUser}
            />
          }
        />

        <Route
          path="/register"
          element={
            <Register
              setIsLoggedIn={setIsLoggedIn}
              setUser={setUser}
            />
          }
        />

        {/* --- ADD THIS ROUTE --- */}
        <Route
          path="/verify-otp"
          element={
            <VerifyOTP
              setIsLoggedIn={setIsLoggedIn}
              setUser={setUser}
            />
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/inbox" element={<Inbox />} />
      </Routes>
    </Router>
  );
}

export default App;