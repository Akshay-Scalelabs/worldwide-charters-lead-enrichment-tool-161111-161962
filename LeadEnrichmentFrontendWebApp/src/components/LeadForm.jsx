import React from "react";

// PUBLIC_INTERFACE
export default function LeadForm({ values, onChange, onSubmitEmail, onSubmitPhone, loading }) {
  /** Lead input form with two primary actions:
   * - onSubmitEmail
   * - onSubmitPhone
   * Includes accessible labels and validation hints.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...values, [name]: value });
  };

  return (
    <form className="lead-form" onSubmit={(e) => e.preventDefault()} aria-label="Lead Enrichment Form">
      <div className="form-row">
        <label htmlFor="name">Full Name</label>
        <input id="name" name="name" placeholder="e.g., Jane Doe" value={values.name} onChange={handleChange} required />
      </div>
      <div className="form-row">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" placeholder="e.g., Worldwide Charters" value={values.company} onChange={handleChange} required />
      </div>
      <div className="form-row">
        <label htmlFor="domain">Company Domain (optional)</label>
        <input id="domain" name="domain" placeholder="e.g., worldwidecharters.com" value={values.domain} onChange={handleChange} />
      </div>
      <div className="form-row">
        <label htmlFor="email">Email (optional)</label>
        <input id="email" name="email" type="email" placeholder="e.g., jane@company.com" value={values.email} onChange={handleChange} />
      </div>
      <div className="form-row">
        <label htmlFor="linkedin">LinkedIn URL (optional)</label>
        <input id="linkedin" name="linkedin" type="url" placeholder="e.g., https://www.linkedin.com/in/janedoe" value={values.linkedin} onChange={handleChange} />
      </div>

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={onSubmitEmail}
          disabled={loading || !values.name || !values.company}
          aria-busy={loading ? "true" : "false"}
          aria-disabled={loading ? "true" : "false"}
        >
          {loading ? "Searching Email..." : "Find Email"}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onSubmitPhone}
          disabled={loading || !values.name || !values.company}
          aria-busy={loading ? "true" : "false"}
          aria-disabled={loading ? "true" : "false"}
        >
          {loading ? "Searching Phone..." : "Find Phone Number"}
        </button>
      </div>
    </form>
  );
}
