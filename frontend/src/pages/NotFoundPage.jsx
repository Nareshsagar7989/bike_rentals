import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div style={{
      maxWidth: '500px',
      margin: '6rem auto',
      textAlign: 'center',
      padding: '0 1.5rem'
    }}>
      <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
      <h1 style={{ fontSize: '2rem', fontWeight: 850, marginBottom: '0.5rem' }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        background: 'var(--primary)',
        color: '#ffffff',
        padding: '0.65rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        textDecoration: 'none'
      }}>
        <ArrowLeft size={16} /> Return to Home
      </Link>
    </div>
  )
}
