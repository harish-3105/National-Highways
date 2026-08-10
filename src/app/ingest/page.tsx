'use client';

import { useState } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import {
  UploadCloud,
  Database,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  ArrowRight,
  Layers,
} from 'lucide-react';

type DatasetType =
  | 'HIGHWAYS_MASTER'
  | 'HIGHWAY_SUB_CHAINAGES'
  | 'DLP_CONTRACTS'
  | 'HIGHWAY_MILESTONES'
  | 'ACCIDENT_BLACKSPOTS'
  | 'LEGAL_CASES';

const DATASET_OPTIONS: { value: DatasetType; label: string; description: string }[] = [
  {
    value: 'HIGHWAYS_MASTER',
    label: 'Level 1: Highway Master Catalog (NH Length & Lanes)',
    description: 'National highway codes, road names, total lengths in km, Old/New NH Nos, and multi-lane breakdown.',
  },
  {
    value: 'HIGHWAY_SUB_CHAINAGES',
    label: 'Level 2: Sub-Chainages & Traffic PCU Details',
    description: 'Granular kilometer sub-stretches (From/To Km), lane statuses, traffic PCU volume, and DPR widening statuses.',
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

interface IngestionResultResponse {
  success?: boolean;
  insertedCount?: number;
  message?: string;
  errors?: string[];
  dataPreview?: Record<string, unknown>[];
}

export default function IngestPage() {
  const [selectedType, setSelectedType] = useState<DatasetType>('HIGHWAYS_MASTER');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<IngestionResultResponse | null>(null);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Network error: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <NavigationHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Automated Data Ingestion Engine
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Validate and upload Excel (<code className="text-blue-600 dark:text-blue-400 font-mono font-bold">.xlsx</code>, <code className="text-blue-600 dark:text-blue-400 font-mono font-bold">.xls</code>) or CSV (<code className="text-blue-600 dark:text-blue-400 font-mono font-bold">.csv</code>) datasets to your Supabase PostgreSQL cloud database.
            </p>
          </div>
        </div>

        {/* Upload Form Card */}
        <form
          onSubmit={handleUpload}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm"
        >
          {/* Section 1: Dataset Type Selection */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              1. Select Target Dataset Table
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DatasetType)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              {DATASET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {DATASET_OPTIONS.find((o) => o.value === selectedType)?.description}
            </p>
          </div>

          {/* Section 2: File Dropzone Input */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              2. Select Spreadsheet / Document File (.xlsx, .xls, .csv)
            </label>
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors text-center cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full">
                  <UploadCloud className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({(file.size / 1024).toFixed(1)} KB) &bull; Click to change file
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Click to browse or drag and drop spreadsheet file
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">Supports Microsoft Excel (.xlsx, .xls) and standard CSV (.csv)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isUploading || !file}
            className={`w-full py-3.5 px-6 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 ${
              isUploading || !file
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Validating & Batch Inserting into Supabase...</span>
              </>
            ) : (
              <>
                <span>Validate & Upload Dataset</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Error Feedback Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-5 rounded-2xl text-red-900 dark:text-red-200 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <h3 className="font-bold text-sm text-red-900 dark:text-red-300">Schema Validation Error</h3>
            </div>
            <p className="text-xs font-semibold text-red-700 dark:text-red-300 pl-7">{error}</p>
            {result?.errors && result.errors.length > 0 && (
              <ul className="list-disc list-inside mt-2 text-xs text-red-600 dark:text-red-400 space-y-1 pl-7 font-mono">
                {result.errors.map((errStr: string, idx: number) => (
                  <li key={idx}>{errStr}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Success Result & Data Preview Card */}
        {result && result.success && (
          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-base">Ingestion Successful!</h3>
              </div>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-full font-extrabold font-mono">
                {result.insertedCount} rows inserted
              </span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">{result.message}</p>

            {result.dataPreview && result.dataPreview.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60">
                <h4 className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-400 uppercase tracking-wider">
                  PostgreSQL Inserted Preview (First 5 Rows):
                </h4>
                <div className="overflow-x-auto bg-slate-900 rounded-xl p-3 text-xs font-mono border border-slate-800 shadow-inner">
                  <pre className="text-emerald-300 leading-relaxed">{JSON.stringify(result.dataPreview, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
