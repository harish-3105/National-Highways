import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserRole } from '../../types'
import { Map, Home, Route as RouteIcon, Users, LogOut, Menu, X, BarChart3, Clock, AlertOctagon, Gavel, Upload } from 'lucide-react'
import { useState } from 'react'

const Layout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold bg-sky-700 text-white px-2 py-0.5 rounded">NH</span>
                <h1 className="text-lg font-bold text-gray-900">National Highways Analytics Platform</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                <div className="text-xs text-sky-700 font-semibold">{user?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className={`transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 bg-white w-64 border-r hidden md:block`}>
          <nav className="p-4 space-y-1">
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Portal</div>

            <NavLink to="/dashboard" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700'}`}>
              <Home size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/map" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700'}`}>
              <Map size={18} />
              <span>GIS Interactive Map</span>
            </NavLink>

            <NavLink to="/highways" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700'}`}>
              <RouteIcon size={18} />
              <span>Highways Inventory</span>
            </NavLink>

            <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sample Data Modules</div>

            <NavLink to="/bar-chart" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700'}`}>
              <BarChart3 size={18} className="text-blue-600" />
              <span>Chainage Bar Chart</span>
            </NavLink>

            <NavLink to="/dlp" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700'}`}>
              <Clock size={18} className="text-amber-600" />
              <span>DLP Warranty Engine</span>
            </NavLink>

            <NavLink to="/blackspots" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700'}`}>
              <AlertOctagon size={18} className="text-red-600" />
              <span>Accident Blackspots</span>
            </NavLink>

            <NavLink to="/legal" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700'}`}>
              <Gavel size={18} className="text-purple-600" />
              <span>Legal & Lawyer Portal</span>
            </NavLink>

            <NavLink to="/ingestion" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700'}`}>
              <Upload size={18} className="text-green-600" />
              <span>Excel/CSV Ingestion</span>
            </NavLink>

            {(user?.role === UserRole.ADMIN || user?.role === UserRole.DIVISION) && (
              <>
                <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</div>
                <NavLink to="/users" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700'}`}>
                  <Users size={18} />
                  <span>Users & Hierarchy</span>
                </NavLink>
              </>
            )}
          </nav>

          <div className="mt-auto p-4 border-t bg-gray-50">
            <div className="text-xs font-semibold text-gray-700">{user?.officeName}</div>
            <div className="text-xs text-gray-400">Code: {user?.officeCode}</div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
