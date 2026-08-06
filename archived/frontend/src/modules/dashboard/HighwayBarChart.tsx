import { useEffect, useRef, useState } from 'react'
import { Highway as HighwayType } from '../../types'

interface HighwayBarChartProps {
  highways: HighwayType[]
}

interface ChartData {
  parentHighway: string
  sections: {
    id: number
    code: string
    name: string
    fromChainage: number
    toChainage: number
    length: number
    color: string
    height: number
    status: string
    configuration: string
  }[]
  totalLength: number
  coverage: number
}

const HighwayBarChart = ({ highways }: HighwayBarChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [selectedHighway, setSelectedHighway] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const configurationColors: Record<string, string> = {
    TWO_LANE: '#10b981',
    TWO_LANE_PAVED_SHOULDER: '#06b6d4',
    FOUR_LANE: '#f59e0b',
    FOUR_LANE_PAVED_SHOULDER: '#f97316',
    SIX_LANE: '#dc2626',
    SIX_LANE_PAVED_SHOULDER: '#be123c',
    EIGHT_LANE: '#7c3aed'
  }

  const configurationHeights: Record<string, number> = {
    TWO_LANE: 35,
    TWO_LANE_PAVED_SHOULDER: 45,
    FOUR_LANE: 55,
    FOUR_LANE_PAVED_SHOULDER: 65,
    SIX_LANE: 75,
    SIX_LANE_PAVED_SHOULDER: 85,
    EIGHT_LANE: 95
  }

  const statusColors: Record<string, string> = {
    ACTIVE: '#16a34a',
    UNDER_CONSTRUCTION: '#f59e0b',
    PLANNED: '#3b82f6',
    INACTIVE: '#64748b'
  }

  useEffect(() => {
    console.log('HighwayBarChart: Received highways:', highways)
    console.log('HighwayBarChart: Total highways:', highways.length)
    
    // Group sections by parent highway
    const grouped = new Map<string, any>()

    highways.forEach(highway => {
      console.log('Processing highway:', highway.roadCode, 'parentHighwayId:', highway.parentHighwayId)
      
      if (highway.parentHighwayId) {
        // This is a section
        const parent = highways.find(h => h.id === highway.parentHighwayId)
        const parentCode = parent?.roadCode || 'Unknown'

        if (!grouped.has(parentCode)) {
          grouped.set(parentCode, {
            parentHighway: parentCode,
            parentLength: parent?.lengthKm || 0,
            parentFrom: parseFloat(parent?.fromChainage?.replace(/[^0-9.]/g, '') || '0'),
            parentTo: parseFloat(parent?.toChainage?.replace(/[^0-9.]/g, '') || '0'),
            sections: []
          })
        }

        const fromKm = parseFloat(highway.fromChainage?.replace(/[^0-9.]/g, '') || '0')
        const toKm = parseFloat(highway.toChainage?.replace(/[^0-9.]/g, '') || '0')

        grouped.get(parentCode).sections.push({
          id: highway.id,
          code: highway.roadCode,
          name: highway.roadName,
          fromChainage: fromKm,
          toChainage: toKm,
          length: highway.lengthKm,
          color: configurationColors[highway.configuration] || '#3b82f6',
          height: configurationHeights[highway.configuration] || 30,
          status: highway.status,
          configuration: highway.configuration
        })
      }
    })

    console.log('HighwayBarChart: Grouped data:', Array.from(grouped.entries()))

    // Calculate coverage and sort sections
    const data: ChartData[] = Array.from(grouped.values()).map(group => {
      const sections = group.sections.sort((a: any, b: any) => a.fromChainage - b.fromChainage)
      const totalSectionLength = sections.reduce((sum: number, s: any) => sum + s.length, 0)
      const coverage = group.parentLength > 0 ? (totalSectionLength / group.parentLength) * 100 : 0

      return {
        parentHighway: group.parentHighway,
        sections,
        totalLength: group.parentLength,
        coverage
      }
    })

    console.log('HighwayBarChart: Final chart data:', data)
    setChartData(data.sort((a, b) => a.parentHighway.localeCompare(b.parentHighway)))
  }, [highways])

  const handlePrint = () => {
    window.print()
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleExportCSV = () => {
    let csvContent = "Highway,Section Code,Section Name,From (km),To (km),Length (km),Configuration,Status\n"
    
    chartData.forEach(data => {
      data.sections.forEach(section => {
        csvContent += `${data.parentHighway},${section.code},${section.name},${section.fromChainage},${section.toChainage},${section.length},${section.configuration},${section.status}\n`
      })
    })

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `highway-sections-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatConfiguration = (config: string) => {
    if (!config) return 'Unknown'
    return config
      .replace('TWO_LANE_PAVED_SHOULDER', '2L+PS')
      .replace('TWO_LANE', '2L')
      .replace('FOUR_LANE_PAVED_SHOULDER', '4L+PS')
      .replace('FOUR_LANE', '4L')
      .replace('SIX_LANE_PAVED_SHOULDER', '6L+PS')
      .replace('SIX_LANE', '6L')
      .replace('EIGHT_LANE', '8L')
  }

  if (!highways || highways.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p>No highway data available to display</p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p>No highway sections available to display</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', position: 'relative' }}>
      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'white',
          zIndex: 9999,
          overflow: 'auto',
          padding: '2rem'
        }}>
          {/* Fullscreen Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem',
            position: 'sticky',
            top: 0,
            background: 'white',
            zIndex: 10000,
            padding: '1rem 0',
            borderBottom: '2px solid #e2e8f0'
          }}>
            <div>
              <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '2rem', fontWeight: 700 }}>
                Highway Coverage Report - Fullscreen View
              </h2>
              <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '1rem' }}>
                Scroll horizontally to view all highways
              </p>
            </div>
            
            <button
              onClick={toggleFullscreen}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#dc2626',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ✕ Exit Fullscreen
            </button>
          </div>

          {/* Fullscreen Chart Container with Horizontal Scroll */}
          <div style={{ 
            overflowX: 'auto', 
            overflowY: 'visible',
            paddingBottom: '2rem'
          }}>
            <div style={{ minWidth: `${chartData.length * 800}px` }}>
              {chartData.map((data, index) => (
                <div
                  key={data.parentHighway}
                  style={{
                    marginBottom: index < chartData.length - 1 ? '3rem' : 0,
                    pageBreakInside: 'avoid',
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Highway Header */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '2rem', fontWeight: 700 }}>
                      {data.parentHighway}
                    </h3>
                    <p style={{ margin: '0.75rem 0 0 0', fontSize: '1.25rem', color: '#64748b', fontWeight: 500 }}>
                      {data.sections.length} sections • Total length: {Number(data.totalLength || 0).toFixed(2)} km • 
                      <span style={{
                        marginLeft: '1rem',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '9999px',
                        background: data.coverage >= 90 ? '#d1fae5' : data.coverage >= 70 ? '#fef3c7' : '#fee2e2',
                        color: data.coverage >= 90 ? '#065f46' : data.coverage >= 70 ? '#92400e' : '#991b1b',
                        fontSize: '1.25rem',
                        fontWeight: 700
                      }}>
                        {Number(data.coverage || 0).toFixed(1)}% Coverage
                      </span>
                    </p>
                  </div>

                  {/* Bar Chart - Larger */}
                  <div style={{ position: 'relative', height: '300px', background: '#f8fafc', borderRadius: '12px', overflow: 'visible', padding: '30px 0' }}>
                    {/* Chainage scale */}
                    <div style={{ position: 'absolute', top: '250px', left: 0, right: 0, height: '40px', display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
                      {(() => {
                        const parent = highways.find(h => h.roadCode === data.parentHighway)
                        const parentFrom = parseFloat(parent?.fromChainage?.replace(/[^0-9.]/g, '') || '0')
                        const parentTo = parseFloat(parent?.toChainage?.replace(/[^0-9.]/g, '') || '0')
                        const range = parentTo - parentFrom
                        const steps = 10
                        return Array.from({ length: steps }, (_, i) => {
                          const km = parentFrom + (range * i / (steps - 1))
                          return (
                            <div key={i} style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-25px', width: '3px', height: '12px', background: '#94a3b8', top: '-12px' }} />
                              <span style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: '600' }}>
                                {km.toFixed(0)} km
                              </span>
                            </div>
                          )
                        })
                      })()}
                    </div>

                    {/* Baseline reference line */}
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '3px', background: '#cbd5e1', transform: 'translateY(-50%)' }} />

                    {/* Single continuous bar container */}
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: '200px', display: 'flex', alignItems: 'center' }}>
                      {data.sections && data.sections.length > 0 && data.sections.map((section, sIdx) => {
                        const parent = highways.find(h => h.roadCode === data.parentHighway)
                        const parentFrom = parseFloat(parent?.fromChainage?.replace(/[^0-9.]/g, '') || '0')
                        const parentTo = parseFloat(parent?.toChainage?.replace(/[^0-9.]/g, '') || '0')
                        const parentRange = parentTo - parentFrom || 1
                        
                        const widthPercent = ((section.toChainage - section.fromChainage) / parentRange) * 100
                        const heightMultiplier = 2 // Double height in fullscreen

                        return (
                          <div
                            key={section.id}
                            title={`${section.code || ''}\n${section.name || ''}\nChainage: ${Number(section.fromChainage || 0).toFixed(3)} - ${Number(section.toChainage || 0).toFixed(3)} km\nLength: ${Number(section.length || 0).toFixed(2)} km\nConfig: ${formatConfiguration(section.configuration)}\nStatus: ${(section.status || '').replace('_', ' ')}`}
                            style={{
                              width: `${widthPercent}%`,
                              height: `${(section.height || 55) * heightMultiplier}px`,
                              background: '#1e3a8a',
                              borderRight: sIdx < data.sections.length - 1 ? '4px solid white' : 'none',
                              borderLeft: sIdx === 0 ? '3px solid #1e3a8a' : 'none',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'visible',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scaleY(1.1)'
                              e.currentTarget.style.zIndex = '10'
                              e.currentTarget.style.background = '#3b82f6'
                              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.5)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scaleY(1)'
                              e.currentTarget.style.zIndex = '1'
                              e.currentTarget.style.background = '#1e3a8a'
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                            }}
                          >
                            {/* Height indicator label at top */}
                            {widthPercent > 3 && (
                              <span style={{
                                position: 'absolute',
                                top: `-${(section.height || 55) * heightMultiplier / 2 + 35}px`,
                                color: '#1e3a8a',
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                whiteSpace: 'nowrap'
                              }}>
                                {formatConfiguration(section.configuration)}
                              </span>
                            )}
                            
                            {/* Length label inside bar */}
                            {widthPercent > 2 && (
                              <span style={{
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                                whiteSpace: 'nowrap'
                              }}>
                                {Number(section.length || 0).toFixed(1)}km
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header with controls - Hidden in print */}
      <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.5rem', fontWeight: 700 }}>
            Highway Coverage Report
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Visual representation of section coverage across highways
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={toggleFullscreen}
            style={{
              padding: '0.5rem 1rem',
              background: '#7c3aed',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'white'
            }}
          >
            🔍 Fullscreen View
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              padding: '0.5rem 1rem',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#475569'
            }}
          >
            {showDetails ? '📊 Hide Details' : '📋 Show Details'}
          </button>
          
          <button
            onClick={handleExportCSV}
            style={{
              padding: '0.5rem 1rem',
              background: '#16a34a',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'white'
            }}
          >
            📥 Export CSV
          </button>
          
          <button
            onClick={handlePrint}
            style={{
              padding: '0.5rem 1rem',
              background: '#1e3a8a',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'white'
            }}
          >
            🖨️ Print / PDF
          </button>
        </div>
      </div>

      {/* Print header - Only visible in print */}
      <div className="print-only" style={{ display: 'none', marginBottom: '2rem', textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.75rem' }}>Highway Coverage Report</h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>Generated on {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
      </div>

      {/* Chart Container */}
      <div ref={chartRef} style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
        {chartData.map((data, index) => (
          <div
            key={data.parentHighway}
            style={{
              marginBottom: index < chartData.length - 1 ? '2rem' : 0,
              pageBreakInside: 'avoid'
            }}
          >
            {/* Highway Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                cursor: 'pointer',
                padding: '0.75rem',
                background: selectedHighway === data.parentHighway ? '#f0f9ff' : 'transparent',
                borderRadius: '6px',
                transition: 'background 0.2s'
              }}
              onClick={() => setSelectedHighway(selectedHighway === data.parentHighway ? null : data.parentHighway)}
            >
              <div>
                <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.5rem', fontWeight: 700 }}>
                  {data.parentHighway}
                </h3>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>
                  {data.sections.length} sections • Total length: {Number(data.totalLength || 0).toFixed(2)} km
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  background: data.coverage >= 90 ? '#d1fae5' : data.coverage >= 70 ? '#fef3c7' : '#fee2e2',
                  color: data.coverage >= 90 ? '#065f46' : data.coverage >= 70 ? '#92400e' : '#991b1b',
                  fontSize: '1.125rem',
                  fontWeight: 700
                }}>
                  {Number(data.coverage || 0).toFixed(1)}% Coverage
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div style={{ position: 'relative', height: '180px', background: '#f8fafc', borderRadius: '8px', overflow: 'visible', marginBottom: showDetails ? '2rem' : '1rem', padding: '20px 0' }}>
              {/* Chainage scale */}
              <div style={{ position: 'absolute', top: '140px', left: 0, right: 0, height: '30px', display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
                {(() => {
                  const parent = highways.find(h => h.roadCode === data.parentHighway)
                  const parentFrom = parseFloat(parent?.fromChainage?.replace(/[^0-9.]/g, '') || '0')
                  const parentTo = parseFloat(parent?.toChainage?.replace(/[^0-9.]/g, '') || '0')
                  const range = parentTo - parentFrom
                  const steps = 5
                  return Array.from({ length: steps }, (_, i) => {
                    const km = parentFrom + (range * i / (steps - 1))
                    return (
                      <div key={i} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-20px', width: '2px', height: '8px', background: '#94a3b8', top: '-8px' }} />
                        <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: '600' }}>
                          {km.toFixed(0)} km
                        </span>
                      </div>
                    )
                  })
                })()}
              </div>

              {/* Baseline reference line */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '2px', background: '#cbd5e1', transform: 'translateY(-50%)' }} />

              {/* Single continuous bar container */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: '110px', display: 'flex', alignItems: 'center' }}>
                {data.sections && data.sections.length > 0 && data.sections.map((section, sIdx) => {
                  const parent = highways.find(h => h.roadCode === data.parentHighway)
                  const parentFrom = parseFloat(parent?.fromChainage?.replace(/[^0-9.]/g, '') || '0')
                  const parentTo = parseFloat(parent?.toChainage?.replace(/[^0-9.]/g, '') || '0')
                  const parentRange = parentTo - parentFrom || 1
                  
                  const widthPercent = ((section.toChainage - section.fromChainage) / parentRange) * 100

                  return (
                    <div
                      key={section.id}
                      title={`${section.code || ''}\n${section.name || ''}\nChainage: ${Number(section.fromChainage || 0).toFixed(3)} - ${Number(section.toChainage || 0).toFixed(3)} km\nLength: ${Number(section.length || 0).toFixed(2)} km\nConfig: ${formatConfiguration(section.configuration)}\nStatus: ${(section.status || '').replace('_', ' ')}`}
                      style={{
                        width: `${widthPercent}%`,
                        height: `${section.height || 55}px`,
                        background: '#1e3a8a',
                        borderRight: sIdx < data.sections.length - 1 ? '3px solid white' : 'none',
                        borderLeft: sIdx === 0 ? '2px solid #1e3a8a' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'visible',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scaleY(1.2)'
                        e.currentTarget.style.zIndex = '10'
                        e.currentTarget.style.background = '#3b82f6'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scaleY(1)'
                        e.currentTarget.style.zIndex = '1'
                        e.currentTarget.style.background = '#1e3a8a'
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* Height indicator label at top */}
                      {widthPercent > 5 && (
                        <span style={{
                          position: 'absolute',
                          top: '-28px',
                          color: '#1e3a8a',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          whiteSpace: 'nowrap'
                        }}>
                          {formatConfiguration(section.configuration)}
                        </span>
                      )}
                      
                      {/* Length label inside bar */}
                      {widthPercent > 4 && (
                        <span style={{
                          color: 'white',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                          whiteSpace: 'nowrap'
                        }}>
                          {Number(section.length || 0).toFixed(1)}km
                        </span>
                      )}
                    </div>
                  )
                })}
                
                {/* Fill remaining space with gray if coverage is not 100% */}
                {(() => {
                  const totalCoveredPercent = data.sections.reduce((sum, section) => {
                    const parent = highways.find(h => h.roadCode === data.parentHighway)
                    const parentFrom = parseFloat(parent?.fromChainage?.replace(/[^0-9.]/g, '') || '0')
                    const parentTo = parseFloat(parent?.toChainage?.replace(/[^0-9.]/g, '') || '0')
                    const parentRange = parentTo - parentFrom || 1
                    return sum + ((section.toChainage - section.fromChainage) / parentRange) * 100
                  }, 0)
                  
                  const remainingPercent = 100 - totalCoveredPercent
                  
                  if (remainingPercent > 0.1) {
                    return (
                      <div
                        title={`Uncovered: ${remainingPercent.toFixed(1)}%`}
                        style={{
                          width: `${remainingPercent}%`,
                          height: '15px',
                          background: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 10px, #cbd5e1 10px, #cbd5e1 20px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px dashed #94a3b8'
                        }}
                      >
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '600' }}>
                          GAP
                        </span>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            </div>

            {/* Details Table */}
            {showDetails && (
              <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Section</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Name</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>From (km)</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>To (km)</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Length (km)</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Config</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sections.map((section, sIdx) => (
                      <tr key={section.id} style={{ borderBottom: '1px solid #f1f5f9', background: sIdx % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '0.75rem', color: '#1e3a8a', fontWeight: 600 }}>{section.code || ''}</td>
                        <td style={{ padding: '0.75rem', color: '#334155' }}>{section.name || ''}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>{Number(section.fromChainage || 0).toFixed(3)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>{Number(section.toChainage || 0).toFixed(3)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#1e3a8a' }}>{Number(section.length || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              background: section.color || '#3b82f6',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            {formatConfiguration(section.configuration)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              background: statusColors[section.status] || '#64748b',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            {(section.status || '').replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f8fafc', fontWeight: 600, borderTop: '2px solid #e2e8f0' }}>
                      <td colSpan={4} style={{ padding: '0.75rem', color: '#1e3a8a' }}>Total</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#1e3a8a' }}>
                        {Number(data.sections.reduce((sum, s) => sum + (Number(s.length) || 0), 0)).toFixed(2)} km
                      </td>
                      <td colSpan={2} style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>
                        {data.sections.length} sections
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend - Print friendly */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1e3a8a', fontSize: '1rem', fontWeight: 600 }}>Configuration Legend (Height Representation)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {Object.entries(configurationHeights).map(([config, height]) => (
            <div key={config} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '60px', 
                height: `${height}px`, 
                background: '#1e3a8a', 
                borderRadius: '2px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '0.6rem', color: 'white', fontWeight: '600' }}>{height}px</span>
              </div>
              <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: '500' }}>{formatConfiguration(config)}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
            <strong>Note:</strong> Bar height represents road configuration width (2-Lane = 20px, 4-Lane = 30px, 6-Lane = 40px, 8-Lane = 50px). 
            Paved shoulder configurations have +5px additional height.
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}

export default HighwayBarChart
