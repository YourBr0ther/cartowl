import { useEffect, useState } from 'react'
import { useAdminStore } from '../../store/adminStore'

export default function LegendTab() {
  const { legend, fetchLegend, createLegendEntry, deleteLegendEntry } = useAdminStore()
  const [symbol, setSymbol] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => { fetchLegend() }, [])

  function handleAdd(e) {
    e.preventDefault()
    if (!symbol || !label) return
    createLegendEntry({ symbol, label, description })
    setSymbol(''); setLabel(''); setDescription('')
  }

  return (
    <div className="admin-tab">
      <h2>Map Legend</h2>
      <form className="inline-form legend-form" onSubmit={handleAdd}>
        <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Symbol" maxLength={4} required style={{ width: '60px' }} />
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" required />
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
        <button type="submit">Add</button>
      </form>
      <div className="card-list">
        {legend.map((e) => (
          <div key={e.id} className="card legend-card">
            <span className="legend-card-symbol">{e.symbol}</span>
            <div className="legend-card-info">
              <strong>{e.label}</strong>
              {e.description && <span className="legend-card-desc">{e.description}</span>}
            </div>
            <button className="btn-delete" onClick={() => deleteLegendEntry(e.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
