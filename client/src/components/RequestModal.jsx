import { useState } from 'react'
import './RequestModal.css'

const SIZES = [
  { key: '1x1', label: '1x1', cost: 10 },
  { key: '2x2', label: '2x2', cost: 35 },
  { key: '3x3', label: '3x3', cost: 75 },
  { key: '1x3', label: '1x3', cost: 25 },
]

export default function RequestModal({ cell, onClose }) {
  const [playerName, setPlayerName] = useState('')
  const [message, setMessage] = useState('')
  const [sizeIdx, setSizeIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const size = SIZES[sizeIdx]
  const [w, h] = size.key.split('x').map(Number)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: playerName, message, x: cell.x, y: cell.y, width: w, height: h }),
      })
      if (res.ok) setSuccess(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="modal-success">
            <span className="success-owl">🦉</span>
            <h2>Request Sent!</h2>
            <p>The owls have received your petition for section ({cell.x}, {cell.y}).</p>
            <p className="success-flavor">A cartographer will review your request shortly.</p>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Request Map Section</h2>
        <p className="modal-coords">Grid Position: ({cell.x}, {cell.y})</p>
        <form onSubmit={handleSubmit}>
          <label>
            Adventurer Name
            <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Your character name..." required autoFocus />
          </label>
          <label>
            Section Size
            <div className="size-options">
              {SIZES.map((s, i) => (
                <button type="button" key={s.key} className={`size-btn ${i === sizeIdx ? 'active' : ''}`} onClick={() => setSizeIdx(i)}>
                  {s.label} — {s.cost} gold
                </button>
              ))}
            </div>
          </label>
          <label>
            Message to Cartographer
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What are you looking for?" rows={3} />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Sending...' : `Send Request (${size.cost} gold)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
