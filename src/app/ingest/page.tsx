'use client';

import { useState } from 'react';

type DatasetType =
  | 'HIGHWAYS_MASTER'
  | 'DLP_CONTRACTS'
  | 'HIGHWAY_MILESTONES'
  | 'ACCIDENT_BLACKSPOTS'
  | 'LEGAL_CASES';

const DATASET_OPTIONS: { value: DatasetType; label: string; description: string }[] = [
  {
    value: 'HIGHWAYS_MASTER',
    label: 'Highway Master Dataset (NH Length & Lanes)',
    description: 'National highway codes, road names, lengths in km, and lane configurations.',
  },
  {
    value: 'DLP_CONTRACTS',
    label: 'DLP & Maintenance Contracts',
    description: 'Contractor names, STMC/PBMC/EPC modes, DOC completion dates, and expiry dates.',
  },
  {
    value: 'HIGHWAY_MILESTONES',
    label: 'Highway Chainages & Milestones',
    description: 'Linear milestone bar chart, town landmarks, traffic PCU volume, and ROW widths.',
  },
  {
    value: 'ACCIDENT_BLACKSPOTS',
    label: 'Accident Blackspots & Hazards',
    description: 'High-risk accident coordinates (lat/lng), severity ratings, and fatalities.',
  },
  {
    value: 'LEGAL_CASES',
    label: 'Legal Cases & Land Acquisition',
    description: 'Court case tracking numbers, court names, hearing dates, and legal counsel.',
  },
];

export default function IngestPage() {
  const [selectedType, setSelectedType] = useState<DatasetType>('HIGHWAYS_MASTER');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a .xlsx, .xls, or .csv file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('datasetType', selectedType);

      const resp = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await resp.json();

      if (!resp.ok || !data.success) {
        setError(data.message || 'File validation failed.');
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Data Ingestion Engine</h1>
          <p className="text-slate-400 mt-2">
            Upload Excel (<code className="text-cyan-400">.xlsx</code>, <code className="text-cyan-400">.xls</code>) or CSV (<code className="text-cyan-400">.csv</code>) files to validate and populate your Supabase PostgreSQL cloud database.
          </p>
        </div>

        <form onSubmit={handleUpload} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6 shadow-xl">
          {/* Dataset Type Selection Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              1. Select Dataset Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DatasetType)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              {DATASET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-2">
              {DATASET_OPTIONS.find((o) => o.value === selectedType)?.description}
            </p>
          </div>

          {/* File Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              2. Upload File (.xlsx, .xls, .csv)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer bg-slate-900 rounded-lg border border-slate-700"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading || !file}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
              isUploading || !file
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {isUploading ? 'Validating & Inserting into Postgres...' : 'Validate & Upload Data'}
          </button>
        </form>

        {/* Error Feedback */}
        {error && (
          <div className="bg-red-950/80 border border-red-500/50 p-4 rounded-xl text-red-200">
            <h3 className="font-semibold text-red-400">Schema Validation Error</h3>
            <p className="text-sm mt-1">{error}</p>
            {result?.errors && result.errors.length > 0 && (
              <ul className="list-disc list-inside mt-2 text-xs text-red-300 space-y-1">
                {result.errors.map((errStr: string, idx: number) => (
                  <li key={idx}>{errStr}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Success Result & Data Preview */}
        {result && result.success && (
          <div className="bg-emerald-950/60 border border-emerald-500/50 p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-emerald-400 text-lg">Ingestion Successful!</h3>
              <span className="text-xs bg-emerald-900 text-emerald-300 px-3 py-1 rounded-full font-mono">
                {result.insertedCount} rows inserted
              </span>
            </div>
            <p className="text-sm text-emerald-200">{result.message}</p>

            {result.dataPreview && result.dataPreview.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  PostgreSQL Inserted Preview (First 5 Rows):
                </h4>
                <div className="overflow-x-auto bg-slate-950 rounded-lg p-3 text-xs font-mono">
                  <pre className="text-slate-300">{JSON.stringify(result.dataPreview, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
