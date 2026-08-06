import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '../../core/api/client'
import { HighwayStatus, RoadConfiguration, Highway } from '../../types'
import { toast } from 'react-toastify'
import { ArrowLeft, Layers } from 'lucide-react'
import MapDrawer from '../../components/MapDrawer'

const HighwayCreate = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const parentId = searchParams.get('parent')
  const [loading, setLoading] = useState(false)
  const [drawingMode, setDrawingMode] = useState<'manual' | 'auto'>('manual')
  const [coordinates, setCoordinates] = useState<number[][]>([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [parentHighway, setParentHighway] = useState<Highway | null>(null)
  const [waypoints, setWaypoints] = useState<{lat: string, lng: string}[]>([])
  const [formData, setFormData] = useState({
    roadName: '',
    roadCode: '',
    fromLocation: '',
    toLocation: '',
    fromChainage: '',
    toChainage: '',
    configuration: RoadConfiguration.TWO_LANE,
    startLatitude: '',
    startLongitude: '',
    endLatitude: '',
    endLongitude: '',
    status: HighwayStatus.ACTIVE,
    isParent: false,
    sectionNumber: 1,
  })

  useEffect(() => {
    if (parentId) {
      loadParentHighway()
    }
  }, [parentId])

  const loadParentHighway = async () => {
    try {
      const response = await apiClient.getHighwayWithSections(Number(parentId))
      if (response.success) {
        const parent: Highway = response.data
        setParentHighway(parent)
        setFormData(prev => ({
          ...prev,
          roadCode: parent.roadCode,
          roadName: parent.roadName,
          sectionNumber: (parent.sections?.length || 0) + 1,
        }))
      }
    } catch (error) {
      toast.error('Failed to load parent highway')
    }
  }

  const validateCoordinate = (value: string, type: 'lat' | 'lng'): boolean => {
    const num = parseFloat(value)
    if (isNaN(num)) return false
    if (type === 'lat') return num >= -90 && num <= 90
    return num >= -180 && num <= 180
  }

  const fetchOSMRoute = async () => {
    if (!validateCoordinate(formData.startLatitude, 'lat') || 
        !validateCoordinate(formData.startLongitude, 'lng') ||
        !validateCoordinate(formData.endLatitude, 'lat') || 
        !validateCoordinate(formData.endLongitude, 'lng')) {
      toast.error('Please enter valid start and end coordinates first')
      return
    }

    setRouteLoading(true)
    try {
      const startLat = parseFloat(formData.startLatitude)
      const startLng = parseFloat(formData.startLongitude)
      const endLat = parseFloat(formData.endLatitude)
      const endLng = parseFloat(formData.endLongitude)

      // Build coordinates string with waypoints
      let coordsString = `${startLng},${startLat}`
      
      // Add waypoints if any
      waypoints.forEach(wp => {
        if (wp.lat && wp.lng) {
          coordsString += `;${wp.lng},${wp.lat}`
        }
      })
      
      coordsString += `;${endLng},${endLat}`

      // Using OSRM (Open Source Routing Machine) public API
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch route from OSM')
      }

      const data = await response.json()
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routeCoordinates = data.routes[0].geometry.coordinates
        setCoordinates(routeCoordinates)
        toast.success(`Route generated with ${routeCoordinates.length} points`)
      } else {
        toast.error('No route found between the specified points')
      }
    } catch (error) {
      console.error('OSM Route error:', error)
      toast.error('Failed to generate route. Please try manual drawing.')
    } finally {
      setRouteLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submission started', { formData, coordinates })

    // Validate from location (capitalize first letter of each word)
    if (!formData.fromLocation || !/^[A-Z]/.test(formData.fromLocation)) {
      toast.error('From Location must start with a capital letter')
      return
    }

    // Validate to location (capitalize first letter of each word)
    if (!formData.toLocation || !/^[A-Z]/.test(formData.toLocation)) {
      toast.error('To Location must start with a capital letter')
      return
    }

    // For sections, coordinates and map drawing are optional (auto-calculated from parent)
    const isSection = !!parentId

    // Validate coordinates only for non-sections
    if (!isSection) {
      if (!validateCoordinate(formData.startLatitude, 'lat')) {
        toast.error('Start Latitude must be between -90 and 90')
        console.log('Start Latitude validation failed:', formData.startLatitude)
        return
      }

      if (!validateCoordinate(formData.startLongitude, 'lng')) {
        toast.error('Start Longitude must be between -180 and 180')
        console.log('Start Longitude validation failed:', formData.startLongitude)
        return
      }

      if (!validateCoordinate(formData.endLatitude, 'lat')) {
        toast.error('End Latitude must be between -90 and 90')
        console.log('End Latitude validation failed:', formData.endLatitude)
        return
      }

      if (!validateCoordinate(formData.endLongitude, 'lng')) {
        toast.error('End Longitude must be between -180 and 180')
        console.log('End Longitude validation failed:', formData.endLongitude)
        return
      }

      // Validate coordinates from map drawer
      if (!coordinates || coordinates.length < 2) {
        toast.error('Please draw a highway route on the map (minimum 2 points)')
        console.log('Coordinates validation failed. Length:', coordinates?.length)
        return
      }
    }

    console.log('All validations passed, submitting...')

    setLoading(true)
    try {
      const payload: any = {
        roadName: formData.roadName.toUpperCase(),
        roadCode: formData.roadCode.toUpperCase(),
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
        fromChainage: formData.fromChainage,
        toChainage: formData.toChainage,
        configuration: formData.configuration,
        status: formData.status,
        isParent: formData.isParent,
      }

      console.log('Payload to send:', payload)

      // Only include geometry and coordinates for non-sections
      // Sections will auto-calculate from parent highway + chainage
      if (!isSection && coordinates && coordinates.length >= 2) {
        payload.geometry = {
          type: 'LineString',
          coordinates: coordinates,
        }
        payload.startLatitude = parseFloat(formData.startLatitude)
        payload.startLongitude = parseFloat(formData.startLongitude)
        payload.endLatitude = parseFloat(formData.endLatitude)
        payload.endLongitude = parseFloat(formData.endLongitude)
      }

      if (parentId) {
        payload.parentHighwayId = Number(parentId)
        payload.sectionNumber = formData.sectionNumber
      }

      console.log('Final payload before API call:', JSON.stringify(payload, null, 2))
      const response = await apiClient.createHighway(payload)
      console.log('API Response:', response)

      // Check if the response indicates success
      if (!response.success) {
        const message = response.message || 'Failed to create highway'
        // Calculate duration based on message length (min 5s, max 15s)
        const duration = Math.min(Math.max(message.length * 50, 5000), 15000)
        toast.error(message, { autoClose: duration })
        return
      }

      if (parentId) {
        toast.success(`Section ${formData.sectionNumber} created successfully`)
        navigate(`/highways/${parentId}/sections`)
      } else {
        toast.success('Highway created successfully')
        navigate('/highways')
      }
    } catch (error: any) {
      console.error('Create highway error:', error)
      console.error('Error response:', error.response?.data)
      const errorMessage = error.response?.data?.message || 'Failed to create highway'
      // Calculate duration based on message length (min 5s, max 15s)
      const duration = Math.min(Math.max(errorMessage.length * 50, 5000), 15000)
      toast.error(errorMessage, { autoClose: duration })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <button 
        onClick={() => navigate('/highways')}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#1e3a8a' }}
      >
        <ArrowLeft size={20} />
        Back to Highways
      </button>

      <h1 style={{ marginBottom: '2rem' }}>
        {parentHighway ? `Create Section for ${parentHighway.roadCode}` : 'Create New Highway'}
      </h1>

      {parentHighway && (
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Layers size={20} color="#1e3a8a" />
            <strong style={{ color: '#1e3a8a' }}>Adding Section {formData.sectionNumber}</strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
            Parent: {parentHighway.roadCode} - {parentHighway.roadName}<br />
            Existing sections: {parentHighway.sections?.length || 0}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {!parentId && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isParent}
                onChange={(e) => setFormData({ ...formData, isParent: e.target.checked })}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: '500' }}>
                Create as Parent Highway (for highways with multiple sections)
              </span>
            </label>
            <p style={{ margin: '0.5rem 0 0 1.75rem', fontSize: '0.875rem', color: '#64748b' }}>
              Check this if this highway will have different configurations at different chainage sections. 
              You can add sections after creating the parent.
            </p>
          </div>
        )}

        {parentId && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Section Number</label>
            <input
              type="number"
              required
              min="1"
              value={formData.sectionNumber}
              onChange={(e) => setFormData({ ...formData, sectionNumber: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Road Code * (UPPERCASE only)</label>
          <input
            type="text"
            required
            value={formData.roadCode}
            onChange={(e) => setFormData({ ...formData, roadCode: e.target.value.toUpperCase() })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', textTransform: 'uppercase' }}
            placeholder="NH-1"
            disabled={!!parentId}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Road Name * (UPPERCASE only)</label>
          <input
            type="text"
            required
            value={formData.roadName}
            onChange={(e) => setFormData({ ...formData, roadName: e.target.value.toUpperCase() })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', textTransform: 'uppercase' }}
            placeholder="NATIONAL HIGHWAY 1"
            disabled={!!parentId}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>From Location * (Capital letter)</label>
            <input
              type="text"
              required
              value={formData.fromLocation}
              onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              placeholder="Delhi"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>To Location * (Capital letter)</label>
            <input
              type="text"
              required
              value={formData.toLocation}
              onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              placeholder="Mumbai"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>From Chainage * (e.g., 15.12 km)</label>
            <input
              type="text"
              required
              value={formData.fromChainage}
              onChange={(e) => setFormData({ ...formData, fromChainage: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              placeholder="15.12 km"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>To Chainage * (e.g., 19.29 km)</label>
            <input
              type="text"
              required
              value={formData.toChainage}
              onChange={(e) => setFormData({ ...formData, toChainage: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              placeholder="19.29 km"
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Road Configuration *</label>
          <select
            value={formData.configuration}
            onChange={(e) => setFormData({ ...formData, configuration: e.target.value as RoadConfiguration })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
          >
            <option value={RoadConfiguration.TWO_LANE}>2L - Two Lane</option>
            <option value={RoadConfiguration.TWO_LANE_PAVED_SHOULDER}>2L+PS - Two Lane with Paved Shoulder</option>
            <option value={RoadConfiguration.FOUR_LANE}>4L - Four Lane</option>
            <option value={RoadConfiguration.FOUR_LANE_PAVED_SHOULDER}>4L+PS - Four Lane with Paved Shoulder</option>
            <option value={RoadConfiguration.SIX_LANE}>6L - Six Lane</option>
            <option value={RoadConfiguration.SIX_LANE_PAVED_SHOULDER}>6L+PS - Six Lane with Paved Shoulder</option>
            <option value={RoadConfiguration.EIGHT_LANE}>8L - Eight Lane</option>
          </select>
        </div>

        {/* Show coordinate fields only for parent highways, not sections */}
        {!parentId && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Latitude * (-90 to 90)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.startLatitude}
                  onChange={(e) => setFormData({ ...formData, startLatitude: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                  placeholder="28.6139"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Longitude * (-180 to 180)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.startLongitude}
                  onChange={(e) => setFormData({ ...formData, startLongitude: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                  placeholder="77.2090"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Latitude * (-90 to 90)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.endLatitude}
                  onChange={(e) => setFormData({ ...formData, endLatitude: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                  placeholder="19.0760"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Longitude * (-180 to 180)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.endLongitude}
                  onChange={(e) => setFormData({ ...formData, endLongitude: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                  placeholder="72.8777"
                />
              </div>
            </div>

            {/* Waypoints Section */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontWeight: '500', color: '#1e3a8a' }}>📍 Intermediate Waypoints (Optional)</label>
                <button
                  type="button"
                  onClick={() => setWaypoints([...waypoints, { lat: '', lng: '' }])}
                  style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  + Add Waypoint
                </button>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                Add points along the route to ensure it follows the correct highway path
              </div>
              
              {waypoints.map((wp, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="number"
                    step="any"
                    placeholder={`Waypoint ${index + 1} Lat`}
                    value={wp.lat}
                    onChange={(e) => {
                      const newWaypoints = [...waypoints]
                      newWaypoints[index].lat = e.target.value
                      setWaypoints(newWaypoints)
                    }}
                    style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.875rem' }}
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder={`Waypoint ${index + 1} Lng`}
                    value={wp.lng}
                    onChange={(e) => {
                      const newWaypoints = [...waypoints]
                      newWaypoints[index].lng = e.target.value
                      setWaypoints(newWaypoints)
                    }}
                    style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.875rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setWaypoints(waypoints.filter((_, i) => i !== index))}
                    style={{ padding: '0.5rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {waypoints.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>
                  No waypoints added. Route will go directly from start to end.
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as HighwayStatus })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
          >
            <option value={HighwayStatus.ACTIVE}>Active</option>
            <option value={HighwayStatus.INACTIVE}>Inactive</option>
            <option value={HighwayStatus.UNDER_CONSTRUCTION}>Under Construction</option>
            <option value={HighwayStatus.CLOSED}>Closed</option>
          </select>
        </div>

        {/* Show route drawing only for parent highways, not sections */}
        {!parentId && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Highway Route Drawing Method *
            </label>
          
          {/* Drawing Mode Toggle */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setDrawingMode('manual')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: drawingMode === 'manual' ? '#1e3a8a' : 'white',
                color: drawingMode === 'manual' ? 'white' : '#1e3a8a',
                border: drawingMode === 'manual' ? 'none' : '2px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              ✏️ Manual Drawing
            </button>
            <button
              type="button"
              onClick={() => setDrawingMode('auto')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: drawingMode === 'auto' ? '#1e3a8a' : 'white',
                color: drawingMode === 'auto' ? 'white' : '#1e3a8a',
                border: drawingMode === 'auto' ? 'none' : '2px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              🛣️ Auto Route (OSM)
            </button>
          </div>

          {/* Manual Drawing Mode */}
          {drawingMode === 'manual' && (
            <>
              <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#0c4a6e' }}>
                  <strong>Manual Drawing:</strong> Click the polyline tool (📏) on the map, then click points along the highway route. 
                  Double-click to finish. You can edit or delete the line using the tools on the right.
                </p>
              </div>
              <MapDrawer 
                onCoordinatesChange={setCoordinates}
                disabled={loading}
              />
            </>
          )}

          {/* Auto Route Mode */}
          {drawingMode === 'auto' && (
            <>
              <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#9a3412' }}>
                  <strong>Auto Route (OSM):</strong> Enter or update the start and end coordinates above, then click "Generate Route" below. 
                  The system will automatically plot the highway route along existing OSM roads between these points.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={fetchOSMRoute}
                  disabled={routeLoading || !formData.startLatitude || !formData.startLongitude || !formData.endLatitude || !formData.endLongitude}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    background: routeLoading ? '#94a3b8' : '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: routeLoading || !formData.startLatitude || !formData.startLongitude || !formData.endLatitude || !formData.endLongitude ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: routeLoading || !formData.startLatitude || !formData.startLongitude || !formData.endLatitude || !formData.endLongitude ? 0.6 : 1
                  }}
                >
                  {routeLoading ? '🔄 Generating Route...' : '🗺️ Generate Route from OSM'}
                </button>
              </div>

              <MapDrawer 
                initialCoordinates={coordinates}
                onCoordinatesChange={setCoordinates}
                disabled={loading}
              />
            </>
          )}

          {coordinates.length > 0 && (
            <small style={{ color: '#10b981', display: 'block', marginTop: '0.5rem' }}>
              ✓ Route plotted with {coordinates.length} points ({(coordinates.length - 1)} segments)
            </small>
          )}
          </div>
        )}

        {/* Show info message for sections */}
        {parentId && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>
              <strong>✓ Auto-calculated Route:</strong> The route geometry for this section will be automatically calculated from the parent highway ({parentHighway?.roadCode}) based on the chainage range you specified. No manual drawing required!
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/highways')}
            style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '0.75rem 1.5rem', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Creating...' : 'Create Highway'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default HighwayCreate
