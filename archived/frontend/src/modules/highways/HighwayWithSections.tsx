import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../../core/api/client'
import { Highway } from '../../types'
import { toast } from 'react-toastify'
import { ArrowLeft, Plus, Edit, Trash2, MapPin, Upload, Download, X } from 'lucide-react'
import { useAuth } from '../../core/context/AuthContext'
import { UserRole } from '../../types'

const formatConfiguration = (config: string | undefined): string => {
  if (!config) return 'N/A'
  return config
    .replace('TWO_LANE_PAVED_SHOULDER', '2L+PS')
    .replace('TWO_LANE', '2L')
    .replace('FOUR_LANE_PAVED_SHOULDER', '4L+PS')
    .replace('FOUR_LANE', '4L')
    .replace('SIX_LANE_PAVED_SHOULDER', '6L+PS')
    .replace('SIX_LANE', '6L')
    .replace('EIGHT_LANE', '8L')
}

const HighwayWithSections = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [highway, setHighway] = useState<Highway | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchHighway()
  }, [id])

  const fetchHighway = async () => {
    try {
      const response = await apiClient.getHighwayWithSections(Number(id))
      const highwayData = response?.data ?? response
      if (highwayData) {
        setHighway(highwayData)
      }
    } catch (error) {
      toast.error('Failed to load highway')
    } finally {
      setLoading(false)
    }
  }

  const deleteSection = async (sectionId: number) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return

    try {
      await apiClient.deleteHighway(sectionId)
      toast.success('Section deleted successfully')
      fetchHighway()
    } catch (error) {
      toast.error('Failed to delete section')
    }
  }

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error('Please select a CSV file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', bulkFile)

      const response = await fetch(`http://localhost:3000/api/highways/${id}/bulk-sections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.data.message)
        setShowBulkModal(false)
        setBulkFile(null)
        fetchHighway()
      } else {
        toast.error(result.message || 'Upload failed')
      }
    } catch (error) {
      toast.error('Failed to upload sections')
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `SI.no,from_chainage,to_chainage,configuration
1,0.000,50.000,4L
2,50.000,100.000,2L+PS
3,100.000,150.000,6L`
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sections_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>

  if (!highway) return <div style={{ padding: '2rem' }}>Highway not found</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <button 
        onClick={() => navigate('/highways')}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#1e3a8a' }}
      >
        <ArrowLeft size={20} />
        Back to Highways
      </button>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>{highway.roadCode} - {highway.roadName}</h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              <MapPin size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              {highway.fromLocation} → {highway.toLocation}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate(`/highways/${highway.id}/edit`)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.75rem 1.5rem', 
                background: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer' 
              }}
            >
              <Edit size={20} />
              Edit Highway Details
            </button>
            
            {highway.isParent && (
              <>
                <button
                  onClick={() => setShowBulkModal(true)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.75rem 1.5rem', 
                    background: '#16a34a', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer' 
                  }}
                >
                  <Upload size={20} />
                  Bulk Upload Sections
                </button>
                <button
                  onClick={() => navigate(`/highways/new?parent=${highway.id}`)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.75rem 1.5rem', 
                    background: '#1e3a8a', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer' 
                  }}
                >
                  <Plus size={20} />
                  Add Section
                </button>
              </>
            )}
          </div>
        </div>

        {!highway.isParent && highway.fromChainage && (
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', color: '#64748b' }}>Chainage</label>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500' }}>
                  {highway.fromChainage} → {highway.toChainage}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', color: '#64748b' }}>Configuration</label>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500' }}>
                  {formatConfiguration(highway.configuration)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {highway.isParent && highway.sections && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
            Highway Sections ({highway.sections.length})
          </h2>

          {highway.sections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <p>No sections added yet. Click "Add Section" to create the first section.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {highway.sections.map((section) => (
                <div 
                  key={section.id}
                  style={{ 
                    padding: '1.5rem', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    background: '#fafafa'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>
                        Section {section.sectionNumber}
                      </h3>
                      <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>
                        {section.fromLocation} → {section.toLocation}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => navigate(`/highways/${section.id}/edit`)}
                        style={{ padding: '0.5rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      {user?.role === UserRole.ADMIN && (
                        <button
                          onClick={() => deleteSection(section.id)}
                          style={{ padding: '0.5rem', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#dc2626' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Chainage</label>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', fontWeight: '500' }}>
                        {section.fromChainage} → {section.toChainage}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Configuration</label>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', fontWeight: '500' }}>
                        {formatConfiguration(section.configuration)}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Status</label>
                      <span style={{ 
                        display: 'inline-block',
                        marginTop: '0.25rem',
                        padding: '0.25rem 0.75rem', 
                        fontSize: '0.75rem',
                        borderRadius: '12px',
                        background: section.status === 'ACTIVE' ? '#dcfce7' : '#fed7aa',
                        color: section.status === 'ACTIVE' ? '#166534' : '#9a3412'
                      }}>
                        {section.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Bulk Upload Sections</h2>
              <button
                onClick={() => {
                  setShowBulkModal(false)
                  setBulkFile(null)
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #3b82f6' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#1e3a8a' }}>CSV Format</h3>
              <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Your CSV file should have these columns:</p>
              <ul style={{ fontSize: '0.875rem', marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                <li><strong>SI.no</strong> - Serial number (optional)</li>
                <li><strong>from_chainage</strong> - Start chainage (e.g., 63.000)</li>
                <li><strong>to_chainage</strong> - End chainage (e.g., 71.000)</li>
                <li><strong>configuration</strong> - Road configuration code</li>
              </ul>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '0.875rem' }}>Valid Configuration Codes:</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  <div>• <strong>2L</strong> - Two Lane</div>
                  <div>• <strong>4L</strong> - Four Lane</div>
                  <div>• <strong>2L+PS</strong> - Two Lane + Paved Shoulder</div>
                  <div>• <strong>4L+PS</strong> - Four Lane + Paved Shoulder</div>
                  <div>• <strong>6L</strong> - Six Lane</div>
                  <div>• <strong>6L+PS</strong> - Six Lane + Paved Shoulder</div>
                </div>
              </div>

              <button
                onClick={downloadTemplate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <Download size={16} />
                Download Template CSV
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
              {bulkFile && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#16a34a' }}>
                  ✓ Selected: {bulkFile.name}
                </p>
              )}
            </div>

            <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '6px', marginBottom: '1.5rem' }}>
              <strong style={{ fontSize: '0.875rem', color: '#92400e' }}>Note:</strong>
              <ul style={{ fontSize: '0.875rem', color: '#92400e', marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                <li>Section geometry will be auto-calculated from parent highway route</li>
                <li>Sections will be numbered sequentially starting from {(highway?.sections?.length || 0) + 1}</li>
                <li>All sections will be created with ACTIVE status</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowBulkModal(false)
                  setBulkFile(null)
                }}
                disabled={uploading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={!bulkFile || uploading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !bulkFile || uploading ? '#cbd5e1' : '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !bulkFile || uploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {uploading ? (
                  <>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload Sections
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HighwayWithSections
