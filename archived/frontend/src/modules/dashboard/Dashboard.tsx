import { useEffect, useState } from 'react'
import { useAuth } from '../../core/context/AuthContext'
import { apiClient } from '../../core/api/client'
import { Map, Route as RouteIcon, BarChart3, Clock, AlertOctagon, Gavel, Upload, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DLPContract, AccidentBlackspot, LegalCase } from '../../types'

interface Stats {
  totalHighways: number
  activeHighways: number
  totalUsers: number
  totalLength: number
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({
    totalHighways: 0,
    activeHighways: 0,
    totalUsers: 0,
    totalLength: 0,
  })

  const [dlpContracts, setDlpContracts] = useState<DLPContract[]>([])
  const [blackspots, setBlackspots] = useState<AccidentBlackspot[]>([])
  const [legalCases, setLegalCases] = useState<LegalCase[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const highwaysResponse = await apiClient.getHighways({})
      if (highwaysResponse.success && highwaysResponse.data) {
        const highways = highwaysResponse.data
        const totalLength = highways.reduce((sum: number, h: any) => sum + (h.length_km || 0), 0)
        setStats({
          totalHighways: highways.length,
          activeHighways: highways.filter((h: any) => h.status === 'ACTIVE').length,
          totalUsers: 0,
          totalLength: Math.round(totalLength * 100) / 100,
        })
      }
    } catch (error) {
      console.warn('Backend unavailable, reading local state.')
    }

    const storedDlp = JSON.parse(localStorage.getItem('user_dlp_contracts') || '[]')
    const storedBlackspots = JSON.parse(localStorage.getItem('user_blackspots') || '[]')
    const storedCases = JSON.parse(localStorage.getItem('user_legal_cases') || '[]')

    setDlpContracts(storedDlp)
    setBlackspots(storedBlackspots)
    setLegalCases(storedCases)
  }

  const activeDlpCount = dlpContracts.filter((c) => c.status === 'ACTIVE').length
  const expiringDlpCount = dlpContracts.filter((c) => c.status === 'EXPIRING_SOON').length
  const expiredDlpCount = dlpContracts.filter((c) => c.status === 'EXPIRED').length

  const totalBlackspots = blackspots.length
  const totalFatalities = blackspots.reduce((acc, curr) => acc + (curr.fatalitiesCount || 0), 0)
  const activeLegalCases = legalCases.length

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0369a1 100%)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '1.5rem', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, fontWeight: '600' }}>
              National Highways Authority of India • Central Analytics Portal
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0.4rem 0 0.2rem 0' }}>
              Welcome back, {user?.name}
            </h1>
            <p style={{ opacity: '0.9', fontSize: '0.9rem', margin: 0 }}>
              Jurisdiction: <strong>{user?.officeName}</strong> ({user?.officeCode}) • Role: <strong>{user?.role}</strong>
            </p>
          </div>
          <button
            onClick={() => navigate('/ingestion')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Upload size={18} /> Ingest Excel / CSV
          </button>
        </div>
      </div>

      {/* Core Platform KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div onClick={() => navigate('/highways')} style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #2563eb', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Monitored Highways</span>
            <RouteIcon size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.4rem' }}>{stats.totalHighways} Stretches</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Total Length: {stats.totalLength} km</div>
        </div>

        <div onClick={() => navigate('/dlp')} style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #d97706', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Contractor DLP Status</span>
            <Clock size={20} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.4rem' }}>
            <span style={{ color: '#16a34a' }}>{activeDlpCount} Active</span> / <span style={{ color: '#dc2626' }}>{expiredDlpCount} Expired</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.2rem' }}>{expiringDlpCount} Expiring within 90 days</div>
        </div>

        <div onClick={() => navigate('/blackspots')} style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #dc2626', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Accident Blackspots</span>
            <AlertOctagon size={20} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#dc2626', marginTop: '0.4rem' }}>{totalBlackspots} Critical Points</div>
          <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '0.2rem' }}>{totalFatalities} Recorded Fatalities</div>
        </div>

        <div onClick={() => navigate('/legal')} style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #7c3aed', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Sub-Division Litigation</span>
            <Gavel size={20} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '0.4rem' }}>{activeLegalCases} Active Cases</div>
          <div style={{ fontSize: '0.75rem', color: '#7c3aed', marginTop: '0.2rem' }}>High Court / NGT / Arbitration</div>
        </div>
      </div>

      {/* Feature Modules Quick Access Grid */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' }}>
        🚀 Core Platform Features & Operations
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <div onClick={() => navigate('/map')} style={{ background: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: '#eff6ff', padding: '0.6rem', borderRadius: '10px', color: '#2563eb' }}><Map size={24} /></div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Interactive GIS Map</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Leaflet • PostGIS Geometries</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', lineHeight: '1.5' }}>
            Visualize 2-lane, 4-lane, and 6-lane routes on interactive maps with real-time hover kilometer chainages and gap detection overlays.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#2563eb', fontWeight: '600' }}>
            Open GIS Map <ArrowRight size={16} />
          </div>
        </div>

        <div onClick={() => navigate('/bar-chart')} style={{ background: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: '#f0f9ff', padding: '0.6rem', borderRadius: '10px', color: '#0284c7' }}><BarChart3 size={24} /></div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Chainage Bar Chart</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>TN-NH-Bar Chart Integration</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', lineHeight: '1.5' }}>
            Inspect milestone-by-milestone landmark grid, traffic volume (PCU), right-of-way width, and active maintenance contracts.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#0284c7', fontWeight: '600' }}>
            View Bar Chart <ArrowRight size={16} />
          </div>
        </div>

        <div onClick={() => navigate('/dlp')} style={{ background: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: '#fffbeb', padding: '0.6rem', borderRadius: '10px', color: '#d97706' }}><Clock size={24} /></div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>DLP Warranty Engine</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>5-Year Contractor Obligations</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', lineHeight: '1.5' }}>
            Track contractor warranty completion dates, monitor expiring road stretches, and send automated email alerts.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#d97706', fontWeight: '600' }}>
            Manage DLP Contracts <ArrowRight size={16} />
          </div>
        </div>

        <div onClick={() => navigate('/blackspots')} style={{ background: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: '#fef2f2', padding: '0.6rem', borderRadius: '10px', color: '#dc2626' }}><AlertOctagon size={24} /></div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Blackspot Safety Analytics</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Casualty & Severity Index</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', lineHeight: '1.5' }}>
            Identify high-risk accident points along highway stretches with monthly/yearly temporal filters and weather condition analysis.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#dc2626', fontWeight: '600' }}>
            View Safety Analytics <ArrowRight size={16} />
          </div>
        </div>

        <div onClick={() => navigate('/legal')} style={{ background: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: '#faf5ff', padding: '0.6rem', borderRadius: '10px', color: '#7c3aed' }}><Gavel size={24} /></div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Legal Case & Lawyer Dashboard</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Bidirectional Case-Lawyer Views</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', lineHeight: '1.5' }}>
            Track sub-division land acquisition disputes, environmental claims, court hearing dates, and lawyer workload assignments.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#7c3aed', fontWeight: '600' }}>
            Open Legal Dashboard <ArrowRight size={16} />
          </div>
        </div>

        <div onClick={() => navigate('/ingestion')} style={{ background: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: '#f0fdf4', padding: '0.6rem', borderRadius: '10px', color: '#16a34a' }}><Upload size={24} /></div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Excel & CSV Data Engine</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Bulk & Rolling Ingestion</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', lineHeight: '1.5' }}>
            Bulk upload official NHAI Excel workbooks (`NH LENGTH & LANE`, `Status of NH Maintenance DLP`, `TN-NH-Bar chart`) with schema validation.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: '600' }}>
            Upload Workbooks <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
