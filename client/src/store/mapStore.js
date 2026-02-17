import { create } from 'zustand'

export const useMapStore = create((set) => ({
  sections: [],
  legend: [],
  isLegendOpen: false,
  selectedCell: null,

  fetchSections: async () => {
    try {
      const res = await fetch('/api/sections')
      if (res.ok) set({ sections: await res.json() })
    } catch { /* network error — keep existing state */ }
  },
  fetchLegend: async () => {
    try {
      const res = await fetch('/api/legend')
      if (res.ok) set({ legend: await res.json() })
    } catch { /* network error — keep existing state */ }
  },
  toggleLegend: () => set((s) => ({ isLegendOpen: !s.isLegendOpen })),
  selectCell: (cell) => set({ selectedCell: cell }),
  clearSelection: () => set({ selectedCell: null }),
}))
