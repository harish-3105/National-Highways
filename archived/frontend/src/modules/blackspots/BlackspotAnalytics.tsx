import React, { useState, useEffect } from 'react'
import { AccidentBlackspot } from '../../types'
import { AlertOctagon } from 'lucide-react'

export const BlackspotAnalytics: React.FC = () => {
  const [spots, setSpots] = useState<AccidentBlackspot[]>([])
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user_blackspots') || '[]')
    setSpots(stored)
  }, [])

  const filteredSpots = spots.filter((spot: AccidentBlackspot) => {
    if (selectedDivision !== 'ALL' && spot.divisionName !== selectedDivision) return false
    if (selectedSeverity !== 'ALL' && spot.severity !== selectedSeverity) return false
    return true
  })

  const totalAccidents = filteredSpots.reduce((acc: number, curr: AccidentBlackspot) => acc + (curr.accidentsCount || 0), 0)
  const totalFatalities = filteredSpots.reduce((acc: number, curr: AccidentBlackspot) => acc + (curr.fatalitiesCount || 0), 0)

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Accident Blackspot & Highway Safety Analytics
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Spatial hotspot monitoring, casualty severity indexing, and temporal trend filters
          </p>
        </div>

        {/* Division & Severity Filters */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#1e3a8a', fontWeight: '600' }}
          >
            <option value="ALL">All Divisions</option>
            <option value="Vellore Division">Vellore Division</option>
            <option value="Madurai Division">Madurai Division</option>
            <option value="Salem Division">Salem Division</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#b91c1c', fontWeight: '600' }}
          >
            <option value="ALL">All Severities</option>
            <option value="FATAL">FATAL Blackspots</option>
            <option value="HIGH">HIGH Severity</option>
            <option value="MEDIUM">MEDIUM Severity</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Identified Blackspots</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginTop: '0.25rem' }}>{filteredSpots.length}</div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #ea580c' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Recorded Accidents</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ea580c', marginTop: '0.25rem' }}>{totalAccidents}</div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #991b1b' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Fatalities</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#991b1b', marginTop: '0.25rem' }}>{totalFatalities}</div>
        </div>
      </div>

      {/* Blackspots Grid */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertOctagon size={18} color="#dc2626" /> Critical Highway Blackspot Locations
        </h3>

        {filteredSpots.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredSpots.map((spot: AccidentBlackspot, idx: number) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #fee2e2',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  background: '#fff5f5',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ background: '#991b1b', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                    {spot.highwayCode} @ Km {spot.chainageKm}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: '700', textTransform: 'uppercase' }}>
                    ⚠️ {spot.severity} SEVERITY
                  </span>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem' }}>{spot.locationName}</h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  Coordinates: {spot.latitude}, {spot.longitude}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'white', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', marginBottom: '0.75rem', border: '1px solid #fed7d7' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Accidents</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ea580c' }}>{spot.accidentsCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Fatalities</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#991b1b' }}>{spot.fatalitiesCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Injuries</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#d97706' }}>{spot.injuriesCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            No accident blackspots recorded. Ingest safety data or add new points!
          </div>
        )}
      </div>
    </div>
  )
}
export default BlackspotAnalytics
