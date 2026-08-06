import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { AuthProvider } from './core/context/AuthContext'
import { ProtectedRoute } from './core/components/ProtectedRoute'
import Login from './modules/auth/Login'
import Dashboard from './modules/dashboard/Dashboard'
import HighwaysList from './modules/highways/HighwaysList'
import HighwayCreate from './modules/highways/HighwayCreate'
import HighwayEdit from './modules/highways/HighwayEdit'
import HighwayWithSections from './modules/highways/HighwayWithSections'
import MapView from './modules/map/MapView'
import UsersList from './modules/users/UsersList'
import UserCreate from './modules/users/UserCreate'
import Layout from './core/components/Layout'

// Sample Data Module Pages
import HighwayBarChart from './modules/highways/HighwayBarChart'
import DLPTracker from './modules/dlp/DLPTracker'
import BlackspotAnalytics from './modules/blackspots/BlackspotAnalytics'
import LegalDashboard from './modules/legal/LegalDashboard'
import DataIngestion from './modules/ingestion/DataIngestion'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="highways" element={<HighwaysList />} />
            <Route path="highways/new" element={<HighwayCreate />} />
            <Route path="highways/:id/sections" element={<HighwayWithSections />} />
            <Route path="highways/:id/edit" element={<HighwayEdit />} />
            <Route path="map" element={<MapView />} />

            {/* Extended Sample Data Modules */}
            <Route path="bar-chart" element={<HighwayBarChart />} />
            <Route path="dlp" element={<DLPTracker />} />
            <Route path="blackspots" element={<BlackspotAnalytics />} />
            <Route path="legal" element={<LegalDashboard />} />
            <Route path="ingestion" element={<DataIngestion />} />

            <Route path="users" element={<UsersList />} />
            <Route path="users/new" element={<UserCreate />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
