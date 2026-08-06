import React, { useState, useRef } from 'react'
import Papa from 'papaparse'
import { X, Upload, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { apiClient } from '../../core/api/client'
import { toast } from 'react-toastify'
import { parseNHLengthWorkbook } from '../../core/services/excelParser'

interface BulkUploadModalProps {
  onClose: () => void
  onSuccess: () => void
}

interface BulkUploadError {
  row: number
  highway: string
  error: string
}

interface BulkUploadResult {
  success: boolean
  totalProcessed: number
  successCount: number
  failedCount: number
  errors: BulkUploadError[]
  message: string
}

interface CSVRow {
  [key: string]: string
}

export const HighwayBulkUpload: React.FC<BulkUploadModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<CSVRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const ext = selectedFile.name.toLowerCase()
    if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx')) {
      toast.error('Please select an Excel (.xlsx) or CSV file')
      return
    }

    setFile(selectedFile)
    setUploadResult(null)

    if (ext.endsWith('.xlsx')) {
      try {
        const res = await parseNHLengthWorkbook(selectedFile)
        if (res.success && res.highways.length > 0) {
          setPreviewData(
            res.highways.slice(0, 10).map((h: any) => ({
              'Road Code': h.roadCode,
              'Road Name': h.roadName,
              Length: `${h.lengthKm} km`,
              Config: h.configuration,
            }))
          )
        }
      } catch (err: any) {
        toast.error(`Excel preview error: ${err.message}`)
      }
    } else {
      Papa.parse(selectedFile, {
        header: true,
        preview: 10,
        complete: (results) => {
          setPreviewData(results.data as CSVRow[])
        },
        error: (error) => {
          toast.error(`CSV parsing error: ${error.message}`)
        },
      })
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setUploading(true)
    try {
      const ext = file.name.toLowerCase()
      if (ext.endsWith('.xlsx')) {
        const parseRes = await parseNHLengthWorkbook(file)
        if (parseRes.success) {
          const existing = JSON.parse(localStorage.getItem('user_highways') || '[]')
          const updated = [...existing, ...parseRes.highways]
          localStorage.setItem('user_highways', JSON.stringify(updated))

          const res: BulkUploadResult = {
            success: true,
            totalProcessed: parseRes.highways.length,
            successCount: parseRes.highways.length,
            failedCount: 0,
            errors: [],
            message: `Successfully ingested ${parseRes.highways.length} highways from ${file.name}!`,
          }
          setUploadResult(res)
          toast.success(res.message)
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 2000)
        } else {
          toast.error('Failed to parse Excel file.')
        }
      } else {
        const result = await apiClient.bulkUploadHighways(file)
        setUploadResult(result)
        if (result.success) {
          toast.success(result.message)
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 2000)
        } else {
          toast.warning(result.message)
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const mockEvent = {
        target: { files: [droppedFile] },
      } as any
      handleFileSelect(mockEvent)
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            <Upload size={24} />
            Bulk Upload Highways (.xlsx / .csv)
          </h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div style={styles.content}>
          {/* File Upload Area */}
          {!uploadResult && (
            <div
              style={styles.dropzone}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {file ? (
                <div style={styles.fileInfo}>
                  <FileText size={48} color="#4CAF50" />
                  <p style={styles.fileName}>{file.name}</p>
                  <p style={styles.fileSize}>
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div style={styles.dropzoneContent}>
                  <Upload size={48} color="#666" />
                  <p style={styles.dropzoneText}>
                    Drag & drop Excel (.xlsx) or CSV file here or click to browse
                  </p>
                  <p style={styles.dropzoneHint}>
                    Supported formats: NH LENGTH & LANE.xlsx, CSV
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && !uploadResult && (
            <div style={styles.previewSection}>
              <h3 style={styles.previewTitle}>Preview (First 10 rows)</h3>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {Object.keys(previewData[0]).slice(0, 6).map((header) => (
                        <th key={header} style={styles.th}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).slice(0, 6).map((value: any, colIdx) => (
                          <td key={colIdx} style={styles.td}>{value || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {uploadResult && (
            <div style={styles.resultSection}>
              <div style={{
                ...styles.resultHeader,
                backgroundColor: uploadResult.success ? '#E8F5E9' : '#FFF3E0'
              }}>
                {uploadResult.success ? (
                  <CheckCircle size={32} color="#4CAF50" />
                ) : (
                  <AlertCircle size={32} color="#FF9800" />
                )}
                <h3 style={styles.resultTitle}>{uploadResult.message}</h3>
              </div>

              <div style={styles.stats}>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Total Processed:</span>
                  <span style={styles.statValue}>{uploadResult.totalProcessed}</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Successful:</span>
                  <span style={{ ...styles.statValue, color: '#4CAF50' }}>
                    {uploadResult.successCount}
                  </span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Failed:</span>
                  <span style={{ ...styles.statValue, color: '#F44336' }}>
                    {uploadResult.failedCount}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {!uploadResult && (
          <div style={styles.footer}>
            <button onClick={onClose} style={styles.cancelButton} disabled={uploading}>
              Cancel
            </button>
            <button
              onClick={handleUpload}
              style={{
                ...styles.uploadButton,
                opacity: !file || uploading ? 0.6 : 1,
                cursor: !file || uploading ? 'not-allowed' : 'pointer',
              }}
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <Loader size={16} className="spinner" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload & Process
                </>
              )}
            </button>
          </div>
        )}

        {uploadResult && (
          <div style={styles.footer}>
            <button
              onClick={() => {
                setFile(null)
                setPreviewData([])
                setUploadResult(null)
              }}
              style={styles.uploadButton}
            >
              Upload Another File
            </button>
            <button onClick={onClose} style={styles.cancelButton}>
              Close
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    color: '#666',
  },
  content: {
    padding: '1.5rem',
    overflowY: 'auto',
    flex: 1,
  },
  dropzone: {
    border: '2px dashed #ccc',
    borderRadius: '8px',
    padding: '3rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
    backgroundColor: '#fafafa',
  },
  dropzoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  dropzoneText: {
    fontSize: '1.1rem',
    color: '#666',
    margin: 0,
  },
  dropzoneHint: {
    fontSize: '0.9rem',
    color: '#999',
    margin: 0,
  },
  fileInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  fileName: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    margin: 0,
    color: '#333',
  },
  fileSize: {
    fontSize: '0.9rem',
    color: '#666',
    margin: 0,
  },
  previewSection: {
    marginTop: '1.5rem',
  },
  previewTitle: {
    fontSize: '1.1rem',
    marginBottom: '1rem',
  },
  tableWrapper: {
    overflowX: 'auto',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  th: {
    backgroundColor: '#f5f5f5',
    padding: '0.75rem',
    textAlign: 'left',
    borderBottom: '2px solid #e0e0e0',
    fontWeight: 'bold',
  },
  td: {
    padding: '0.75rem',
    borderBottom: '1px solid #e0e0e0',
  },
  resultSection: {
    marginTop: '1rem',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  resultTitle: {
    margin: 0,
    fontSize: '1.2rem',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '0.5rem',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    padding: '1.5rem',
    borderTop: '1px solid #e0e0e0',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  uploadButton: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#2196F3',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
}
