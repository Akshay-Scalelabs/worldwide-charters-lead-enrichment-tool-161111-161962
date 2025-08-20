import React from "react";

// PUBLIC_INTERFACE
export default function ResultsPanel({ result }) {
  /** Display enrichment result data. Accepts a normalized result object or null. */
  if (!result) {
    return (
      <section className="results" aria-live="polite" aria-atomic="true">
        <p className="muted">Results will appear here.</p>
      </section>
    );
  }

  const items = Object.entries(result).filter(([_, v]) => v !== undefined && v !== null && v !== "");

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <section className="results" aria-live="polite" aria-atomic="true">
      <h2>Enrichment Results</h2>
      {items.length === 0 ? (
        <p>No data found. Try adjusting inputs.</p>
      ) : (
        <ul className="results-list">
          {items.map(([key, value]) => (
            <li key={key}>
              <span className="key">{formatKey(key)}</span>
              <span className="value">{String(value)}</span>
              <button className="btn btn-small" onClick={() => copyToClipboard(String(value))} aria-label={`Copy ${key}`}>
                Copy
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatKey(k) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
