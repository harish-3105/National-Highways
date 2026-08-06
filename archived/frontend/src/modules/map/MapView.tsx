import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap, LayersControl } from 'react-leaflet'
import { useState, useEffect } from 'react'
import { apiClient } from '../../core/api/client'
import { useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const { BaseLayer } = LayersControl

// Add custom CSS for distance tooltips
const style = document.createElement('style')
style.textContent = `
  .distance-tooltip {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .distance-tooltip::before {
    display: none !important;
  }
`
document.head.appendChild(style)

const emptyGeojson = {
  type: 'FeatureCollection',
  features: [],
}

// Component to fit map bounds to show all highways or highlighted section
const FitBounds = ({ geojson, highlightId }: { geojson: any; highlightId: string | null }) => {
  const map = useMap()
  
  useEffect(() => {
    if (geojson && geojson.features && geojson.features.length > 0) {
      const bounds = L.latLngBounds([])
      
      // If highlighting a specific section, zoom to it
      if (highlightId) {
        const highlightedFeature = geojson.features.find((f: any) => f.id === parseInt(highlightId))
        if (highlightedFeature && highlightedFeature.geometry && highlightedFeature.geometry.coordinates) {
          highlightedFeature.geometry.coordinates.forEach((coord: number[]) => {
            bounds.extend([coord[1], coord[0]])
          })
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [100, 100] })
            return
          }
        }
      }
      
      // Otherwise, fit all highways
      geojson.features.forEach((feature: any) => {
        if (feature.geometry && feature.geometry.coordinates) {
          if (feature.geometry.type === 'Point') {
            bounds.extend([feature.geometry.coordinates[1], feature.geometry.coordinates[0]])
          } else if (Array.isArray(feature.geometry.coordinates[0])) {
            feature.geometry.coordinates.forEach((coord: number[]) => {
              bounds.extend([coord[1], coord[0]])
            })
          }
        }
        if (feature.startCoord) {
          bounds.extend([feature.startCoord[1], feature.startCoord[0]])
        }
        if (feature.endCoord) {
          bounds.extend([feature.endCoord[1], feature.endCoord[0]])
        }
      })
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [geojson, map, highlightId])
  
  return null
}

