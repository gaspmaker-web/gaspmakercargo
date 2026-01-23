// Archivo: app/[locale]/not-found.tsx

import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'white', fontFamily: 'sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h2>404 - Not Found</h2>
      <p>Could not find the requested page.</p>
      <Link href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
        Return Home
      </Link>
    </div>
  )
}