// Example React component showing how to use the parse-resume endpoint

import { useState } from 'react';

interface ParsedResumeData {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  experience: {
    totalYears: string | null;
    positions: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
  };
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  industries: string[];
  jobTitles: string[];
}

export function ResumeUploadExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setParsedData(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/parse-resume', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to parse resume');
      }

      if (result.success && result.data) {
        setParsedData(result.data);
        
        // You can now use the parsed data to populate form fields
        console.log('Parsed resume data:', result.data);
        
        // Example: Auto-fill a profile form
        // setProfileForm({
        //   name: result.data.name || '',
        //   email: result.data.email || '',
        //   phone: result.data.phone || '',
        //   location: result.data.location || '',
        //   summary: result.data.summary || '',
        //   skills: result.data.skills,
        // });
      } else {
        setError(result.message || 'Failed to parse resume');
      }
    } catch (err: any) {
      console.error('Resume upload error:', err);
      setError(err.message || 'Failed to upload resume');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="resume-upload" className="block text-sm font-medium text-gray-700">
          Upload Resume
        </label>
        <input
          id="resume-upload"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          onChange={handleFileUpload}
          disabled={isLoading}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50"
        />
        <p className="mt-1 text-sm text-gray-500">
          Supported formats: PDF, DOC, DOCX, TXT (Image parsing coming soon)
        </p>
      </div>

      {isLoading && (
        <div className="text-sm text-gray-600">
          Parsing resume...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {parsedData && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Parsed Resume Data</h3>
          
          {parsedData.name && (
            <p><strong>Name:</strong> {parsedData.name}</p>
          )}
          
          {parsedData.email && (
            <p><strong>Email:</strong> {parsedData.email}</p>
          )}
          
          {parsedData.phone && (
            <p><strong>Phone:</strong> {parsedData.phone}</p>
          )}
          
          {parsedData.location && (
            <p><strong>Location:</strong> {parsedData.location}</p>
          )}
          
          {parsedData.skills.length > 0 && (
            <div className="mt-2">
              <strong>Skills:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {parsedData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {parsedData.experience.totalYears && (
            <p className="mt-2">
              <strong>Years of Experience:</strong> {parsedData.experience.totalYears}
            </p>
          )}
          
          {parsedData.jobTitles.length > 0 && (
            <p className="mt-2">
              <strong>Job Titles:</strong> {parsedData.jobTitles.join(', ')}
            </p>
          )}
          
          {parsedData.industries.length > 0 && (
            <p className="mt-2">
              <strong>Industries:</strong> {parsedData.industries.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}