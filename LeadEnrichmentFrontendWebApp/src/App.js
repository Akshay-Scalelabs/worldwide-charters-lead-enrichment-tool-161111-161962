import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import LeadForm from './components/LeadForm';
import ResultsPanel from './components/ResultsPanel';
import Alert from './components/Alert';
import { findEmail, findPhone } from './services/airscaleClient';

// PUBLIC_INTERFACE
function App() {
  /** Worldwide Charters Lead Enrichment single-page app.
   * Provides:
   *  - Branded UI for entering lead details
   *  - Two separate actions: Find Email, Find Phone Number
   *  - Real-time validation, alerts, and results panel
   *  - Accessibility and responsiveness
   */
  const prefersDark = useMemo(
    () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
    []
  );
  const [theme, setTheme] = useState(prefersDark ? 'dark' : 'light');

  const [values, setValues] = useState({
    name: '',
    company: '',
    domain: '',
    email: '',
    linkedin: ''
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: 'info', message: '' });
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const validateBase = () => {
    if (!values.name?.trim() || !values.company?.trim()) {
      setAlert({ type: 'error', message: 'Please provide both Full Name and Company.' });
      return false;
    }
    return true;
  };

  const normalizeResult = (data) => {
    // Normalize common fields; keep unknown fields too
    if (!data || typeof data !== 'object') return null;
    const {
      name,
      company,
      domain,
      email,
      phone,
      phone_number,
      confidence,
      confidence_score,
      source,
      status,
      ...rest
    } = data;

    return {
      name,
      company,
      domain,
      email,
      phone: phone || phone_number,
      confidence: confidence ?? confidence_score,
      source,
      status,
      ...rest
    };
  };

  const handleFindEmail = async () => {
    if (!validateBase()) return;
    setLoading(true);
    setAlert({ type: 'info', message: 'Searching for email...' });
    setResult(null);
    const { name, company, domain, linkedin } = values;
    const res = await findEmail({ name, company, domain, linkedin });
    setLoading(false);
    if (!res.success) {
      setAlert({ type: 'error', message: res.error || 'Failed to fetch email.' });
      return;
    }
    const normalized = normalizeResult(res.data);
    setResult(normalized);
    setAlert({ type: 'success', message: normalized?.email ? 'Email found.' : 'No email found.' });
  };

  const handleFindPhone = async () => {
    if (!validateBase()) return;
    setLoading(true);
    setAlert({ type: 'info', message: 'Searching for phone number...' });
    setResult(null);
    const { name, company, domain, email } = values;
    const res = await findPhone({ name, company, domain, email });
    setLoading(false);
    if (!res.success) {
      setAlert({ type: 'error', message: res.error || 'Failed to fetch phone.' });
      return;
    }
    const normalized = normalizeResult(res.data);
    setResult(normalized);
    setAlert({ type: 'success', message: normalized?.phone ? 'Phone number found.' : 'No phone number found.' });
  };

  return (
    <div className="App">
      <div className="header">
        <div className="container">
          <div className="brand" aria-label="Worldwide Charters Lead Enrichment">
            Worldwide Charters — Lead Enrichment
          </div>
          <p className="subtitle">Single-contact email and phone searches powered by Airscale</p>
        </div>
      </div>

      <main className="container">
        <section className="card" aria-labelledby="form-title">
          <h1 id="form-title" style={{ marginTop: 0 }}>Enrich a Lead</h1>
          <LeadForm
            values={values}
            onChange={setValues}
            onSubmitEmail={handleFindEmail}
            onSubmitPhone={handleFindPhone}
            loading={loading}
          />
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'info', message: '' })} />
          <ResultsPanel result={result} />
        </section>

        <p className="footer">
          For internal Worldwide Charters use only. Not indexed or publicly listed.
          <br />
          Minimal attribution: Built with Scalelabs enrichment — <a href="https://airscale.io" target="_blank" rel="noreferrer">Airscale</a>.
        </p>
      </main>

      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </button>
    </div>
  );
}

export default App;
