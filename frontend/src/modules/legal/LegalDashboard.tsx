import React, { useState, useEffect } from 'react'
import { LegalCase, Lawyer } from '../../types'
import { Search } from 'lucide-react'

export const LegalDashboard: React.FC = () => {
  const [cases, setCases] = useState<LegalCase[]>([])
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [viewMode, setViewMode] = useState<'CASES' | 'LAWYERS'>('CASES')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const storedCases = JSON.parse(localStorage.getItem('user_legal_cases') || '[]')
    const storedLawyers = JSON.parse(localStorage.getItem('user_lawyers') || '[]')
    setCases(storedCases)
    setLawyers(storedLawyers)
  }, [])

  const filteredCases = cases.filter((c: LegalCase) =>
    c.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.courtName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lawyerName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredLawyers = lawyers.filter((l: Lawyer) =>
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.barCouncilNo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Highway Litigation & Bidirectional Lawyer Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Sub-division case tracking, court hearing schedules, and bidirectional lawyer-to-case workload inspection
          </p>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'white', padding: '0.25rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
          <button
            onClick={() => setViewMode('CASES')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              background: viewMode === 'CASES' ? '#1e3a8a' : 'transparent',
              color: viewMode === 'CASES' ? 'white' : '#64748b',
            }}
          >
            📋 View by Cases
          </button>
          <button
            onClick={() => setViewMode('LAWYERS')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              background: viewMode === 'LAWYERS' ? '#1e3a8a' : 'transparent',
              color: viewMode === 'LAWYERS' ? 'white' : '#64748b',
            }}
          >
            👨‍⚖️ View by Lawyer
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ background: 'white', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder={viewMode === 'CASES' ? "Search cases by case number, title, court, or lawyer name..." : "Search lawyers by name, bar council number, or specialization..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.9rem', color: '#0f172a' }}
        />
      </div>

      {/* CASES VIEW */}
      {viewMode === 'CASES' && (
        filteredCases.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {filteredCases.map((c: LegalCase, idx: number) => (
              <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ background: '#1e3a8a', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                    {c.caseNumber}
                  </span>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                    {c.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem', lineHeight: '1.4' }}>{c.title}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#475569', margin: '0.75rem 0' }}>
                  <div>🏛️ <strong>Court:</strong> {c.courtName}</div>
                  <div>⚖️ <strong>Category:</strong> {c.caseType}</div>
                  <div>👨‍⚖️ <strong>Assigned Counsel:</strong> <span style={{ color: '#1e3a8a', fontWeight: '600' }}>{c.lawyerName || 'Unassigned'}</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            No legal cases recorded. Add cases to track sub-division litigation!
          </div>
        )
      )}

      {/* LAWYERS VIEW */}
      {viewMode === 'LAWYERS' && (
        filteredLawyers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {filteredLawyers.map((lawyer: Lawyer, idx: number) => (
              <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                    {lawyer.barCouncilNo}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>{lawyer.name}</h3>
                <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '600', marginBottom: '0.75rem' }}>{lawyer.specialization}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            No lawyers registered. Add lawyers to track advocate workloads!
          </div>
        )
      )}
    </div>
  )
}
export default LegalDashboard
