import { useEffect } from 'react'
import { useAdminStore } from '../../store/adminStore'

export default function RequestsTab() {
  const { requests, fetchRequests, approveRequest, rejectRequest } = useAdminStore()

  useEffect(() => { fetchRequests() }, [])

  const pending = requests.filter((r) => r.status === 'pending')
  const resolved = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="admin-tab">
      <h2>Pending Requests</h2>
      {pending.length === 0 && <p className="empty-state">No pending requests.</p>}
      <div className="card-list">
        {pending.map((r) => (
          <div key={r.id} className="card">
            <div className="card-header">
              <strong>{r.player_name}</strong>
              <span className="card-meta">({r.x}, {r.y}) — {r.width}x{r.height}</span>
            </div>
            <p className="card-cost">{r.gold_cost} gold</p>
            {r.message && <p className="card-message">"{r.message}"</p>}
            <div className="card-actions">
              <button className="btn-approve" onClick={() => approveRequest(r.id)}>Approve</button>
              <button className="btn-reject" onClick={() => rejectRequest(r.id)}>Reject</button>
            </div>
          </div>
        ))}
      </div>

      {resolved.length > 0 && (
        <>
          <h3>Resolved</h3>
          <div className="card-list">
            {resolved.map((r) => (
              <div key={r.id} className={`card resolved ${r.status}`}>
                <div className="card-header">
                  <strong>{r.player_name}</strong>
                  <span className={`status-badge ${r.status}`}>{r.status}</span>
                </div>
                <span className="card-meta">({r.x}, {r.y}) — {r.width}x{r.height} — {r.gold_cost} gold</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
