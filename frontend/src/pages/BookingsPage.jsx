import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Bike, Phone, Clock, Search, RefreshCw, AlertCircle } from 'lucide-react'
import { bookingService } from '../services/bookingService'

export default function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [phoneSearch, setPhoneSearch] = useState('')

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const data = await bookingService.getAllBookings()
      setBookings(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load bookings:', err)
      setError('Could not fetch bookings from server. Please verify backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const filteredBookings = bookings.filter(b => {
    if (!phoneSearch.trim()) return true
    return (
      b.customer_phone.includes(phoneSearch.trim()) ||
      b.booking_reference.toLowerCase().includes(phoneSearch.trim().toLowerCase())
    )
  })

  const getStatusBadge = (status) => {
    const map = {
      pending: { bg: '#fef3c7', text: '#b45309', label: '⏳ Pending Confirmation' },
      confirmed: { bg: '#dbeafe', text: '#1d4ed8', label: '✓ Confirmed by Owner' },
      ongoing: { bg: '#f3e8ff', text: '#7e22ce', label: '🏍️ Ride Ongoing' },
      completed: { bg: '#dcfce7', text: '#15803d', label: '✔ Completed & Returned' },
      rejected: { bg: '#fee2e2', text: '#b91c1c', label: '✖ Rejected' },
      cancelled: { bg: '#f1f5f9', text: '#475569', label: 'Cancelled' }
    }
    const s = map[status] || { bg: '#f1f5f9', text: '#475569', label: status }
    return (
      <span style={{
        background: s.bg,
        color: s.text,
        padding: '0.3rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 700
      }}>
        {s.label}
      </span>
    )
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--secondary)' }}>
            My Bookings & Rental Receipts
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track your rental requests, active rides, and status in real-time.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: '0.55rem 0.95rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filter by Phone or Reference */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.6rem 1rem',
        marginBottom: '2rem',
        maxWidth: '420px'
      }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Filter by your Phone or Booking Ref (e.g. BK-)..."
          value={phoneSearch}
          onChange={(e) => setPhoneSearch(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
        />
      </div>

      {/* Error Notice */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#fee2e2',
          color: '#991b1b',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading bookings from database...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>No Bookings Found</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem 0' }}>
            You haven't submitted any bike rental requests yet.
          </p>
          <Link
            to="/bikes"
            style={{
              background: 'var(--primary)',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            Explore Available Bikes
          </Link>
        </div>
      ) : (
        /* Bookings List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {/* Header row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border)'
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Booking Reference: </span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--secondary)' }}>{b.booking_reference}</strong>
                </div>
                <div>{getStatusBadge(b.status)}</div>
              </div>

              {/* Body row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                fontSize: '0.9rem'
              }}>
                {/* Booked Bike Column */}
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Booked Vehicle:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {b.bike?.image_url ? (
                      <img
                        src={b.bike.image_url}
                        alt={b.bike.name}
                        style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-sm)',
                        background: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60a5fa'
                      }}>
                        <Bike size={24} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{b.bike?.name || 'Rental Bike'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {b.bike?.brand} {b.bike?.model ? `• ${b.bike.model}` : ''}
                      </div>
                      {b.bike?.registration_number && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <span style={{
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            letterSpacing: '0.5px',
                            color: 'var(--secondary)'
                          }}>
                            {b.bike.registration_number}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Customer:</div>
                  <strong>{b.customer_name}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📞 {b.customer_phone}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Rental Schedule:</div>
                  <div><strong>Pick:</strong> {new Date(b.pickup_datetime).toLocaleString()}</div>
                  <div style={{ color: 'var(--text-muted)' }}><strong>Drop:</strong> {new Date(b.return_datetime).toLocaleString()}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Billing Summary:</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>₹{b.total_amount}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {b.rental_days} day(s) • Rent: ₹{b.total_rent} + Deposit: ₹{b.security_deposit_snapshot}
                  </div>
                </div>
              </div>

              {b.customer_notes && (
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-main)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <strong>Notes:</strong> {b.customer_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
