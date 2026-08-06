import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
// @ts-ignore - leaflet-draw doesn't have perfect types
import 'leaflet-draw'

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface MapDrawerProps {
  initialCoordinates?: number[][]
  onCoordinatesChange: (coordinates: number[][]) => void
  disabled?: boolean
}

const MapDrawer: React.FC<MapDrawerProps> = ({ 
  initialCoordinates, 
  onCoordinatesChange,
  disabled = false 
}) => {
  const mapRef = useRef<L.Map | null>(null)
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null)

  const MapContent = () => {
    useEffect(() => {
      if (!mapRef.current) return

      const map = mapRef.current
      
      // Create a feature group for drawn items
      const drawnItems = new L.FeatureGroup()
      map.addLayer(drawnItems)
      drawnItemsRef.current = drawnItems

      // Initialize draw control
      const drawControl = new (L.Control as any).Draw({
        position: 'topright',
        draw: {
          polyline: !disabled ? {
            shapeOptions: {
              color: '#3b82f6',
              weight: 4
            }
          } : false,
          polygon: false,
          circle: false,
          rectangle: false,
          marker: false,
          circlemarker: false
        },
        edit: !disabled ? {
          featureGroup: drawnItems,
          remove: true
        } : false
      })
      map.addControl(drawControl)

      // Handle draw created event
      map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer
        drawnItems.clearLayers()
        drawnItems.addLayer(layer)
        
        const latlngs = layer.getLatLngs()
        const coordinates = latlngs.map((latlng: any) => [latlng.lng, latlng.lat])
        onCoordinatesChange(coordinates)
      })

      // Handle draw edited event
      map.on(L.Draw.Event.EDITED, (e: any) => {
        const layers = e.layers
        layers.eachLayer((layer: any) => {
          const latlngs = layer.getLatLngs()
          const coordinates = latlngs.map((latlng: any) => [latlng.lng, latlng.lat])
          onCoordinatesChange(coordinates)
        })
      })

      // Handle draw deleted event
      map.on(L.Draw.Event.DELETED, () => {
        onCoordinatesChange([])
      })

      return () => {
        map.off(L.Draw.Event.CREATED)
        map.off(L.Draw.Event.EDITED)
        map.off(L.Draw.Event.DELETED)
        map.removeControl(drawControl)
        map.removeLayer(drawnItems)
      }
    }, [disabled])

    // Separate effect for handling initialCoordinates updates
    useEffect(() => {
      if (!mapRef.current || !drawnItemsRef.current) return
      if (!initialCoordinates || initialCoordinates.length === 0) return

      const map = mapRef.current
      const drawnItems = drawnItemsRef.current

      // Clear existing layers
      drawnItems.clearLayers()

      // Load initial coordinates
      const latlngs = initialCoordinates.map(coord => [coord[1], coord[0]] as [number, number])
      const polyline = L.polyline(latlngs, { color: '#3b82f6', weight: 4 })
      drawnItems.addLayer(polyline)
      
      // Fit map to polyline bounds
      const bounds = polyline.getBounds()
      map.fitBounds(bounds, { padding: [50, 50] })
    }, [initialCoordinates])

    return null
  }

  return (
    <div style={{ height: '400px', width: '100%', border: '1px solid #ddd', borderRadius: '4px' }}>
      <MapContainer
        center={[20.5937, 78.9629]} // Center of India
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        {/* Base map layer with roads visible */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        <MapContent />
      </MapContainer>
    </div>
  )
}

export default MapDrawer
