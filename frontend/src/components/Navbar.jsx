import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bike, User, Calendar, LogIn, LogOut, ShieldCheck } from 'lucide-react'
import authService from '../services/authService'

export default function Navbar() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser())

  useEffect(() => {
    const handleAuthUpdate = () => {
      setCurrentUser(authService.getCurrentUser())
    }

    window.addEventListener('authChange', handleAuthUpdate)
    window.addEventListener('storage', handleAuthUpdate)
    return () => {
      window.removeEventListener('authChange', handleAuthUpdate)
      window.removeEventListener('storage', handleAuthUpdate)
    }
  }, [])

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
    navigate('/login')
  }

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
    transition: 'color 0.2s ease',
  })

  const isAdmin = currentUser?.role === 'admin'

  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.875rem 2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bike size={24} />
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--secondary)' }}>
            Bike<span style={{ color: 'var(--primary)' }}>Rental</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <NavLink to="/" style={linkStyle}>
            Home
          </NavLink>
          <NavLink to="/bikes" style={linkStyle}>
            <Bike size={18} />
            Explore Bikes
          </NavLink>
          <NavLink to="/my-rentals" style={linkStyle}>
            <Calendar size={18} />
            My Bookings
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" style={linkStyle}>
              <ShieldCheck size={18} color="#dc2626" />
              <span style={{ color: '#dc2626', fontWeight: 700 }}>Admin Portal</span>
            </NavLink>
          )}
        </nav>

        {/* Auth Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                background: isAdmin ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${isAdmin ? '#fecaca' : '#bbf7d0'}`,
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isAdmin ? '#991b1b' : '#166534'
              }}>
                {isAdmin ? <ShieldCheck size={16} color="#dc2626" /> : <User size={16} color="#16a34a" />}
                <span>
                  {isAdmin ? 'Admin (Owner)' : (currentUser.name || 'Customer')}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#64748b',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none'
              }}>
                <LogIn size={16} />
                Login
              </Link>
              <Link to="/register" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1.1rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                background: 'var(--primary)',
                color: '#ffffff',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <User size={16} />
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
