import { useEffect, useState } from 'react'
import { useAdminStore } from '../../store/adminStore'

export default function PlayersTab() {
  const { players, fetchPlayers, createPlayer, updatePlayerGold } = useAdminStore()
  const [name, setName] = useState('')
  const [gold, setGold] = useState(0)

  useEffect(() => { fetchPlayers() }, [])

  function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    createPlayer(name.trim(), Number(gold))
    setName(''); setGold(0)
  }

  return (
    <div className="admin-tab">
      <h2>Players</h2>
      <form className="inline-form" onSubmit={handleAdd}>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" required />
        <input type="number" value={gold} onChange={(e) => setGold(e.target.value)} placeholder="Gold" min={0} />
        <button type="submit">Add Player</button>
      </form>
      <div className="card-list">
        {players.map((p) => (
          <div key={p.id} className="card player-card">
            <strong>{p.name}</strong>
            <div className="gold-edit">
              <input type="number" defaultValue={p.gold_balance} min={0}
                onBlur={(e) => updatePlayerGold(p.id, Number(e.target.value))} />
              <span className="gold-label">gold</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
