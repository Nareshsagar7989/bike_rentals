import { useState, useEffect } from 'react'
import {
  Bike,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  Phone,
  User,
  ShieldCheck,
  Search,
  RefreshCw
} from 'lucide-react'
import { bikeService } from '../services/bikeService'
import { bookingService } from '../services/bookingService'
import { Link } from 'react-router-dom'
import authService from '../services/authService'

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(authService.isAdmin())
  const [activeTab, setActiveTab] = useState('bookings') // 'bookings' | 'bikes'

  // Data states
  const [bikes, setBikes] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')
  const [bikeSearch, setBikeSearch] = useState('')

  // Bike Add/Edit Modal
  const [isBikeModalOpen, setIsBikeModalOpen] = useState(false)
  const [editingBike, setEditingBike] = useState(null)
  const [bikeFormData, setBikeFormData] = useState({
    name: '',
    brand: '',
    model: '',
    registration_number: '',
    description: '',
    daily_rent: '',
    security_deposit: '',
    image_url: '',
    is_active: true
  })
  const [bikeSubmitting, setBikeSubmitting] = useState(false)
  const [bikeFormError, setBikeFormError] = useState(null)

  // Listen for login/logout changes
  useEffect(() => {
    const handleAuth = () => {
      setIsAdmin(authService.isAdmin())
    }
    window.addEventListener('authChange', handleAuth)
    window.addEventListener('storage', handleAuth)
    return () => {
      window.removeEventListener('authChange', handleAuth)
      window.removeEventListener('storage', handleAuth)
    }
  }, [])

  // Fetch all data
  const fetchData = async () => {
    if (!authService.isAdmin()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [bikesRes, bookingsRes] = await Promise.all([
        bikeService.getAllBikes({ is_active_only: false }),
        bookingService.getAllBookings()
      ])
      setBikes(bikesRes)
      setBookings(bookingsRes)
      setError(null)
    } catch (err) {
      console.error('Error fetching admin data:', err)
      setError('Failed to fetch data from backend server. Please verify backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  // Bike Operations
  const handleOpenAddBike = () => {
    setEditingBike(null)
    setBikeFormData({
      name: '',
      brand: '',
      model: '',
      registration_number: '',
      description: '',
      daily_rent: '',
      security_deposit: '',
      image_url: '',
      is_active: true
    })
    setBikeFormError(null)
    setIsBikeModalOpen(true)
  }

  const handleOpenEditBike = (bike) => {
    setEditingBike(bike)
    setBikeFormData({
      name: bike.name,
      brand: bike.brand,
      model: bike.model,
      registration_number: bike.registration_number,
      description: bike.description || '',
      daily_rent: bike.daily_rent,
      security_deposit: bike.security_deposit || '',
      image_url: bike.image_url || '',
      is_active: bike.is_active
    })
    setBikeFormError(null)
    setIsBikeModalOpen(true)
  }

  const handleBikeSubmit = async (e) => {
    e.preventDefault()
    setBikeSubmitting(true)
    setBikeFormError(null)

    try {
      const payload = {
        ...bikeFormData,
        daily_rent: parseFloat(bikeFormData.daily_rent),
        security_deposit: parseFloat(bikeFormData.security_deposit || 0)
      }

      if (editingBike) {
        await bikeService.updateBike(editingBike.id, payload)
      } else {
        await bikeService.createBike(payload)
      }

      setIsBikeModalOpen(false)
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save bike.'
      setBikeFormError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setBikeSubmitting(false)
    }
  }

  const handleDeleteBike = async (bikeId) => {
    if (window.confirm('Are you sure you want to delete/deactivate this bike from the fleet?')) {
      try {
        await bikeService.deleteBike(bikeId, false)
        fetchData()
      } catch (err) {
        alert('Failed to delete bike: ' + (err.response?.data?.detail || err.message))
      }
    }
  }

  // Booking Operations
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await bookingService.updateStatus(bookingId, newStatus)
      fetchData()
    } catch (err) {
      alert('Failed to update booking status: ' + (err.response?.data?.detail || err.message))
    }
  }

  // Derived stats
  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length
  const ongoingCount = bookings.filter(b => b.status === 'ongoing').length
  const activeBikesCount = bikes.filter(b => b.is_active).length

  // Filtered lists
  const filteredBookings = bookings.filter(b => {
    if (bookingStatusFilter === 'all') return true
    return b.status === bookingStatusFilter
  })

  const filteredBikes = bikes.filter(b => {
    if (!bikeSearch.trim()) return true
    const term = bikeSearch.toLowerCase()
    return (
      b.name.toLowerCase().includes(term) ||
      b.brand.toLowerCase().includes(term) ||
      b.registration_number.toLowerCase().includes(term)
    )
  })

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', text: '#b45309', label: 'Pending Request' },
      confirmed: { bg: '#dbeafe', text: '#1d4ed8', label: 'Confirmed' },
      ongoing: { bg: '#f3e8ff', text: '#7e22ce', label: 'Ride Ongoing' },
      completed: { bg: '#dcfce7', text: '#15803d', label: 'Completed' },
      rejected: { bg: '#fee2e2', text: '#b91c1c', label: 'Rejected' },
      cancelled: { bg: '#f1f5f9', text: '#475569', label: 'Cancelled' },
    }
    const s = styles[status] || { bg: '#f1f5f9', text: '#475569', label: status }
    return (
      <span style={{
        background: s.bg,
        color: s.text,
        padding: '0.25rem 0.65rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        display: 'inline-block'
      }}>
        {s.label}
      </span>
    )
  }

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: '520px', margin: '5rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '0.6rem' }}>
            Admin Access Restricted
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
            This portal contains administrative controls (Fleet management, adding/editing bikes, and booking approvals) reserved strictly for the owner.
          </p>
          <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/login"
              style={{
                background: 'var(--primary)',
                color: '#ffffff',
                padding: '0.75rem 1.4rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              Log In as Admin
            </Link>
            <Link
              to="/bikes"
              style={{
                background: '#f1f5f9',
                color: 'var(--secondary)',
                padding: '0.75rem 1.4rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid var(--border)'
              }}
            >
              Browse Available Bikes
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Admin Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--secondary)',
            color: '#ffffff',
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '0.5rem'
          }}>
            <ShieldCheck size={14} /> ADMIN CONTROL PANEL
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--secondary)' }}>
            Owner Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Jagityal Bike Rentals • Manage Fleet Inventory & Customer Booking Requests
          </p>
        </div>

        <button
          onClick={fetchData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Fleet Bikes</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.3rem' }}>
            {bikes.length}
            <span style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: 600, marginLeft: '0.5rem' }}>
              ({activeBikesCount} Active)
            </span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Booking Requests</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: pendingCount > 0 ? '#b45309' : 'var(--secondary)', marginTop: '0.3rem' }}>
            {pendingCount}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Confirmed Bookings</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.3rem' }}>
            {confirmedCount}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Ongoing Rides</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7e22ce', marginTop: '0.3rem' }}>
            {ongoingCount}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: '2rem',
        gap: '2rem'
      }}>
        <button
          onClick={() => setActiveTab('bookings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 0.25rem',
            borderBottom: activeTab === 'bookings' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'bookings' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '1rem',
            background: 'transparent',
            cursor: 'pointer'
          }}
        >
          <Calendar size={18} /> Booking Requests ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('bikes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 0.25rem',
            borderBottom: activeTab === 'bikes' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'bikes' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '1rem',
            background: 'transparent',
            cursor: 'pointer'
          }}
        >
          <Bike size={18} /> Fleet Inventory ({bikes.length})
        </button>
      </div>

      {/* TAB 1: BOOKINGS MANAGEMENT */}
      {activeTab === 'bookings' && (
        <div>
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {['all', 'pending', 'confirmed', 'ongoing', 'completed', 'rejected'].map(st => (
              <button
                key={st}
                onClick={() => setBookingStatusFilter(st)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  background: bookingStatusFilter === st ? 'var(--secondary)' : 'var(--bg-card)',
                  color: bookingStatusFilter === st ? '#ffffff' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)',
              padding: '3rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)'
            }}>
              <Calendar size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h3>No booking requests found for this filter.</h3>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              overflowX: 'auto',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>REFERENCE</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>BIKE DETAILS</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>CUSTOMER</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>RENTAL DATES</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>DURATION & AMOUNT</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>
                        {b.booking_reference}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {b.bike?.image_url ? (
                            <img
                              src={b.bike.image_url}
                              alt={b.bike.name}
                              style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: 'var(--radius-sm)',
                              background: '#0f172a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#60a5fa'
                            }}>
                              <Bike size={20} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.bike?.name || 'Bike #' + b.bike_id.slice(0, 6)}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                              <span>{b.bike?.brand}</span>
                              {b.bike?.registration_number && (
                                <span style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '0.1rem 0.35rem', borderRadius: '3px', fontWeight: 700, color: 'var(--secondary)' }}>
                                  {b.bike.registration_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Phone size={12} /> {b.customer_phone}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        <div><strong>Pick:</strong> {new Date(b.pickup_datetime).toLocaleString()}</div>
                        <div style={{ color: 'var(--text-muted)' }}><strong>Drop:</strong> {new Date(b.return_datetime).toLocaleString()}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--secondary)' }}>₹{b.total_amount}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {b.rental_days} day(s) • Rent: ₹{b.total_rent}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {getStatusBadge(b.status)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {b.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                                style={{
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'rejected')}
                                style={{
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'ongoing')}
                              style={{
                                background: '#7e22ce',
                                color: '#ffffff',
                                padding: '0.4rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Start Ride (Handover)
                            </button>
                          )}
                          {b.status === 'ongoing' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                              style={{
                                background: '#2563eb',
                                color: '#ffffff',
                                padding: '0.4rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Complete & Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BIKES MANAGEMENT */}
      {activeTab === 'bikes' && (
        <div>
          {/* Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.55rem 0.85rem',
              minWidth: '280px'
            }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search bike name, brand, or plate..."
                value={bikeSearch}
                onChange={(e) => setBikeSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
              />
            </div>

            <button
              onClick={handleOpenAddBike}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--primary)',
                color: '#ffffff',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Plus size={18} /> Add New Bike
            </button>
          </div>

          {filteredBikes.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)',
              padding: '3rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)'
            }}>
              <Bike size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h3>No bikes found. Click "+ Add New Bike" to add one to your fleet.</h3>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              overflowX: 'auto',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>BIKE DETAILS</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>PLATE / REG</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>DAILY RENT</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>DEPOSIT</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBikes.map((bike) => (
                    <tr key={bike.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {bike.image_url ? (
                          <img
                            src={bike.image_url}
                            alt={bike.name}
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
                          <div style={{ fontWeight: 700 }}>{bike.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {bike.brand} • {bike.model}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ background: 'var(--bg-main)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                          {bike.registration_number}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>
                        ₹{bike.daily_rent}/day
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        ₹{bike.security_deposit || '0'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          background: bike.is_active ? '#dcfce7' : '#fee2e2',
                          color: bike.is_active ? '#166534' : '#991b1b',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {bike.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenEditBike(bike)}
                            title="Edit"
                            style={{
                              background: 'var(--bg-main)',
                              border: '1px solid var(--border)',
                              padding: '0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteBike(bike.id)}
                            title="Delete / Deactivate"
                            style={{
                              background: '#fee2e2',
                              border: 'none',
                              color: '#991b1b',
                              padding: '0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* BIKE ADD / EDIT MODAL */}
      {isBikeModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                {editingBike ? 'Update Bike Details' : 'Add New Bike to Fleet'}
              </h2>
              <button
                onClick={() => setIsBikeModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {bikeFormError && (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {bikeFormError}
              </div>
            )}

            <form onSubmit={handleBikeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Bike Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Enfield Classic 350"
                  value={bikeFormData.name}
                  onChange={(e) => setBikeFormData({ ...bikeFormData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Enfield"
                    value={bikeFormData.brand}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, brand: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Classic 350 Dark"
                    value={bikeFormData.model}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, model: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Registration Number (Number Plate) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TS-08-EF-1234"
                  value={bikeFormData.registration_number}
                  onChange={(e) => setBikeFormData({ ...bikeFormData, registration_number: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Daily Rent (₹/day) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 799"
                    value={bikeFormData.daily_rent}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, daily_rent: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 1500"
                    value={bikeFormData.security_deposit}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, security_deposit: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={bikeFormData.image_url}
                  onChange={(e) => setBikeFormData({ ...bikeFormData, image_url: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Description / Condition
                </label>
                <textarea
                  rows="2"
                  placeholder="Notes about bike specs..."
                  value={bikeFormData.description}
                  onChange={(e) => setBikeFormData({ ...bikeFormData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="modal_is_active"
                  checked={bikeFormData.is_active}
                  onChange={(e) => setBikeFormData({ ...bikeFormData, is_active: e.target.checked })}
                />
                <label htmlFor="modal_is_active" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  Active & Available for Rent
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsBikeModalOpen(false)}
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    padding: '0.65rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bikeSubmitting}
                  style={{
                    background: 'var(--primary)',
                    color: '#ffffff',
                    padding: '0.65rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {bikeSubmitting ? 'Saving...' : editingBike ? 'Update Bike' : 'Save Bike'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
