import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Tracking — Gasp Maker Cargo',
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0f1a' }}>
      {children}
    </div>
  )
}
