import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../core/api/client'
import { HighwayStatus, Highway, RoadConfiguration, UserRole } from '../../types'
import { toast } from 'react-toastify'
import { ArrowLeft, Edit2, Route } from 'lucide-react'
import MapDrawer from '../../components/MapDrawer'
import { useAuth } from '../../core/context/AuthContext'

const HighwayEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [coordinates, setCoordinates] = useState<number[][]>([])
  const [initialCoordinates, setInitialCoordinates] = useState<number[][]>([])
  const [drawingMode, setDrawingMode] = useState<'manual' | 'auto'>('manual')
  const [routeLoading, setRouteLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [isSection, setIsSection] = useState(false)
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
    divisionId: '',
    subDivisionId: '',
  })

  useEffect(() => {
    loadHighway()
  }, [id])

  const loadHighway = async () => {
    try {
      const [highwayResponse, usersResponse] = await Promise.all([
        apiClient.getHighway(Number(id)),
        user?.role === UserRole.ADMIN ? apiClient.getUsers() : Promise.resolve({ success: true, data: [] })
      ])
      
      if (usersResponse.success) {
        setUsers(usersResponse.data.filter((u: any) => u.role === 'DIVISION' || u.role === 'SUB_DIVISION'))
      }
      
      const highwayData = highwayResponse?.data ?? highwayResponse
      if (highwayData) {
        const highway: Highway = highwayData
        setIsSection(!!highway.parentHighwayId)
        setFormData({
          roadName: highway.roadName || '',
          roadCode: highway.roadCode || '',
          fromLocation: highway.fromLocation || '',
          toLocation: highway.toLocation || '',
          fromChainage: highway.fromChainage || '',
          toChainage: highway.toChainage || '',
          configuration: highway.configuration || RoadConfiguration.TWO_LANE,
          startLatitude: highway.startLatitude?.toString() || '',
          startLongitude: highway.startLongitude?.toString() || '',
          endLatitude: highway.endLatitude?.toString() || '',
          endLongitude: highway.endLongitude?.toString() || '',
          status: highway.status || HighwayStatus.ACTIVE,
          divisionId: highway.divisionId?.toString() || '',
          subDivisionId: highway.subDivisionId?.toString() || '',
        })
        // Set coordinates for map drawer
        if (highway.geometry && highway.geometry.coordinates) {
          const coords = highway.geometry.coordinates
          setInitialCoordinates(coords)
          setCoordinates(coords)
        }
      }
    } catch (error) {
      console.error('Load highway error:', error)
      toast.error('Failed to load highway')
      navigate('/highways')
    } finally {
      setInitialLoading(false)
    }
  }

  const validateCoordinate = (value: string, type: 'lat' | 'lng'): boolean => {
    const num = parseFloat(value)
    if (isNaN(num)) return false
    if (type === 'lat') return num >= -90 && num <= 90
    return num >= -180 && num <= 180
  }

  const fetchOSMRoute = async () => {
    if (!formData.startLatitude || !formData.startLongitude || 
        !formData.endLatitude || !formData.endLongitude) {
      toast.error('Please enter start and end coordinates')
      return
    }

    if (!validateCoordinate(formData.startLatitude, 'lat') || 
        !validateCoordinate(formData.startLongitude, 'lng') ||
        !validateCoordinate(formData.endLatitude, 'lat') || 
        !validateCoordinate(formData.endLongitude, 'lng')) {
      toast.error('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180')
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

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch route from OSRM')
      }

      const data = await response.json()
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found')
      }

      const routeCoordinates = data.routes[0].geometry.coordinates
      setCoordinates(routeCoordinates)
      setInitialCoordinates(routeCoordinates)
      toast.success(`Route generated with ${routeCoordinates.length} points`)
    } catch (error) {
      console.error('OSRM error:', error)
      toast.error('Failed to generate route from OSM. Please try manual drawing.')
    } finally {
      setRouteLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submission started', { formData, coordinates })

    if (!formData.fromLocation || !/^[A-Z]/.test(formData.fromLocation)) {
      toast.error('From Location must start with a capital letter')
      return
    }

    if (!formData.toLocation || !/^[A-Z]/.test(formData.toLocation)) {
      toast.error('To Location must start with a capital letter')
      return
    }

    if (formData.startLatitude && !validateCoordinate(formData.startLatitude, 'lat')) {
      toast.error('Start Latitude must be between -90 and 90')
      console.log('Start Latitude validation failed:', formData.startLatitude)
      return
    }

    if (formData.startLongitude && !validateCoordinate(formData.startLongitude, 'lng')) {
      toast.error('Start Longitude must be between -180 and 180')
      console.log('Start Longitude validation failed:', formData.startLongitude)
      return
    }

    if (formData.endLatitude && !validateCoordinate(formData.endLatitude, 'lat')) {
      toast.error('End Latitude must be between -90 and 90')
      console.log('End Latitude validation failed:', formData.endLatitude)
      return
    }

    if (formData.endLongitude && !validateCoordinate(formData.endLongitude, 'lng')) {
      toast.error('End Longitude must be between -180 and 180')
      console.log('End Longitude validation failed:', formData.endLongitude)
      return
    }

    if (!coordinates || coordinates.length < 2) {
      toast.error('Please draw a highway route on the map (minimum 2 points)')
      console.log('Coordinates validation failed. Length:', coordinates?.length)
      return
    }

    console.log('All validations passed, submitting...')

    setLoading(true)
    try {
      const geometry = {
        type: 'LineString',
        coordinates: coordinates,
      }

      await apiClient.updateHighway(Number(id), {
        roadName: formData.roadName.toUpperCase(),
        roadCode: formData.roadCode.toUpperCase(),
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
        fromChainage: formData.fromChainage,
        toChainage: formData.toChainage,
        configuration: formData.configuration,
        startLatitude: formData.startLatitude ? parseFloat(formData.startLatitude) : undefined,
        startLongitude: formData.startLongitude ? parseFloat(formData.startLongitude) : undefined,
        endLatitude: formData.endLatitude ? parseFloat(formData.endLatitude) : undefined,
        endLongitude: formData.endLongitude ? parseFloat(formData.endLongitude) : undefined,
        status: formData.status,
        geometry,
        divisionId: formData.divisionId ? parseInt(formData.divisionId) : undefined,
        subDivisionId: formData.subDivisionId ? parseInt(formData.subDivisionId) : undefined,
      })

      toast.success('Highway updated successfully')
      navigate('/highways')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update highway'
      // Calculate duration based on message length (min 5s, max 15s)
      const duration = Math.min(Math.max(errorMessage.length * 50, 5000), 15000)
      toast.error(errorMessage, { autoClose: duration })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
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

      <h1 style={{ marginBottom: '2rem' }}>Edit Highway</h1>

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Road Code * (UPPERCASE only)</label>
          <input
            type="text"
            required
            value={formData.roadCode}
            onChange={(e) => setFormData({ ...formData, roadCode: e.target.value.toUpperCase() })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', textTransform: 'uppercase' }}
            placeholder="NH-1"
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>From Chainage (e.g., 15.12 km)</label>
            <input
              type="text"
              value={formData.fromChainage}
              onChange={(e) => setFormData({ ...formData, fromChainage: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              placeholder="15.12 km"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>To Chainage (e.g., 19.29 km)</label>
            <input
              type="text"
              value={formData.toChainage}
              onChange={(e) => setFormData({ ...formData, toChainage: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              placeholder="19.29 km"
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Road Configuration</label>
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

        {user?.role === UserRole.ADMIN && isSection && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Division</label>
              <select
                value={formData.divisionId}
                onChange={(e) => setFormData({ ...formData, divisionId: e.target.value, subDivisionId: '' })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              >
                <option value="">Not Assigned</option>
                {users.filter(u => u.role === 'DIVISION').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Sub-Division</label>
              <select
                value={formData.subDivisionId}
                onChange={(e) => setFormData({ ...formData, subDivisionId: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                disabled={!formData.divisionId}
              >
                <option value="">Not Assigned</option>
                {users
                  .filter(u => u.role === 'SUB_DIVISION' && u.parentId?.toString() === formData.divisionId)
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
              </select>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Latitude (-90 to 90)</label>
            <input
              type="number"
              step="any"
              value={formData.startLatitude}
              onChange={(e) => setFormData({ ...formData, startLatitude: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              placeholder="28.6139"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Longitude (-180 to 180)</label>
            <input
              type="number"
              step="any"
              value={formData.startLongitude}
              onChange={(e) => setFormData({ ...formData, startLongitude: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              placeholder="77.2090"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Latitude (-90 to 90)</label>
            <input
              type="number"
              step="any"
              value={formData.endLatitude}
              onChange={(e) => setFormData({ ...formData, endLatitude: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              placeholder="19.0760"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Longitude (-180 to 180)</label>
            <input
              type="number"
              step="any"
              value={formData.endLongitude}
              onChange={(e) => setFormData({ ...formData, endLongitude: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              placeholder="72.8777"
            />
          </div>
        </div>

        {/* Waypoints Section - Only for parent highways */}
        {!isSection && (
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

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500' }}>
            Drawing Mode
          </label>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setDrawingMode('manual')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: drawingMode === 'manual' ? '#1e3a8a' : '#f1f5f9',
                color: drawingMode === 'manual' ? 'white' : '#1e3a8a',
                border: drawingMode === 'manual' ? 'none' : '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: '500',
              }}
            >
              <Edit2 size={18} />
              Manual Drawing
            </button>
            <button
              type="button"
              onClick={() => setDrawingMode('auto')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: drawingMode === 'auto' ? '#1e3a8a' : '#f1f5f9',
                color: drawingMode === 'auto' ? 'white' : '#1e3a8a',
                border: drawingMode === 'auto' ? 'none' : '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: '500',
              }}
            >
              <Route size={18} />
              Auto Route (OSM)
            </button>
          </div>
        </div>

        {drawingMode === 'auto' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
                <strong>Auto Route Mode:</strong> Enter start and end coordinates above, then click "Generate Route" 
                to automatically plot the highway using OpenStreetMap roads.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchOSMRoute}
              disabled={routeLoading || !formData.startLatitude || !formData.startLongitude || !formData.endLatitude || !formData.endLongitude}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: routeLoading ? '#94a3b8' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: routeLoading || !formData.startLatitude || !formData.startLongitude || !formData.endLatitude || !formData.endLongitude ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              {routeLoading ? 'Generating Route...' : 'Generate Route from OSM'}
            </button>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            {drawingMode === 'manual' ? 'Edit Highway Route on Map *' : 'Generated Highway Route'}
          </label>
          {drawingMode === 'manual' ? (
            <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#0c4a6e' }}>
                <strong>Instructions:</strong> The existing route is shown in blue. Use the edit tool (✏️) to modify points, 
                or delete (🗑️) and redraw using the polyline tool (📏). Double-click to finish drawing.
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#14532d' }}>
                <strong>Auto-Generated:</strong> The route below was generated from OSM. You can still use the edit tools to adjust it if needed.
              </p>
            </div>
          )}
          <MapDrawer 
            initialCoordinates={initialCoordinates}
            onCoordinatesChange={setCoordinates}
            disabled={loading || (drawingMode === 'manual' ? false : true)}
          />
          {coordinates.length > 0 && (
            <small style={{ color: '#10b981', display: 'block', marginTop: '0.5rem' }}>
              ✓ Route has {coordinates.length} points ({(coordinates.length - 1)} segments)
            </small>
          )}
        </div>

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
            {loading ? 'Updating...' : 'Update Highway'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default HighwayEdit
