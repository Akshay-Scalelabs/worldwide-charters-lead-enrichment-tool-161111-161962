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

  const hasNameCompany = Boolean(values.name?.trim()) && Boolean(values.company?.trim());
  const hasDomain = Boolean(values.domain?.trim());
  const hasLinkedIn = isValidLinkedIn(values.linkedin);

  const emailAllowed = hasNameCompany && (hasDomain || hasLinkedIn);
  const phoneAllowed = hasNameCompany && hasLinkedIn;

  return (
    <form className="lead-form" onSubmit={(e) => e.preventDefault()} aria-label="Lead Enrichment Form">
      <div className="form-row">
        <label htmlFor="name">
          Full Name <span aria-hidden="true" style={{ color: '#ff5d5d' }}>*</span>
        </label>
        <input
          id="name"
          name="name"
          placeholder="e.g., Jane Doe"
          value={values.name}
          onChange={handleChange}
          required
          aria-required="true"
        />
      </div>
      <div className="form-row">
        <label htmlFor="company">
          Company <span aria-hidden="true" style={{ color: '#ff5d5d' }}>*</span>
        </label>
        <input
          id="company"
          name="company"
          placeholder="e.g., Acme Inc."
          value={values.company}
          onChange={handleChange}
          required
          aria-required="true"
        />
      </div>
      <div className="form-row">
        <label htmlFor="domain">
          Company Domain
          <span className="muted" style={{ marginLeft: 6 }}>
            (optional for phone; for email: domain or LinkedIn required)
          </span>
        </label>
        <input
          id="domain"
          name="domain"
          placeholder="e.g., acme.com"
          value={values.domain}
          onChange={handleChange}
          aria-describedby="email-req-hint"
        />
      </div>
      <div className="form-row">
        <label htmlFor="email">
          Known Email
          <span className="muted" style={{ marginLeft: 6 }}>(optional; can improve phone accuracy)</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="e.g., jane@company.com"
          value={values.email}
          onChange={handleChange}
        />
      </div>
      <div className="form-row">
        <label htmlFor="linkedin" title="Phone enrichment requires LinkedIn. Email can use Domain or LinkedIn.">
          LinkedIn URL
          <span className="muted" style={{ marginLeft: 6 }}>
            (required for phone; optional for email if domain provided)
          </span>
        </label>
        <input
          id="linkedin"
          name="linkedin"
          type="url"
          placeholder="e.g., https://www.linkedin.com/in/janedoe"
          value={values.linkedin}
          onChange={handleChange}
          aria-describedby="phone-req-hint"
        />
      </div>

      <div id="email-req-hint" className="muted" aria-live="polite">
        Email enrichment: provide Company Domain (recommended). If domain isn’t available, a valid LinkedIn URL can be used instead.
      </div>
      <div id="phone-req-hint" className="muted" aria-live="polite">
        Phone enrichment: LinkedIn URL is mandatory and must be a valid linkedin.com profile URL.
      </div>

      <small className="muted" aria-live="polite">
        Requests are subject to reasonable rate limits. Include Company Domain and/or LinkedIn for best results.
      </small>

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={onSubmitEmail}
          disabled={loading || !emailAllowed}
          aria-busy={loading ? "true" : "false"}
          aria-disabled={loading || !emailAllowed ? "true" : "false"}
          title={!emailAllowed ? "Provide Full Name, Company, and either Company Domain or LinkedIn URL." : "Search for email"}
        >
          {loading ? "Searching Email..." : "Find Email"}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onSubmitPhone}
          disabled={loading || !phoneAllowed}
          aria-busy={loading ? "true" : "false"}
          aria-disabled={loading || !phoneAllowed ? "true" : "false"}
          title={!phoneAllowed ? "Provide Full Name, Company, and a valid LinkedIn URL for phone enrichment." : "Search for phone number"}
        >
          {loading ? "Searching Phone..." : "Find Phone Number"}
        </button>
      </div>
    </form>
  );
}

function isValidLinkedIn(url) {
  if (!url || !String(url).trim()) return false;
  try {
    const u = new URL(url);
    return /(^|\.)linkedin\.com$/i.test(u.hostname);
  } catch {
    return false;
  }
}
