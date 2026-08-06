import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../core/api/client'
import { Highway, UserRole } from '../../types'
import { Plus, Edit, Trash2, RefreshCw, Upload } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../core/context/AuthContext'
import { HighwayBulkUpload } from './HighwayBulkUpload'

const HighwaysList = () => {
  const [highways, setHighways] = useState<Highway[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    loadHighways()
  }, [])

  const loadHighways = async () => {
    try {
      setLoading(true)
      const storedHighways: Highway[] = JSON.parse(localStorage.getItem('user_highways') || '[]')
      const response = await apiClient.getHighways({ search })
      
      let fetchedHighways: Highway[] = []
      if (response.success && response.data && response.data.length > 0) {
        fetchedHighways = response.data
      }

      const combinedMap = new Map<string, Highway>()
      storedHighways.forEach((h) => combinedMap.set(h.roadCode, h))
      fetchedHighways.forEach((h) => combinedMap.set(h.roadCode, h))

      const combinedList = Array.from(combinedMap.values()).filter((h) =>
        search ? h.roadCode.toLowerCase().includes(search.toLowerCase()) || h.roadName.toLowerCase().includes(search.toLowerCase()) : true
      )

      setHighways(combinedList)
    } catch (error) {
      const storedHighways: Highway[] = JSON.parse(localStorage.getItem('user_highways') || '[]')
      setHighways(storedHighways)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this highway?')) return

    try {
      const response = await apiClient.deleteHighway(id)

      if (response?.success) {
        toast.success(response.message || 'Highway deleted successfully')
        await loadHighways()
      } else {
        const stored: Highway[] = JSON.parse(localStorage.getItem('user_highways') || '[]')
        const updated = stored.filter((h) => h.id !== id)
        localStorage.setItem('user_highways', JSON.stringify(updated))
        toast.success('Highway deleted successfully')
        loadHighways()
      }
    } catch (error: any) {
      const stored: Highway[] = JSON.parse(localStorage.getItem('user_highways') || '[]')
      const updated = stored.filter((h) => h.id !== id)
      localStorage.setItem('user_highways', JSON.stringify(updated))
      toast.success('Highway deleted successfully')
      loadHighways()
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1>Highways Management & Inventory</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => loadHighways()}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={16} /> Refresh
          </button>

          {user?.role === UserRole.ADMIN && (
            <>
              <button
                onClick={() => setShowBulkUpload(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <Upload size={16} /> Bulk Upload (.xlsx / .csv)
              </button>

              <button
                onClick={() => navigate('/highways/new')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Add Highway
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search highways by code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '0.6rem 1rem',
            width: '320px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.9rem',
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading highways...</div>
      ) : highways.length > 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Road Code</th>
                <th style={{ padding: '0.85rem 1rem' }}>Road Name / Section</th>
                <th style={{ padding: '0.85rem 1rem' }}>Chainage</th>
                <th style={{ padding: '0.85rem 1rem' }}>Length</th>
                <th style={{ padding: '0.85rem 1rem' }}>Configuration</th>
                <th style={{ padding: '0.85rem 1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {highways.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#1e3a8a' }}>{item.roadCode}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>{item.roadName}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{item.fromChainage || '0 km'} to {item.toChainage || '0 km'}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{item.lengthKm} km</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      {item.configuration}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => navigate(`/highways/${item.id}`)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2563eb' }}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', borderRadius: '12px' }}>
          No highways found in inventory. Upload `NH LENGTH & LANE 09.06.2026.xlsx` via Bulk Upload or Ingestion Engine!
        </div>
      )}

      {showBulkUpload && (
        <HighwayBulkUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            loadHighways()
            setShowBulkUpload(false)
          }}
        />
      )}
    </div>
  )
}
export default HighwaysList
