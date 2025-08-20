import React from "react";

// PUBLIC_INTERFACE
export default function Alert({ type = "info", message, onClose }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type}`} role="status" aria-live="polite">
      <span>{message}</span>
      {onClose ? (
        <button className="alert-close" aria-label="Close alert" onClick={onClose}>
          ×
        </button>
      ) : null}
    </div>
  );
}
