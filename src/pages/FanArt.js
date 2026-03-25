import { useEffect, useState, useRef } from "react";
import { fetchApprovedFanArt, uploadFanArt, fetchMovies, deleteFanArt } from "../api/client";
import "./FanArt.css";

function FanArt() {
    const [fanArts, setFanArts] = useState([]);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Upload state
    const [showUpload, setShowUpload] = useState(false);
    const [title, setTitle] = useState("");
    const [selectedMovie, setSelectedMovie] = useState("");
    const [imageBase64, setImageBase64] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");

    const fileInputRef = useRef(null);
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const loadData = async () => {
        setLoading(true);
        try {
            const [artData, movieData] = await Promise.all([
                fetchApprovedFanArt(),
                fetchMovies()
            ]);
            setFanArts(artData);
            setMovies(movieData);
        } catch (err) {
            setError("Failed to load fan art data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setImageBase64("");
            return;
        }

        // Convert file to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setImageBase64(reader.result);
        };
        reader.onerror = () => {
            alert("Error reading file.");
            setImageBase64("");
        };
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploadMessage("");

        if (!title.trim() || !selectedMovie || !imageBase64) {
            alert("Please fill in all fields and select an image.");
            return;
        }

        setSubmitting(true);
        try {
            if (!token) throw new Error("Please log in to upload fan art.");

            const payload = {
                title,
                movieId: selectedMovie,
                imageData: imageBase64
            };

            const response = await uploadFanArt(payload, token);
            setUploadMessage("Success! Your fan art has been posted.");

            // Instantly append it to the grid so the user feels immediate satisfaction
            if (response.fanArt) {
                // Populate the nested movie object so the title renders correctly right away
                const matchedMovie = movies.find(m => m._id === selectedMovie);
                const completeArt = {
                    ...response.fanArt,
                    movie: matchedMovie ? { _id: matchedMovie._id, title: matchedMovie.title } : selectedMovie,
                    user: { username: JSON.parse(localStorage.getItem('user'))?.username || 'You' }
                };
                setFanArts(prev => [completeArt, ...prev]);
            }

            // Reset form
            setTitle("");
            setSelectedMovie("");
            setImageBase64("");
            if (fileInputRef.current) fileInputRef.current.value = "";

            // Close form after a short delay
            setTimeout(() => {
                setShowUpload(false);
                setUploadMessage("");
            }, 3000);

        } catch (err) {
            setUploadMessage(err.message || "Failed to upload.");
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to get movie title from our fetched state list if the populate failed
    const getMovieTitle = (art) => {
        if (art.movie && art.movie.title) return art.movie.title;
        const localMovie = movies.find(m => m._id === art.movie);
        return localMovie ? localMovie.title : "Unknown Movie";
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete your fan art?")) return;
        try {
            await deleteFanArt(id, token);
            setFanArts(fanArts.filter(art => art._id !== id));
        } catch (err) {
            alert(err.message || "Failed to delete fan art.");
        }
    };

    return (
        <div className="fanart">
            <div className="fanart-header">
                <h1 className="page-title">Fan Art Gallery</h1>
                <button className="upload-btn" onClick={() => setShowUpload(!showUpload)}>
                    {showUpload ? "Cancel" : "Submit Fan Art"}
                </button>
            </div>

            {showUpload && (
                <form className="upload-form" onSubmit={handleUpload}>
                    <h3>Submit Your Artwork</h3>
                    {uploadMessage && (
                        <p className={uploadMessage.includes("Success") ? "success-text" : "error-text"}>
                            {uploadMessage}
                        </p>
                    )}

                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Artwork Title"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Related Movie</label>
                        <select
                            value={selectedMovie}
                            onChange={e => setSelectedMovie(e.target.value)}
                            required
                        >
                            <option value="">-- Select a Movie --</option>
                            {movies.map(m => (
                                <option key={m._id} value={m._id}>{m.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Upload Image (.jpg, .png)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            required
                        />
                    </div>

                    {imageBase64 && (
                        <div className="image-preview">
                            <img src={imageBase64} alt="Preview" />
                        </div>
                    )}

                    <button type="submit" disabled={submitting}>
                        {submitting ? "Uploading..." : "Submit Fan Art"}
                    </button>
                </form>
            )}

            {loading ? (
                <h2 style={{ padding: "20px" }}>Loading gallery...</h2>
            ) : error ? (
                <h2 style={{ padding: "20px" }}>{error}</h2>
            ) : (
                <div className="fanart-grid">
                    {fanArts.map((art) => (
                        <div key={art._id} className="fanart-card">
                            <img src={art.imageData} alt={art.title} />
                            <div className="fanart-overlay">
                                <span className="art-title">{art.title}</span><br />
                                <span className="art-movie">{getMovieTitle(art)}</span>
                                <span className="art-author">by {art.user?.username || 'Unknown'}</span>
                                {user && art.user?._id === user.id && (
                                    <button 
                                        className="fanart-delete-btn" 
                                        onClick={() => handleDelete(art._id)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {fanArts.length === 0 && (
                        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#aaa" }}>
                            No approved fan art yet. Be the first to submit!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default FanArt;
