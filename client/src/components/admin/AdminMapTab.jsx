import { useState } from 'react'
import { useAdminStore } from '../../store/adminStore'

const SIZES = ['1x1', '2x2', '3x3', '1x3']

export default function AdminMapTab() {
  const { unlockSection } = useAdminStore()
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [size, setSize] = useState('1x1')
  const [success, setSuccess] = useState(false)

  async function handleUnlock(e) {
    e.preventDefault()
    const [w, h] = size.split('x').map(Number)
    await unlockSection(x, y, w, h)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  return (
    <div className="admin-tab">
      <h2>Unlock Map Section</h2>
      <form className="inline-form" onSubmit={handleUnlock}>
        <label>
          X
          <input type="number" value={x} onChange={(e) => setX(Number(e.target.value))} style={{ width: '70px' }} />
        </label>
        <label>
          Y
          <input type="number" value={y} onChange={(e) => setY(Number(e.target.value))} style={{ width: '70px' }} />
        </label>
        <label>
          Size
          <select value={size} onChange={(e) => setSize(e.target.value)}>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button type="submit">Unlock</button>
      </form>
      {success && <p className="success-msg">Section unlocked!</p>}
    </div>
  )
}