// Component to render gaps between sections as dashed lines
const GapOverlay = ({ geojson }: { geojson: any }) => {
  const [gaps, setGaps] = useState<any[]>([])

  useEffect(() => {
    if (!geojson?.features) return

    // Debug: Log first few features to see their structure
    console.log('Sample features:', geojson.features.slice(0, 3).map((f: any) => ({
      id: f.properties?.id,
      roadCode: f.properties?.roadCode,
      parentHighwayId: f.properties?.parentHighwayId,
      isParent: f.properties?.isParent
    })))

    // Group sections by parent highway and also store parent highways
    const sectionsByParent = new Map<number, any[]>()
    const parentHighways = new Map<number, any>()
    
    geojson.features.forEach((feature: any) => {
      const parentId = feature.properties?.parentHighwayId
      const isParent = feature.properties?.isParent
      
      if (parentId && !isParent) {
        // This is a section (has parentHighwayId and isParent is false/null)
        if (!sectionsByParent.has(parentId)) {
          sectionsByParent.set(parentId, [])
        }
        sectionsByParent.get(parentId)!.push(feature)
      } else if (isParent || (!parentId && feature.properties?.id)) {
        // This is a parent highway (isParent is true or no parentHighwayId)
        parentHighways.set(feature.properties.id, feature)
      }
    })

    console.log('Found parent highways:', parentHighways.size)
    console.log('Found sections by parent:', sectionsByParent.size)

    // Find gaps for each parent highway
    const allGaps: any[] = []
    sectionsByParent.forEach((sections, parentId) => {
      const parentHighway = parentHighways.get(parentId)
      
      // Sort sections by fromChainage
      sections.sort((a, b) => {
        const aFrom = parseFloat(a.properties.fromChainage?.replace(/[^0-9.]/g, '') || '0')
        const bFrom = parseFloat(b.properties.fromChainage?.replace(/[^0-9.]/g, '') || '0')
        return aFrom - bFrom
      })

      const parentRoadCode = sections[0]?.properties.roadCode?.split('-')[0] || 'Unknown'
      console.log(`Checking gaps for ${parentRoadCode}, sections:`, sections.length)

      // Check for gap at the beginning (if parent exists)
      if (parentHighway) {
        const parentFromKm = parseFloat(parentHighway.properties.fromChainage?.replace(/[^0-9.]/g, '') || '0')
        const firstSectionFromKm = parseFloat(sections[0].properties.fromChainage?.replace(/[^0-9.]/g, '') || '0')
        
        if (firstSectionFromKm > parentFromKm + 0.01) {
          let gapGeometry = null
          
          try {
            const parentCoords = parentHighway.geometry.coordinates
            const parentToKm = parseFloat(parentHighway.properties.toChainage?.replace(/[^0-9.]/g, '') || '0')
            const parentTotalKm = parentToKm - parentFromKm
            
            if (parentTotalKm > 0 && parentCoords.length > 1) {
              // Calculate cumulative distances
              const distances = [0]
              for (let j = 1; j < parentCoords.length; j++) {
                const p1 = L.latLng(parentCoords[j-1][1], parentCoords[j-1][0])
                const p2 = L.latLng(parentCoords[j][1], parentCoords[j][0])
                distances.push(distances[j-1] + p1.distanceTo(p2))
              }
              const totalDistance = distances[distances.length - 1]
              
              const gapEndKm = firstSectionFromKm - parentFromKm
              const gapEndFraction = gapEndKm / parentTotalKm
              const targetEndDist = gapEndFraction * totalDistance
              
              let endIdx = 0
              for (let j = 0; j < distances.length; j++) {
                if (distances[j] <= targetEndDist) endIdx = j
              }
              
              if (endIdx > 0) {
                gapGeometry = parentCoords.slice(0, endIdx + 1)
              }
              
              console.log(`Gap at beginning extracted: ${parentFromKm} to ${firstSectionFromKm}, ${gapGeometry?.length || 0} points`)
            }
          } catch (e) {
            console.error('Error extracting beginning gap geometry:', e)
          }
          
          if (!gapGeometry || gapGeometry.length < 2) {
            gapGeometry = null
          }

          if (gapGeometry) {
            allGaps.push({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: gapGeometry
              },
              properties: {
                gapFrom: parentFromKm,
                gapTo: firstSectionFromKm,
                parentHighway: parentRoadCode
              }
            })
          }
        }
      }

      // Check for gaps between consecutive sections
      for (let i = 0; i < sections.length - 1; i++) {
        const current = sections[i]
        const next = sections[i + 1]
        
        const currentTo = parseFloat(current.properties.toChainage?.replace(/[^0-9.]/g, '') || '0')
        const nextFrom = parseFloat(next.properties.fromChainage?.replace(/[^0-9.]/g, '') || '0')
        
        if (nextFrom > currentTo + 0.01) {
          let gapGeometry = null
          
          if (parentHighway && parentHighway.geometry?.coordinates) {
            try {
              const parentCoords = parentHighway.geometry.coordinates
              const parentFromKm = parseFloat(parentHighway.properties.fromChainage?.replace(/[^0-9.]/g, '') || '0')
              const parentToKm = parseFloat(parentHighway.properties.toChainage?.replace(/[^0-9.]/g, '') || '0')
              const parentTotalKm = parentToKm - parentFromKm
              
              if (parentTotalKm > 0 && parentCoords.length > 1) {
                const distances = [0]
                for (let j = 1; j < parentCoords.length; j++) {
                  const p1 = L.latLng(parentCoords[j-1][1], parentCoords[j-1][0])
                  const p2 = L.latLng(parentCoords[j][1], parentCoords[j][0])
                  distances.push(distances[j-1] + p1.distanceTo(p2))
                }
                const totalDistance = distances[distances.length - 1]
                
                const gapStartKm = currentTo - parentFromKm
                const gapEndKm = nextFrom - parentFromKm
                
                const gapStartFraction = gapStartKm / parentTotalKm
                const gapEndFraction = gapEndKm / parentTotalKm
                
                const targetStartDist = gapStartFraction * totalDistance
                const targetEndDist = gapEndFraction * totalDistance
                
                let startIdx = 0
                let endIdx = parentCoords.length - 1
                
                for (let j = 0; j < distances.length; j++) {
                  if (distances[j] <= targetStartDist) startIdx = j
                  if (distances[j] <= targetEndDist) endIdx = j
                }
                
                if (endIdx > startIdx) {
                  gapGeometry = parentCoords.slice(startIdx, endIdx + 1)
                }
              }
            } catch (e) {
              console.error('Error extracting gap geometry from parent:', e)
            }
          }

          if (gapGeometry && gapGeometry.length >= 2) {
            allGaps.push({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: gapGeometry
              },
              properties: {
                gapFrom: currentTo,
                gapTo: nextFrom,
                parentHighway: parentRoadCode
              }
            })
          }
        }
      }

      // Check for gap at the end (if parent exists)
      if (parentHighway && sections.length > 0) {
        const parentToKm = parseFloat(parentHighway.properties.toChainage?.replace(/[^0-9.]/g, '') || '0')
        const lastSectionToKm = parseFloat(sections[sections.length - 1].properties.toChainage?.replace(/[^0-9.]/g, '') || '0')
        
        if (parentToKm > lastSectionToKm + 0.01) {
          let gapGeometry = null
          
          try {
            const parentCoords = parentHighway.geometry.coordinates
            const parentFromKm = parseFloat(parentHighway.properties.fromChainage?.replace(/[^0-9.]/g, '') || '0')
            const parentTotalKm = parentToKm - parentFromKm
            
            if (parentTotalKm > 0 && parentCoords.length > 1) {
              const distances = [0]
              for (let j = 1; j < parentCoords.length; j++) {
                const p1 = L.latLng(parentCoords[j-1][1], parentCoords[j-1][0])
                const p2 = L.latLng(parentCoords[j][1], parentCoords[j][0])
                distances.push(distances[j-1] + p1.distanceTo(p2))
              }
              const totalDistance = distances[distances.length - 1]
              
              const gapStartKm = lastSectionToKm - parentFromKm
              const gapStartFraction = gapStartKm / parentTotalKm
              const targetStartDist = gapStartFraction * totalDistance
              
              let startIdx = 0
              for (let j = 0; j < distances.length; j++) {
                if (distances[j] <= targetStartDist) startIdx = j
              }
              
              if (startIdx < parentCoords.length - 1) {
                gapGeometry = parentCoords.slice(startIdx)
              }
            }
          } catch (e) {
            console.error('Error extracting ending gap geometry:', e)
          }

          if (gapGeometry && gapGeometry.length >= 2) {
            allGaps.push({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: gapGeometry
              },
              properties: {
                gapFrom: lastSectionToKm,
                gapTo: parentToKm,
                parentHighway: parentRoadCode
              }
            })
          }
        }
      }
    })

    console.log('Total gaps found:', allGaps.length)
    setGaps(allGaps)
  }, [geojson])

  if (gaps.length === 0) {
    return null
  }

  return (
    <>
      {gaps.map((gap, index) => {
        try {
          return (
            <GeoJSON
              key={`gap-${index}`}
              data={gap}
              style={() => ({
                color: '#ef4444',
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 10',
                lineCap: 'round'
              })}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(`
                  <div style="font-family: system-ui;">
                    <div style="background: #fee2e2; color: #991b1b; padding: 0.5rem; margin: -0.5rem -0.5rem 0.5rem -0.5rem; border-radius: 4px 4px 0 0; font-weight: 600;">
                      ⚠️ Gap Detected
                    </div>
                    <div style="padding: 0.25rem;">
                      <div style="font-size: 0.85em; margin-bottom: 0.25rem;">
                        <strong>${feature.properties.parentHighway}</strong>
                      </div>
                      <div style="font-size: 0.8em; color: #64748b;">
                        Missing section: ${feature.properties.gapFrom.toFixed(3)} km - ${feature.properties.gapTo.toFixed(3)} km
                      </div>
                      <div style="font-size: 0.75em; color: #dc2626; margin-top: 0.25rem;">
                        Gap length: ${(feature.properties.gapTo - feature.properties.gapFrom).toFixed(3)} km
                      </div>
                    </div>
                  </div>
                `)
              }}
            />
          )
        } catch (error) {
          console.error('Error rendering gap:', error)
          return null
        }
      })}
    </>
  )
}

