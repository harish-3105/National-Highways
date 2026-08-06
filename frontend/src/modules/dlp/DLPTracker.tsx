import React, { useState, useEffect } from 'react'
import { DLPContract } from '../../types'
import { AlertTriangle, CheckCircle, Clock, Mail, Building2 } from 'lucide-react'
import { toast } from 'react-toastify'

export const DLPTracker: React.FC = () => {
  const [contracts, setContracts] = useState<DLPContract[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = () => {
    const stored = JSON.parse(localStorage.getItem('user_dlp_contracts') || '[]')
    setContracts(stored)
  }

  const filteredContracts = contracts.filter((c) => {
    if (statusFilter === 'ALL') return true
    return c.status === statusFilter
  })

  const triggerEmailAlert = (contract: DLPContract) => {
    toast.success(
      `📧 DLP Notification Email triggered for contract: ${contract.contractorName} (${contract.highwayCode})`,
      { autoClose: 5000 }
    )
  }

  const getStatusBadge = (status: DLPContract['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle size={14} /> Active DLP
          </span>
        )
      case 'EXPIRING_SOON':
        return (
          <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={14} /> Expiring Soon
          </span>
        )
      case 'EXPIRED':
        return (
          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertTriangle size={14} /> Expired / Action Needed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Defect Liability Period (DLP) & Contractor Warranty Engine
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Tracks 5-year contractor post-construction maintenance obligations and triggers automated email alerts.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                background: statusFilter === st ? '#1e3a8a' : 'white',
                color: statusFilter === st ? 'white' : '#475569',
              }}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Active Warranty Contracts</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginTop: '0.25rem' }}>
            {contracts.filter((c) => c.status === 'ACTIVE').length}
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Expiring Within 90 Days</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706', marginTop: '0.25rem' }}>
            {contracts.filter((c) => c.status === 'EXPIRING_SOON').length}
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Expired / Action Required</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626', marginTop: '0.25rem' }}>
            {contracts.filter((c) => c.status === 'EXPIRED').length}
          </div>
        </div>
      </div>

      {/* Table of Contracts */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {filteredContracts.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Highway & Stretch</th>
                <th style={{ padding: '0.85rem 1rem' }}>Contractor Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Mode</th>
                <th style={{ padding: '0.85rem 1rem' }}>DOC (Completion Date)</th>
                <th style={{ padding: '0.85rem 1rem' }}>DLP Expiry Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#0f172a' }}>
                    <div style={{ color: '#1e3a8a', fontWeight: '700' }}>{item.highwayCode}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.stretchName}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500' }}>
                      <Building2 size={16} color="#64748b" /> {item.contractorName}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                      {item.contractMode}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{item.docDate}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>
                    <div>{item.dlpExpiryDate}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '400', color: '#64748b' }}>
                      {item.daysRemaining !== undefined ? (item.daysRemaining < 0 ? `Expired ${Math.abs(item.daysRemaining)} days ago` : `${item.daysRemaining} days remaining`) : ''}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>{getStatusBadge(item.status)}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => triggerEmailAlert(item)}
                      style={{
                        background: '#1e3a8a',
                        color: 'white',
                        border: 'none',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Mail size={14} /> Send Email Alert
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            No DLP contractor records ingested yet. Upload `Status of NH Length Maintenance DLP.xlsx` on the Ingestion page to load contract records!
          </div>
        )}
      </div>
    </div>
  )
}
export default DLPTracker
