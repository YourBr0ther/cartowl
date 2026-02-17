import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '../store/adminStore'
import RequestsTab from '../components/admin/RequestsTab'
import PlayersTab from '../components/admin/PlayersTab'
import LegendTab from '../components/admin/LegendTab'
import AdminMapTab from '../components/admin/AdminMapTab'
import './AdminPanel.css'

const TABS = ['Requests', 'Map', 'Players', 'Legend']

export default function AdminPanel() {
  const { token, logout } = useAdminStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Requests')

  useEffect(() => { if (!token) navigate('/admin/login') }, [token])
  if (!token) return null

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="admin-title">🦉 Cartowl Guild — Admin</div>
        <nav className="admin-tabs">
          {TABS.map((t) => <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>)}
        </nav>
        <div className="admin-actions">
          <a href="/" className="admin-link">View Map</a>
          <button onClick={logout} className="admin-logout">Logout</button>
        </div>
      </header>
      <main className="admin-main">
        {activeTab === 'Requests' && <RequestsTab />}
        {activeTab === 'Map' && <AdminMapTab />}
        {activeTab === 'Players' && <PlayersTab />}
        {activeTab === 'Legend' && <LegendTab />}
      </main>
    </div>
  )
}
