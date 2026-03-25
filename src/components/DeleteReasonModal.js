import { useState } from "react";
import "./DeleteReasonModal.css";

/**
 * DeleteReasonModal
 * Props:
 *   contentLabel  – short description of what's being deleted (e.g. "this review")
 *   onConfirm(reason) – called with the reason string when admin confirms
 *   onCancel          – called when admin cancels
 */
function DeleteReasonModal({ contentLabel = "this content", onConfirm, onCancel }) {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    const handleConfirm = () => {
        if (!reason.trim()) {
            setError("Please provide a reason before proceeding.");
            return;
        }
        onConfirm(reason.trim());
    };

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">Remove {contentLabel}?</h3>
                <p className="modal-subtitle">
                    The user will be notified in their Inbox with the reason you provide.
                </p>
                <textarea
                    className="modal-reason-input"
                    placeholder="Enter reason for removal..."
                    value={reason}
                    onChange={e => { setReason(e.target.value); setError(""); }}
                    rows={4}
                    autoFocus
                />
                {error && <p className="modal-error">{error}</p>}
                <div className="modal-actions">
                    <button className="modal-btn cancel" onClick={onCancel}>Cancel</button>
                    <button className="modal-btn confirm" onClick={handleConfirm}>Confirm Removal</button>
                </div>
            </div>
        </div>
    );
}

export default DeleteReasonModal;
