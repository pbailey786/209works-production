'use client';

import React, { useState } from 'react';

const JobsPikrDemo: React.FC = () => {
  const [keywords, setKeywords] = useState('software engineer');
  const [country, setCountry] = useState('US');
  const [location, setLocation] = useState('California');
  const jobTypeOptions = [
    'full-time',
    'part-time',
    'contract',
    'internship',
    'temporary',
    'other',
  ];
  const categoryOptions = [
    'Engineering',
    'Design',
    'Marketing',
    'Sales',
    'Product',
    'Operations',
    'Other',
  ];
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    setJobs([]);
    try {
      const params = new URLSearchParams();
      if (keywords) params.append('q', keywords);
      if (location) params.append('location', location);
      jobTypes.forEach(jt => params.append('jobType', jt));
      categories.forEach(cat => params.append('category', cat));
      const response = await fetch(`/api/jobs/search?${params.toString()}`);
      const data = await response.json();
      if (data.results) {
        setJobs(data.results);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (jobId: string) => {
    if (!isAuthenticated) {
      setShowSignInPrompt(true);
      return;
    }
    setSavedJobIds(prev => [...prev, jobId]);
  };

  const handleSignIn = () => {
    setIsAuthenticated(true);
    setShowSignInPrompt(false);
  };

  return (
    <div
      style={{
        margin: '2rem 0',
        padding: '1rem',
        border: '1px solid #ccc',
        borderRadius: 8,
      }}
    >
      <h2>JobsPikr API Demo</h2>
      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="Keywords"
          style={{ marginRight: 8 }}
        />
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Location (e.g. California)"
          style={{ marginRight: 8 }}
        />
        <span style={{ marginRight: 8 }}>
          <label style={{ fontWeight: 'bold' }}>Job Types:</label>
          {jobTypeOptions.map(jt => (
            <label key={jt} style={{ marginLeft: 4, marginRight: 4 }}>
              <input
                type="checkbox"
                checked={jobTypes.includes(jt)}
                onChange={e => {
                  if (e.target.checked) setJobTypes([...jobTypes, jt]);
                  else setJobTypes(jobTypes.filter(t => t !== jt));
                }}
              />
              {jt}
            </label>
          ))}
        </span>
        <span style={{ marginRight: 8 }}>
          <label style={{ fontWeight: 'bold' }}>Categories:</label>
          {categoryOptions.map(cat => (
            <label key={cat} style={{ marginLeft: 4, marginRight: 4 }}>
              <input
                type="checkbox"
                checked={categories.includes(cat)}
                onChange={e => {
                  if (e.target.checked) setCategories([...categories, cat]);
                  else setCategories(categories.filter(c => c !== cat));
                }}
              />
              {cat}
            </label>
          ))}
        </span>
        <button onClick={fetchJobs} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Jobs'}
        </button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {showSignInPrompt && (
        <div style={{ color: 'blue', marginBottom: 8 }}>
          Please{' '}
          <button
            onClick={handleSignIn}
            style={{
              color: 'blue',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            sign in
          </button>{' '}
          to save jobs.
        </div>
      )}
      <ul>
        {jobs.map((job, idx) => (
          <li key={job.id || idx} style={{ marginBottom: 8 }}>
            <strong>{job.title}</strong> at {job.company} ({job.location})<br />
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              View Job
            </a>
            <br />
            <button
              onClick={() => handleSave(job.id || idx.toString())}
              disabled={savedJobIds.includes(job.id || idx.toString())}
              style={{ marginTop: 4, marginRight: 8 }}
            >
              {savedJobIds.includes(job.id || idx.toString())
                ? 'Saved!'
                : 'Sign in to Save'}
            </button>
          </li>
        ))}
      </ul>
      {jobs.length === 0 && !loading && !error && <div>No jobs found.</div>}
    </div>
  );
};

export default JobsPikrDemo;
