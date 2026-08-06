import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../core/api/client'
import { UserRole, User } from '../../types'
import { toast } from 'react-toastify'
import { ArrowLeft } from 'lucide-react'

const UserCreate = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [parentUsers, setParentUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: UserRole.SUB_DIVISION,
    parentId: '',
    officeName: '',
    officeCode: '',
  })

  useEffect(() => {
    loadParentUsers()
  }, [formData.role])

  const loadParentUsers = async () => {
    try {
      const response = await apiClient.getUsers()
      if (response.success) {
        // Filter based on role being created
        let potentialParents: User[] = []
        if (formData.role === UserRole.DIVISION) {
          // Division users can only have ADMIN as parent
          potentialParents = response.data.filter((u: User) => u.role === UserRole.ADMIN)
        } else if (formData.role === UserRole.SUB_DIVISION) {
          // Sub-Division users can have ADMIN or DIVISION as parent
          potentialParents = response.data.filter(
            (u: User) => u.role === UserRole.ADMIN || u.role === UserRole.DIVISION
          )
        }
        setParentUsers(potentialParents)
      }
    } catch (error) {
      console.error('Failed to load parent users:', error)
      toast.error('Failed to load parent users')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiClient.createUser({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        parentId: formData.role !== UserRole.ADMIN ? Number(formData.parentId) : null,
        officeName: formData.officeName,
        officeCode: formData.officeCode,
      })

      toast.success('User created successfully')
      navigate('/users')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <button 
        onClick={() => navigate('/users')}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#1e3a8a' }}
      >
        <ArrowLeft size={20} />
        Back to Users
      </button>

      <h1 style={{ marginBottom: '2rem' }}>Create New User</h1>

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Username *</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            >
              <option value={UserRole.DIVISION}>Division</option>
              <option value={UserRole.SUB_DIVISION}>Sub Division</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Parent {formData.role !== UserRole.ADMIN && '*'}
            </label>
            <select
              required={formData.role !== UserRole.ADMIN}
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              disabled={formData.role === UserRole.ADMIN}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            >
              <option value="">Select Parent</option>
              {parentUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Office Name *</label>
            <input
              type="text"
              required
              value={formData.officeName}
              onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Office Code *</label>
            <input
              type="text"
              required
              value={formData.officeCode}
              onChange={(e) => setFormData({ ...formData, officeCode: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              placeholder="e.g., DIV-N"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button
            type="button"
            onClick={() => navigate('/users')}
            style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '0.75rem 1.5rem', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UserCreate
