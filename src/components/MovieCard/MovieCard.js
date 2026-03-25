import { Link } from "react-router-dom";
import "./MovieCard.css";

function MovieCard({ movie }) {
    return (
        <Link to={`/movies/${movie.id}`} className="movie-card">
            <div className="poster-wrapper">
                <img
                    src={movie.poster}
                    alt={movie.title}
                    className="movie-poster"
                />
            </div>
        </Link>
    );
}

export default MovieCard;
