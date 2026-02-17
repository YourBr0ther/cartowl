import { create } from 'zustand'

export const useMapStore = create((set) => ({
  sections: [],
  legend: [],
  isLegendOpen: false,
  selectedCell: null,

  fetchSections: async () => {
    const res = await fetch('/api/sections')
    set({ sections: await res.json() })
  },
  fetchLegend: async () => {
    const res = await fetch('/api/legend')
    set({ legend: await res.json() })
  },
  toggleLegend: () => set((s) => ({ isLegendOpen: !s.isLegendOpen })),
  selectCell: (cell) => set({ selectedCell: cell }),
  clearSelection: () => set({ selectedCell: null }),
}))
