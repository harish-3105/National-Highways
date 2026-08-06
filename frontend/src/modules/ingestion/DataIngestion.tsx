import React, { useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'react-toastify'
import { parseNHLengthWorkbook, parseDLPWorkbook, parseBarChartWorkbook, ExcelParseResult } from '../../core/services/excelParser'

export const DataIngestion: React.FC = () => {
  const [ingestionType, setIngestionType] = useState<'LENGTH_LANE' | 'DLP_MAINTENANCE' | 'BAR_CHART'>('LENGTH_LANE')
  const [ingestMode, setIngestMode] = useState<'ROLLING_APPEND' | 'OVERWRITE'>('ROLLING_APPEND')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setParseResult(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an Excel (.xlsx) or CSV file first.')
      return
    }

    setIsUploading(true)
    setParseResult(null)

    try {
      let res: ExcelParseResult

      if (ingestionType === 'LENGTH_LANE') {
        res = await parseNHLengthWorkbook(selectedFile)
      } else if (ingestionType === 'DLP_MAINTENANCE') {
        res = await parseDLPWorkbook(selectedFile)
      } else {
        res = await parseBarChartWorkbook(selectedFile)
      }

      setParseResult(res)

      if (res.success) {
        toast.success(res.message || 'File parsed and ingested successfully!')

        // Store ingested records into localStorage for instant dynamic rendering across pages
        if (res.dlpContracts.length > 0) {
          const existing = JSON.parse(localStorage.getItem('user_dlp_contracts') || '[]')
          const updated = ingestMode === 'OVERWRITE' ? res.dlpContracts : [...existing, ...res.dlpContracts]
          localStorage.setItem('user_dlp_contracts', JSON.stringify(updated))
        }

        if (res.chainages.length > 0) {
          const existing = JSON.parse(localStorage.getItem('user_chainages') || '[]')
          const updated = ingestMode === 'OVERWRITE' ? res.chainages : [...existing, ...res.chainages]
          localStorage.setItem('user_chainages', JSON.stringify(updated))
        }

        if (res.highways.length > 0) {
          const existing = JSON.parse(localStorage.getItem('user_highways') || '[]')
          const updated = ingestMode === 'OVERWRITE' ? res.highways : [...existing, ...res.highways]
          localStorage.setItem('user_highways', JSON.stringify(updated))
        }
      } else {
        toast.error('Failed to ingest file. Check format and try again.')
      }
    } catch (err: any) {
      toast.error(`Ingestion error: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          Multi-Format Excel & Rolling CSV Ingestion Engine
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Bulk import historical and continuous rolling data directly from official NHAI Excel workbooks (.xlsx / .csv)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Panel: Upload Configuration */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet size={18} color="#2563eb" /> 1. Select Target Dataset Type & Ingestion Strategy
          </h3>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
              Workbook / Schema Type
            </label>
            <select
              value={ingestionType}
              onChange={(e: any) => setIngestionType(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="LENGTH_LANE">NH Length & Lane Inventory</option>
              <option value="DLP_MAINTENANCE">Status of NH Maintenance & DLP Contracts</option>
              <option value="BAR_CHART">Linear Highway Chainage Bar Chart</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
              Data Ingestion Strategy
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="mode"
                  value="ROLLING_APPEND"
                  checked={ingestMode === 'ROLLING_APPEND'}
                  onChange={() => setIngestMode('ROLLING_APPEND')}
                />
                <strong>Rolling Time-Series Append</strong>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="mode"
                  value="OVERWRITE"
                  checked={ingestMode === 'OVERWRITE'}
                  onChange={() => setIngestMode('OVERWRITE')}
                />
                <strong>Full Overwrite</strong>
              </label>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              background: '#f8fafc',
              marginBottom: '1.25rem',
              cursor: 'pointer',
            }}
          >
            <Upload size={36} color="#3b82f6" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>
              {selectedFile ? selectedFile.name : 'Select Excel (.xlsx) or CSV file to ingest'}
            </div>
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              style={{ marginTop: '1rem', fontSize: '0.85rem' }}
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: isUploading ? '#94a3b8' : '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {isUploading ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />}
            {isUploading ? 'Parsing & Ingesting Dataset...' : 'Start Real Ingestion Pipeline'}
          </button>
        </div>

        {/* Right Panel: Live Ingestion Audit Log */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
            📊 Ingestion Execution Log
          </h3>

          {parseResult ? (
            <div style={{ background: parseResult.success ? '#f0fdf4' : '#fef2f2', padding: '1.25rem', borderRadius: '10px', border: `1px solid ${parseResult.success ? '#bbf7d0' : '#fecaca'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: parseResult.success ? '#15803d' : '#b91c1c', fontWeight: '700', marginBottom: '0.75rem' }}>
                {parseResult.success ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                {parseResult.message}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#334155' }}>
                <div><strong>Highways Extracted:</strong> {parseResult.highways.length}</div>
                <div><strong>DLP Contracts Extracted:</strong> {parseResult.dlpContracts.length}</div>
                <div><strong>Chainage Milestones Extracted:</strong> {parseResult.chainages.length}</div>
                {parseResult.errors.length > 0 && (
                  <div style={{ color: '#dc2626', marginTop: '0.5rem' }}>
                    <strong>Errors Encountered:</strong>
                    <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                      {parseResult.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0' }}>
              Upload your official Excel file and click "Start Real Ingestion Pipeline".
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default DataIngestion
