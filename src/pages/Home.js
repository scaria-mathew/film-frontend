import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchMovies } from "../api/client";
import MovieCard from "../components/MovieCard/MovieCard";
import "./Home.css";

function Home() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const loadMovies = async () => {
            try {
                const apiMovies = await fetchMovies();

                // Map API data to the format the UI components expect
                const normalized = apiMovies.map(m => ({
                    id: m._id,
                    title: m.title,
                    year: m.releaseYear,
                    poster: m.posterUrl,
                    backdrop: m.backdropUrl || m.posterUrl, // fallback
                    rating: m.rating || 4.5,
                    genres: m.genre || [],
                    isNew: m.releaseYear >= 2024
                }));

                setMovies(normalized);
            } catch (err) {
                console.error("Failed to load home movies");
            } finally {
                setLoading(false);
            }
        };

        loadMovies();
    }, []);

    // Filter featured movies logic: Prioritize Tron Ares, Spider-Verse, and Top Gun
    const featured = movies.filter(m =>
        m.title.includes("Spider-Man: Across") ||
        m.title.includes("Top Gun") ||
        m.title.includes("Tron Ares")
    );

    // Auto-scroll logic for the featured carousel
    useEffect(() => {
        if (featured.length === 0) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % featured.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [featured.length]);

    if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Loading...</div>;

    return (
        <div className="home-container">
            <header className="hero-viewport">
                {/* The sliding track containing all slides */}
                <div
                    className="hero-track"
                    style={{ transform: `translateX(-${current * 100}%)` }}
                >
                    {featured.map((movie) => (
                        <div key={movie.id} className="hero-slide">
                            <img
                                src={movie.backdrop}
                                alt={movie.title}
                                className="hero-backdrop"
                            />
                            <div className="hero-overlay"></div>

                            <div className="hero-content">
                                <span className="badge">Featured Selection</span>
                                <h1 className="hero-title">{movie.title}</h1>
                                <div className="hero-meta">
                                    <span>{movie.year}</span> •
                                    <span>{movie.genres.join(", ")}</span> •
                                    <span className="rating">★ {movie.rating}</span>
                                </div>
                                <div className="hero-btns">
                                    <Link to={`/movies/${movie.id}`} className="btn-main">
                                        View Details
                                    </Link>
                                    <Link to={`/discussions?movie=${movie.id}`} className="btn-outline">
                                        Join Discussion
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hero-dots">
                    {featured.map((_, index) => (
                        <span
                            key={index}
                            className={`dot ${index === current ? "active" : ""}`}
                            onClick={() => setCurrent(index)}
                        ></span>
                    ))}
                </div>
            </header>

            <main className="trending-container">
                <h2 className="section-title">Trending Now</h2>
                <div className="movie-grid">
                    {movies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            </main>
        </div>
    );
}

export default Home;