const MapView = () => {
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const [geojson, setGeojson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHighways()
  }, [])

  const normalizeGeojson = (payload: any) => {
    if (!payload) return null

    if (payload.type === 'FeatureCollection' && Array.isArray(payload.features)) {
      return payload
    }

    if (payload.success && payload.data) {
      return normalizeGeojson(payload.data)
    }

    if (payload.data && payload.data.type === 'FeatureCollection' && Array.isArray(payload.data.features)) {
      return payload.data
    }

    if (payload.features) {
      return payload
    }

    return null
  }

  const resetMapCache = () => {
    localStorage.removeItem('user_highways')
    setGeojson(emptyGeojson)
    loadHighways()
  }

  const loadHighways = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getHighwaysGeoJSON({})
      const normalizedGeojson = normalizeGeojson(response)

      if (normalizedGeojson && normalizedGeojson.features?.length > 0) {
        setGeojson(normalizedGeojson)
      } else {
        const storedHighways = JSON.parse(localStorage.getItem('user_highways') || '[]')
        if (storedHighways.length > 0) {
          const features = storedHighways.map((h: any, idx: number) => {
            const startLng = h.startLongitude || 78.0
            const startLat = h.startLatitude || 11.0
            const endLng = h.endLongitude || 79.0
            const endLat = h.endLatitude || 12.0

            return {
              type: 'Feature',
              id: h.id || idx + 1,
              properties: {
                id: h.id || idx + 1,
                roadCode: h.roadCode || 'NH',
                roadName: h.roadName || 'Highway Section',
                fromLocation: h.fromLocation || 'Start',
                toLocation: h.toLocation || 'End',
                fromChainage: h.fromChainage || '0 km',
                toChainage: h.toChainage || '0 km',
                lengthKm: h.lengthKm || 0,
                configuration: h.configuration || 'TWO_LANE',
                status: h.status || 'ACTIVE',
                isParent: true,
              },
              geometry: h.geometry || {
                type: 'LineString',
                coordinates: [
                  [startLng, startLat],
                  [endLng, endLat],
                ],
              },
              startCoord: [startLng, startLat],
              endCoord: [endLng, endLat],
            }
          })
          setGeojson({
            type: 'FeatureCollection',
            features: features,
          })
        } else {
          setGeojson(emptyGeojson)
        }
      }
    } catch (error: any) {
      console.error('Map load error:', error)
      setGeojson(emptyGeojson)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading map...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3 style={{ color: '#dc2626' }}>Error Loading Map</h3>
        <p>{error}</p>
        <button
          onClick={() => loadHighways()}
          style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!geojson || !geojson.features || geojson.features.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>No highways to display</h3>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>Add highways to see them on the map</p>
        <button
          onClick={() => window.location.href = '/highways/new'}
          style={{ padding: '0.75rem 1.5rem', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Add Highway
        </button>
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', width: '100%', position: 'relative' }}>
      <button
        onClick={resetMapCache}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '4rem',
          zIndex: 1000,
          background: '#dc2626',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        🗑️ Reset Stored Map Data
      </button>
      {/* Legend */}
      <div style={{ 
        position: 'absolute', 
        bottom: '2rem', 
        left: '1rem', 
        zIndex: 1000, 
        background: 'rgba(255, 255, 255, 0.95)', 
        padding: '0.75rem', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        maxHeight: 'calc(100vh - 150px)',
        overflowY: 'auto'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e3a8a' }}>
          Map Legend
        </div>
        
        {/* Highway Configuration */}
        <div style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Configuration</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '24px', height: '3px', background: '#10b981', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '0.7rem' }}>2 Lane</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '24px', height: '3px', background: '#06b6d4', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '0.7rem' }}>2L + Paved Shoulder</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '24px', height: '3px', background: '#f59e0b', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '0.7rem' }}>4 Lane</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '24px', height: '3px', background: '#f97316', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '0.7rem' }}>4L + Paved Shoulder</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '24px', height: '3px', background: '#dc2626', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '0.7rem' }}>6 Lane</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '24px', height: '3px', background: '#be123c', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '0.7rem' }}>6L + Paved Shoulder</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '24px', height: '3px', background: '#7c3aed', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '0.7rem' }}>8 Lane</span>
          </div>
        </div>
        
        {/* Markers */}
        <div style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Route Points</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a', border: '2px solid white', boxShadow: '0 0 4px rgba(0,0,0,0.3)' }}></div>
            <span style={{ fontSize: '0.7rem', color: '#16a34a' }}>Start Point</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626', border: '2px solid white', boxShadow: '0 0 4px rgba(0,0,0,0.3)' }}></div>
            <span style={{ fontSize: '0.7rem', color: '#dc2626' }}>End Point</span>
          </div>
        </div>
        
        {/* Section Gaps */}
        <div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Coverage</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="24" height="3" style={{ overflow: 'visible' }}>
              <line x1="0" y1="1.5" x2="24" y2="1.5" stroke="#ef4444" strokeWidth="3" strokeDasharray="4,4" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>Missing Sections</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <LayersControl position="topright">
          {/* Base Layers - Different Map Styles */}
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />
          </BaseLayer>
          
          <BaseLayer name="Satellite (Esri)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              maxZoom={19}
            />
          </BaseLayer>
          
          <BaseLayer name="Terrain (OpenTopoMap)">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
              maxZoom={17}
            />
          </BaseLayer>
          
          <BaseLayer name="Dark Mode">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              maxZoom={19}
            />
          </BaseLayer>
        </LayersControl>
        
        <FitBounds geojson={geojson} highlightId={highlightId} />
        
        {/* Highway lines */}
        <GeoJSON
          key={JSON.stringify(geojson)}
          data={geojson}
          style={(feature) => {
            const configuration = feature?.properties?.configuration
            const isHighlighted = highlightId && feature?.id === parseInt(highlightId)
            let color = '#3b82f6' // Default blue
            
            // Color by configuration
            if (configuration === 'TWO_LANE') {
              color = '#10b981' // Green
            } else if (configuration === 'TWO_LANE_PAVED_SHOULDER') {
              color = '#06b6d4' // Cyan
            } else if (configuration === 'FOUR_LANE') {
              color = '#f59e0b' // Orange
            } else if (configuration === 'FOUR_LANE_PAVED_SHOULDER') {
              color = '#f97316' // Dark Orange
            } else if (configuration === 'SIX_LANE') {
              color = '#dc2626' // Red
            } else if (configuration === 'SIX_LANE_PAVED_SHOULDER') {
              color = '#be123c' // Dark Red
            } else if (configuration === 'EIGHT_LANE') {
              color = '#7c3aed' // Purple
            }
            
            return {
              color: color,
              weight: isHighlighted ? 8 : 5,
              opacity: isHighlighted ? 1 : 0.9,
              lineCap: 'round',
              lineJoin: 'round'
            }
          }}
          onEachFeature={(feature, layer) => {
            if (feature.properties) {
              const props = feature.properties
              
              // Calculate chainage at mouse position
              const calculateChainageAtPoint = (latlng: any, lineCoords: any) => {
                if (!props.fromChainage || !props.toChainage || !lineCoords || lineCoords.length < 2) return null
                
                const fromKm = parseFloat(props.fromChainage.replace(/[^0-9.]/g, ''))
                const toKm = parseFloat(props.toChainage.replace(/[^0-9.]/g, ''))
                const totalDistance = toKm - fromKm
                
                // Find closest point on line to mouse position
                let minDist = Infinity
                let closestSegmentIndex = 0
                
                for (let i = 0; i < lineCoords.length - 1; i++) {
                  const p1 = L.latLng(lineCoords[i][1], lineCoords[i][0])
                  const mousePt = L.latLng(latlng.lat, latlng.lng)
                  
                  const dist = mousePt.distanceTo(p1)
                  if (dist < minDist) {
                    minDist = dist
                    closestSegmentIndex = i
                  }
                }
                
                // Calculate cumulative distance to closest segment
                let distanceToSegment = 0
                for (let i = 0; i < closestSegmentIndex; i++) {
                  const p1 = L.latLng(lineCoords[i][1], lineCoords[i][0])
                  const p2 = L.latLng(lineCoords[i + 1][1], lineCoords[i + 1][0])
                  distanceToSegment += p1.distanceTo(p2)
                }
                
                // Calculate total line length
                let totalLineLength = 0
                for (let i = 0; i < lineCoords.length - 1; i++) {
                  const p1 = L.latLng(lineCoords[i][1], lineCoords[i][0])
                  const p2 = L.latLng(lineCoords[i + 1][1], lineCoords[i + 1][0])
                  totalLineLength += p1.distanceTo(p2)
                }
                
                // Calculate chainage at this point
                const fraction = distanceToSegment / totalLineLength
                const chainageAtPoint = fromKm + (totalDistance * fraction)
                
                return chainageAtPoint.toFixed(3)
              }
              
              // Highlight on hover and show chainage
              layer.on('mouseover', function(this: any) {
                this.setStyle({
                  weight: 8,
                  opacity: 1
                })
              })
              
              layer.on('mouseout', function(this: any) {
                this.setStyle({
                  weight: 5,
                  opacity: 0.9
                })
                this.closeTooltip()
              })
              
              layer.on('mousemove', function(this: any, e: any) {
                if (props.fromChainage && props.toChainage && feature.geometry && 'coordinates' in feature.geometry) {
                  const chainage = calculateChainageAtPoint(e.latlng, (feature.geometry as any).coordinates)
                  
                  if (chainage) {
                    const tooltipContent = `
                      <div style="background: rgba(30, 58, 138, 0.95); color: white; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.9rem; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap;">
                        📍 ${chainage} km
                      </div>
                    `
                    
                    this.unbindTooltip()
                    this.bindTooltip(tooltipContent, {
                      permanent: false,
                      sticky: true,
                      className: 'distance-tooltip',
                      direction: 'top',
                      offset: [0, -15]
                    }).openTooltip(e.latlng)
                  }
                }
              })
              
              // Popup with detailed info
              layer.bindPopup(`
                <div style="min-width: 250px; font-family: system-ui;">
                  <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 0.75rem; margin: -0.5rem -0.5rem 0.75rem -0.5rem; border-radius: 4px 4px 0 0;">
                    <div style="font-size: 1.1em; font-weight: 700;">${props.roadCode}</div>
                    <div style="font-size: 0.9em; opacity: 0.95;">${props.roadName}</div>
                  </div>
                  
                  <div style="padding: 0 0.25rem;">
                    <div style="margin-bottom: 0.75rem;">
                      <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Route</div>
                      <div style="font-size: 0.9em; color: #1e293b;">
                        <strong>${props.fromLocation}</strong> → <strong>${props.toLocation}</strong>
                      </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
                      <div>
                        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem;">Length</div>
                        <div style="font-size: 1.1em; font-weight: 600; color: #1e3a8a;">${props.lengthKm ? Number(props.lengthKm).toFixed(2) : '0.00'} km</div>
                      </div>
                      <div>
                        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem;">Configuration</div>
                        <div style="font-size: 0.85em; font-weight: 600; color: #1e3a8a;">
                          ${props.configuration ? String(props.configuration)
                            .replace('TWO_LANE_PAVED_SHOULDER', '2L+PS')
                            .replace('TWO_LANE', '2L')
                            .replace('FOUR_LANE_PAVED_SHOULDER', '4L+PS')
                            .replace('FOUR_LANE', '4L')
                            .replace('SIX_LANE_PAVED_SHOULDER', '6L+PS')
                            .replace('SIX_LANE', '6L')
                            .replace('EIGHT_LANE', '8L') : 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div style="margin-bottom: 0.75rem;">
                      <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem;">Status</div>
                      <div style="font-size: 0.85em; font-weight: 600; color: ${props.status === 'ACTIVE' ? '#16a34a' : props.status === 'UNDER_CONSTRUCTION' ? '#f59e0b' : '#dc2626'};">
                        ${props.status ? String(props.status).replace('_', ' ') : 'ACTIVE'}
                      </div>
                    </div>
                    
                    ${props.divisionName || props.subDivisionName ? `
                      <div style="padding-top: 0.75rem; border-top: 1px solid #e2e8f0;">
                        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem;">Managed By</div>
                        <div style="font-size: 0.85em; color: #475569;">
                          ${props.divisionName ? `📍 ${props.divisionName}` : ''}
                          ${props.divisionName && props.subDivisionName ? '<br/>' : ''}
                          ${props.subDivisionName ? `📌 ${props.subDivisionName}` : ''}
                        </div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `, {
                maxWidth: 300,
                className: 'custom-popup'
              })
            }
          }}
        />
        
        {/* Start and End Point Markers */}
        {geojson && geojson.features && geojson.features.map((feature: any) => {
          const props = feature.properties
          const startCoord = feature.startCoord || (feature.geometry?.coordinates && Array.isArray(feature.geometry.coordinates[0]) ? feature.geometry.coordinates[0] : feature.geometry?.coordinates)
          const endCoord = feature.endCoord || (feature.geometry?.coordinates && Array.isArray(feature.geometry.coordinates[0]) ? feature.geometry.coordinates[feature.geometry.coordinates.length - 1] : feature.geometry?.coordinates)

          if (startCoord && endCoord && startCoord[1] !== undefined && startCoord[0] !== undefined) {
            return (
              <div key={`markers-${feature.id}`}>
                {/* Start Point (Green Dot) */}
                <CircleMarker 
                  center={[startCoord[1], startCoord[0]]} 
                  radius={8}
                  pathOptions={{
                    fillColor: '#16a34a',
                    fillOpacity: 1,
                      color: 'white',
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: '180px' }}>
                        <strong style={{ color: '#16a34a', fontSize: '0.9em' }}>🟢 START</strong><br/>
                        <strong>{props.roadCode}</strong><br/>
                        <span style={{ fontSize: '0.85em' }}>{props.fromLocation}</span>
                      </div>
                    </Popup>
                  </CircleMarker>
                  
                  {/* End Point (Red Dot) */}
                  <CircleMarker 
                    center={[endCoord[1], endCoord[0]]} 
                    radius={8}
                    pathOptions={{
                      fillColor: '#dc2626',
                      fillOpacity: 1,
                      color: 'white',
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: '180px' }}>
                        <strong style={{ color: '#dc2626', fontSize: '0.9em' }}>🔴 END</strong><br/>
                        <strong>{props.roadCode}</strong><br/>
                        <span style={{ fontSize: '0.85em' }}>{props.toLocation}</span>
                      </div>
                    </Popup>
                  </CircleMarker>
                </div>
              )
          }
          return null
        })}
        
        {/* Gap Overlay - Show missing sections */}
        <GapOverlay geojson={geojson} />
      </MapContainer>
    </div>
  )
}

export default MapView
