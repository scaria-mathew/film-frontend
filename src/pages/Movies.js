import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MovieCard from "../components/MovieCard/MovieCard";
import { fetchMovies } from "../api/client";
import "./Movies.css";

function Movies() {
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const searchQuery = params.get("search") || "";

    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadMovies = async () => {
            try {
                const apiMovies = await fetchMovies();
                const normalized = apiMovies.map((movie) => ({
                    ...movie,
                    id: movie._id,
                    poster: movie.posterUrl,
                    year: movie.releaseYear
                }));

                setMovies(normalized);
            } catch (err) {
                setError(err.message || "Failed to load movies.");
            } finally {
                setLoading(false);
            }
        };

        loadMovies();
    }, []);

    if (loading) {
        return (
            <div className="movies">
                <h1 className="page-title">All Movies</h1>
                <p>Loading movies...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="movies">
                <h1 className="page-title">All Movies</h1>
                <p>{error}</p>
            </div>
        );
    }

    const displayedMovies = searchQuery
        ? movies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : movies;

    return (
        <div className="movies">
            <h1 className="page-title">
                {searchQuery ? `Search Results: "${searchQuery}"` : "All Movies"}
            </h1>

            <div className="movie-grid">
                {displayedMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}

                {displayedMovies.length === 0 && (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#aaa', padding: '40px' }}>
                        No movies found matching your search.
                    </p>
                )}
            </div>
        </div>
    );
}

export default Movies;
