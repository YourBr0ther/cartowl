import { useRef, useState, useCallback, useEffect } from 'react'
import './MapCanvas.css'

const CELL_SIZE = 64
const MIN_ZOOM = 0.3
const MAX_ZOOM = 3

export default function MapCanvas({ sections, onCellClick, children }) {
  const containerRef = useRef(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const dragRef = useRef(null)
  const lastTouchRef = useRef(null)
  const didDragRef = useRef(false)

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    didDragRef.current = false
    dragRef.current = { startX: e.clientX - transform.x, startY: e.clientY - transform.y }
  }, [transform])

  const onMouseMove = useCallback((e) => {
    if (!dragRef.current) return
    didDragRef.current = true
    setTransform((t) => ({ ...t, x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY }))
  }, [])

  const onMouseUp = useCallback(() => { dragRef.current = null }, [])

  const onWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform((t) => {
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, t.scale * delta))
      const rect = containerRef.current.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      return { x: cx - (cx - t.x) * (newScale / t.scale), y: cy - (cy - t.y) * (newScale / t.scale), scale: newScale }
    })
  }, [])

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      didDragRef.current = false
      dragRef.current = { startX: e.touches[0].clientX - transform.x, startY: e.touches[0].clientY - transform.y }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchRef.current = { dist: Math.hypot(dx, dy), scale: transform.scale }
    }
  }, [transform])

  const onTouchMove = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length === 1 && dragRef.current) {
      didDragRef.current = true
      setTransform((t) => ({ ...t, x: e.touches[0].clientX - dragRef.current.startX, y: e.touches[0].clientY - dragRef.current.startY }))
    } else if (e.touches.length === 2 && lastTouchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, lastTouchRef.current.scale * (Math.hypot(dx, dy) / lastTouchRef.current.dist)))
      setTransform((t) => ({ ...t, scale: newScale }))
    }
  }, [])

  const onTouchEnd = useCallback(() => { dragRef.current = null; lastTouchRef.current = null }, [])

  useEffect(() => {
    const el = containerRef.current
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => { el.removeEventListener('wheel', onWheel); el.removeEventListener('touchmove', onTouchMove) }
  }, [onWheel, onTouchMove])

  const handleClick = useCallback((e) => {
    if (didDragRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const worldX = (e.clientX - rect.left - transform.x) / transform.scale
    const worldY = (e.clientY - rect.top - transform.y) / transform.scale
    onCellClick?.({ x: Math.floor(worldX / CELL_SIZE), y: Math.floor(worldY / CELL_SIZE) })
  }, [transform, onCellClick])

  return (
    <div className="map-container" ref={containerRef}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      onClick={handleClick}>
      <div className="map-world" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}>
        <div className="map-image-layer" />
        {sections.map((s) => (
          <div key={`${s.x}-${s.y}`} className="section-unlocked"
            style={{ left: s.x * CELL_SIZE, top: s.y * CELL_SIZE, width: s.width * CELL_SIZE, height: s.height * CELL_SIZE }} />
        ))}
        <FogLayer sections={sections} cellSize={CELL_SIZE} />
        {children}
      </div>
    </div>
  )
}

function FogLayer({ sections, cellSize }) {
  const GRID_EXTENT = 50
  const unlockedSet = new Set(sections.flatMap((s) => {
    const cells = []
    for (let dx = 0; dx < s.width; dx++)
      for (let dy = 0; dy < s.height; dy++)
        cells.push(`${s.x + dx},${s.y + dy}`)
    return cells
  }))

  const cells = []
  for (let x = -5; x < GRID_EXTENT; x++)
    for (let y = -5; y < GRID_EXTENT; y++)
      if (!unlockedSet.has(`${x},${y}`))
        cells.push(<div key={`fog-${x}-${y}`} className="fog-cell"
          style={{ left: x * cellSize, top: y * cellSize, width: cellSize, height: cellSize }} />)
  return <>{cells}</>
}
