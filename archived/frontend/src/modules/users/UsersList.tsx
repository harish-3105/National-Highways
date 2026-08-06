import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../core/api/client'
import { User, UserRole } from '../../types'
import { Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../core/context/AuthContext'

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await apiClient.getUsers()
      if (response.success) {
        setUsers(Array.isArray(response.data) ? response.data : [])
      } else {
        setUsers([])
        toast.error(response.message || 'Failed to load users')
      }
    } catch (error) {
      setUsers([])
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      await apiClient.deleteUser(id)
      toast.success('User deleted successfully')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return { bg: '#dbeafe', color: '#1e40af' }
      case UserRole.DIVISION:
        return { bg: '#fef3c7', color: '#92400e' }
      case UserRole.SUB_DIVISION:
        return { bg: '#dcfce7', color: '#166534' }
      default:
        return { bg: '#f3f4f6', color: '#374151' }
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Users Management</h1>
          <p style={{ color: '#64748b' }}>Manage system users and hierarchy</p>
        </div>
        {currentUser?.role !== UserRole.SUB_DIVISION && (
          <button
            onClick={() => navigate('/users/new')}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem 1.5rem', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            <Plus size={20} />
            Add User
          </button>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Username</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Office</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const roleColor = getRoleBadgeColor(user.role)
              return (
                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={20} color="#0369a1" />
                      </div>
                      <span style={{ fontWeight: '500' }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{user.username}</td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{user.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', background: roleColor.bg, color: roleColor.color, borderRadius: '12px', fontSize: '0.85rem', fontWeight: '500' }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ fontWeight: '500' }}>{user.officeName}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{user.officeCode}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {currentUser?.role === UserRole.ADMIN && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          style={{ padding: '0.5rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersList
