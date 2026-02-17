import { useEffect } from 'react'
import { useMapStore } from '../store/mapStore'
import MapCanvas from '../components/MapCanvas'
import RequestModal from '../components/RequestModal'
import LegendPanel from '../components/LegendPanel'
import './MapView.css'

export default function MapView() {
  const { sections, legend, isLegendOpen, selectedCell, fetchSections, fetchLegend, toggleLegend, selectCell, clearSelection } = useMapStore()

  useEffect(() => { fetchSections(); fetchLegend() }, [])

  function handleCellClick(cell) {
    const isUnlocked = sections.some((s) =>
      cell.x >= s.x && cell.x < s.x + s.width && cell.y >= s.y && cell.y < s.y + s.height
    )
    if (!isUnlocked) selectCell(cell)
  }

  return (
    <div className="map-view">
      <header className="map-header">
        <div className="map-title">
          <span className="header-owl">🦉</span>
          <span className="header-name">Cartowl</span>
        </div>
        <p className="map-subtitle">Survey Co. — Charting the Known World</p>
      </header>
      <MapCanvas sections={sections} onCellClick={handleCellClick} />
      <LegendPanel entries={legend} isOpen={isLegendOpen} onToggle={toggleLegend} />
      {selectedCell && <RequestModal cell={selectedCell} onClose={clearSelection} />}
    </div>
  )
}
