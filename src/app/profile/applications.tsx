import { useEffect, useState } from "react";
import Table from "../../components/Table";

export default function JobApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile/applications")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setApplications(data.applications || []);
        } else {
          setError(data.error || "Failed to load applications");
        }
      })
      .catch(() => setError("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: "Job Title", accessor: "jobTitle" },
    { header: "Date Applied", accessor: "appliedAt" },
    { header: "Resume", accessor: "resume" },
    { header: "Cover Letter", accessor: "coverLetter" },
  ];

  const data = applications.map(app => ({
    jobTitle: app.job?.title || "-",
    appliedAt: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-",
    resume: app.resumeUrl ? (
      <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline' }}>View</a>
    ) : "-",
    coverLetter: app.coverLetterUrl ? (
      <a href={app.coverLetterUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline' }}>View</a>
    ) : "-",
  }));

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Job Application History</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "#d32f2f" }}>{error}</div>
      ) : (
        <Table columns={columns} data={data} />
      )}
    </div>
  );
} 