import React, { useState, useEffect } from 'react'
import { HighwayChainage } from '../../types'
import { Car, MapPin, Search, Layers, Ruler } from 'lucide-react'

export const HighwayBarChart: React.FC = () => {
  const [chainages, setChainages] = useState<HighwayChainage[]>([])
  const [selectedHighway, setSelectedHighway] = useState<string>('NH-38')
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    loadChainageData()
  }, [])

  const loadChainageData = () => {
    const stored = JSON.parse(localStorage.getItem('user_chainages') || '[]')
    setChainages(stored)
    if (stored.length > 0 && stored[0].highwayCode) {
      setSelectedHighway(stored[0].highwayCode)
    }
  }

  const availableHighways = Array.from(new Set(chainages.map((c) => c.highwayCode).filter(Boolean)))

  const filteredChainages = chainages.filter(
    (c) =>
      c.highwayCode === selectedHighway &&
      (c.townName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.activeWorkDesc?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const peakPcu = filteredChainages.reduce((max, c) => Math.max(max, c.trafficPcu || 0), 0)

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Highway Linear Chainage & Infrastructure Bar Chart
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Km-by-km milestone grid, traffic PCU, right-of-way width, and active maintenance contracts
          </p>
        </div>

        {/* Highway Select */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {availableHighways.length > 0 ? (
            <select
              value={selectedHighway}
              onChange={(e) => setSelectedHighway(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontWeight: '600',
                color: '#1e3a8a',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              {availableHighways.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
              No highways ingested yet. Ingest `TN-NH-Bar chart.xlsx` on the Ingestion page!
            </span>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Active Highway</span>
            <MapPin size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>{selectedHighway || 'N/A'}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Milestones Loaded: {filteredChainages.length}</div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Peak Traffic Volume</span>
            <Car size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
            {peakPcu > 0 ? `${peakPcu.toLocaleString()} PCU` : 'N/A'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>Passenger Car Units / Day</div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Carriageway Status</span>
            <Layers size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>Dynamic Chainage</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Parsed from Excel</div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder="Filter milestones by town name or contract details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.9rem', color: '#0f172a' }}
        />
      </div>

      {/* Bar Chart Visual Milestone Grid */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Ruler size={18} color="#2563eb" /> Linear Milestone Timeline ({selectedHighway})
        </h3>

        {filteredChainages.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredChainages.map((item, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  background: '#fafafa',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ background: '#1e3a8a', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                    📍 Km {item.chainageKm}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>ROW: {item.rowWidth || 'N/A'}</span>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem' }}>{item.townName || 'Landmark'}</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: '#475569' }}>
                  <div><strong>Carriageway:</strong> {item.carriagewaySpec || 'Standard'}</div>
                  <div><strong>Traffic:</strong> {item.trafficPcu ? `${item.trafficPcu.toLocaleString()} PCU` : 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            No chainage data found for this highway. Upload `TN-NH-Bar chart June 2026.xlsx` on the Ingestion page to load linear milestones!
          </div>
        )}
      </div>
    </div>
  )
}
export default HighwayBarChart
