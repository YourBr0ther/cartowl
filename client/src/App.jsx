import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MapView from './pages/MapView'
import AdminPanel from './pages/AdminPanel'
import AdminLogin from './pages/AdminLogin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
