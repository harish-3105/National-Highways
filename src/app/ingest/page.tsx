'use client';

import React, { useState } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { DatasetType } from '@/lib/ingestion/parser';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Database,
  ArrowRight,
  Loader2,
} from 'lucide-react';

const DATASETS: { type: DatasetType; label: string; description: string; countHint: string }[] = [
  {
    type: 'HIGHWAYS_MASTER',
    label: '1. Master Highway Corridors Catalog',
    description: 'Level 1 Ground-Truth Highways (Road code, length, lane distribution, chainages)',
    countHint: 'Primary catalog table (public.highways)',
  },
  {
    type: 'HIGHWAY_SUB_CHAINAGES',
    label: '2. Sub-Chainages Breakdown (Level 2 Micro-Lanes & Traffic PCU)',
    description: 'Level 2 Stretch-level lane geometry, traffic PCU, DPR proposals & pavement data',
    countHint: 'Detailed stretch breakdown table (public.highway_sub_chainages)',
  },
  {
    type: 'DLP_CONTRACTS',
    label: '3. Defect Liability Period (DLP) & Maintenance Contracts',
    description: 'Warranty maintenance contracts, contractors, DLP expiry dates & sub-contracts',
    countHint: 'Warranty maintenance table (public.dlp_contracts)',
  },
  {
    type: 'HIGHWAY_MILESTONES',
    label: '4. Highway Milestones & Chainage Points',
    description: 'Point-level chainage locations, physical milestone markers & landmarks',
    countHint: 'Chainage points table (public.highway_chainages)',
  },
  {
    type: 'ACCIDENT_BLACKSPOTS',
    label: '5. Highway Safety & Accident Blackspots',
    description: 'Blackspot identification, safety ratings, accident metrics & rectification status',
    countHint: 'Safety analysis table (public.accident_blackspots)',
  },
  {
    type: 'LEGAL_CASES',
    label: '6. Legal Cases & Court Proceedings Catalog',
    description: 'High Court & District Court litigation, counter-affidavits & converted petitions',
    countHint: 'Legal cases table (public.legal_cases)',
  },
];

export default function IngestPage() {
  const [selectedDataset, setSelectedDataset] = useState<DatasetType>('HIGHWAYS_MASTER');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    insertedCount?: number;
    totalRows?: number;
    errors?: string[];
    preview?: any[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(25);
      setResult(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('datasetType', selectedDataset);

      setUploadProgress(50);
      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();
      setUploadProgress(100);

      if (res.ok && data.success) {
        setResult({
          success: true,
          insertedCount: data.insertedCount,
          totalRows: data.totalRows,
          preview: data.preview,
        });
        setFile(null);
      } else {
        setResult({
          success: false,
          message: data.message || 'Ingestion failed.',
          errors: data.errors || [],
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'An unexpected error occurred during file upload.',
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const currentDatasetInfo = DATASETS.find((d) => d.type === selectedDataset);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <NavigationHeader />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md text-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
                Automated Departmental Excel / CSV Ingestion Engine
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Multi-sheet ground truth parser with automated Indian chainage normalization & batch PostgreSQL ingestion
              </p>
            </div>
          </div>
        </div>

        {/* Upload Form Card */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Step 1: Select Target Dataset */}
          <div className="space-y-2">
            <label className="block font-bold text-xs uppercase text-slate-700 dark:text-slate-300 tracking-wider">
              Step 1: Select Target PostgreSQL Dataset Table
            </label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value as DatasetType)}
              className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {DATASETS.map((d) => (
                <option key={d.type} value={d.type}>
                  {d.label}
                </option>
              ))}
            </select>
            {currentDatasetInfo && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-100 dark:border-blue-900">
                📌 <strong>Target:</strong> {currentDatasetInfo.description} ({currentDatasetInfo.countHint})
              </p>
            )}
          </div>

          {/* Step 2: Drag & Drop Dropzone */}
          <div className="space-y-2">
            <label className="block font-bold text-xs uppercase text-slate-700 dark:text-slate-300 tracking-wider">
              Step 2: Attach Excel Sheet (.xlsx, .xls) or CSV File
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 scale-[1.01]'
                  : file
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {file ? (
                <div className="space-y-2">
                  <FileText className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Size: {(file.size / 1024).toFixed(1)} KB &bull; Type: {file.type || 'Excel/CSV Document'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    Drag and drop your Excel or CSV file here, or click to browse
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Supports Official Tamil Nadu Highways Master Sheets (.xlsx, .xls, .csv)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <div className="flex justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                <span>Parsing & Batch Ingesting to Supabase...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Form Action Button */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={!file || isUploading}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer ${
                !file || isUploading
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating & Batch Inserting into Supabase...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Start Automated Ingestion Pipeline</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Banner */}
        {result && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {result.success ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-base text-emerald-900 dark:text-emerald-200">
                      Ingestion Pipeline Completed Successfully!
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                      Inserted {result.insertedCount} records out of {result.totalRows} parsed rows into PostgreSQL database.
                    </p>
                  </div>
                </div>

                {result.preview && result.preview.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Sample Processed Records (First 5 Rows):
                    </p>
                    <pre className="p-4 bg-slate-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
                      {JSON.stringify(result.preview, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-base text-red-900 dark:text-red-200">
                      Ingestion Failed
                    </h3>
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium">{result.message}</p>
                  </div>
                </div>

                {result.errors && result.errors.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-400 font-mono space-y-1 bg-red-100/50 dark:bg-red-950 p-3 rounded-xl border border-red-200 dark:border-red-900">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
