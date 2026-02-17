import './LegendPanel.css'

export default function LegendPanel({ entries, isOpen, onToggle }) {
  return (
    <>
      <button className="legend-toggle" onClick={onToggle}>
        {isOpen ? 'Close' : 'Key'}
      </button>
      <div className={`legend-drawer ${isOpen ? 'open' : ''}`}>
        <div className="legend-scroll">
          <h3 className="legend-title">Map Legend</h3>
          {entries.length === 0 && <p className="legend-empty">No entries yet.</p>}
          <ul className="legend-list">
            {entries.map((e) => (
              <li key={e.id} className="legend-item">
                <span className="legend-symbol">{e.symbol}</span>
                <div>
                  <span className="legend-label">{e.label}</span>
                  {e.description && <span className="legend-desc">{e.description}</span>}
                </div>
              </li>
            ))}
          </ul>
          <p className="legend-footer">— Cartowl Survey Co. —</p>
        </div>
      </div>
    </>
  )
}
