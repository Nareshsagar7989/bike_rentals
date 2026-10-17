import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Bike,
  X,
  Phone,
  User,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { bikeService } from '../services/bikeService'
import { bookingService } from '../services/bookingService'
import authService from '../services/authService'

export default function BikeDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [bike, setBike] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState(null)
  const [bookingSuccess, setBookingSuccess] = useState(null)

  // Real-time Availability State
  const [availabilityStatus, setAvailabilityStatus] = useState(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  // Form Fields
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [pickupDatetime, setPickupDatetime] = useState('')
  const [returnDatetime, setReturnDatetime] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')

  // Real-time availability check when dates change
  useEffect(() => {
    let active = true

    const verify = async () => {
      if (!bike || !pickupDatetime || !returnDatetime) return

      const start = new Date(pickupDatetime)
      const end = new Date(returnDatetime)

      if (end <= start) {
        setAvailabilityStatus({
          available: false,
          message: 'Return date/time must be strictly after pickup date/time'
        })
        return
      }

      try {
        setCheckingAvailability(true)
        const res = await bikeService.checkAvailability(
          bike.id,
          start.toISOString(),
          end.toISOString()
        )
        if (active) {
          setAvailabilityStatus(res)
        }
      } catch (err) {
        console.error('Availability check error:', err)
      } finally {
        if (active) setCheckingAvailability(false)
      }
    }

    verify()

    return () => {
      active = false
    }
  }, [bike?.id, pickupDatetime, returnDatetime])

  useEffect(() => {
    const fetchBikeDetails = async () => {
      try {
        setLoading(true)
        const data = await bikeService.getBikeById(id)
        setBike(data)
      } catch (err) {
        console.error('Failed to load bike details:', err)
        setError('Bike not found or failed to load details from the database.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchBikeDetails()
    }
  }, [id])

  // Set default initial dates when opening modal (e.g. tomorrow 10:00 AM to day after 10:00 AM)
  const handleOpenBookingModal = () => {
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0)
    const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 0)

    // Format to YYYY-MM-DDTHH:mm for datetime-local input
    const formatLocal = (d) => {
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    // Auto-fill logged in user info
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      if (currentUser.name && !customerName) setCustomerName(currentUser.name)
      if (currentUser.phone && !customerPhone) setCustomerPhone(currentUser.phone)
    }

    setPickupDatetime(formatLocal(tomorrow))
    setReturnDatetime(formatLocal(dayAfter))
    setBookingError(null)
    setBookingSuccess(null)
    setIsModalOpen(true)
  }

  // Live estimated pricing preview
  const calculateEstimate = () => {
    if (!pickupDatetime || !returnDatetime || !bike) {
      return { days: 1, rent: Number(bike?.daily_rent || 0), deposit: Number(bike?.security_deposit || 0), total: 0 }
    }
    const start = new Date(pickupDatetime)
    const end = new Date(returnDatetime)
    const diffHours = (end - start) / (1000 * 60 * 60)

    let days = 1
    if (diffHours > 25) {
      days = Math.ceil(diffHours / 24)
    }

    const rent = days * Number(bike.daily_rent)
    const deposit = Number(bike.security_deposit || 0)
    return {
      days: Math.max(1, days),
      rent,
      deposit,
      total: rent + deposit
    }
  }

  const estimate = calculateEstimate()

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setBookingError(null)

    try {
      const payload = {
        bike_id: bike.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        pickup_datetime: new Date(pickupDatetime).toISOString(),
        return_datetime: new Date(returnDatetime).toISOString(),
        customer_notes: customerNotes.trim() || null
      }

      const res = await bookingService.createBooking(payload)
      setBookingSuccess(res)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit booking request. Please check details.'
      setBookingError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '4rem auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading bike specifications from database...
      </div>
    )
  }

  if (error || !bike) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Bike Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <Link to="/bikes" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--primary)',
          color: '#ffffff',
          padding: '0.65rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none'
        }}>
          <ArrowLeft size={16} /> Back to Bikes
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <Link to="/bikes" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        color: 'var(--text-muted)',
        fontWeight: 600,
        textDecoration: 'none',
        marginBottom: '1.5rem'
      }}>
        <ArrowLeft size={18} /> Back to all bikes
      </Link>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
      }}>
        {/* Bike Image */}
        <div style={{ minHeight: '360px', background: '#0f172a' }}>
          {bike.image_url ? (
            <img
              src={bike.image_url}
              alt={bike.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              minHeight: '360px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#94a3b8'
            }}>
              <Bike size={64} color="#60a5fa" />
              <span style={{ fontSize: '1rem', marginTop: '0.6rem', color: '#94a3b8' }}>{bike.brand}</span>
            </div>
          )}
        </div>

        {/* Bike Info */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
              {bike.brand}
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '999px',
              background: bike.is_active ? '#dcfce7' : '#fee2e2',
              color: bike.is_active ? '#166534' : '#991b1b'
            }}>
              {bike.is_active ? 'Available for Rent' : 'Unavailable'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0' }}>
            {bike.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Model: {bike.model} • Plate: <strong>{bike.registration_number}</strong>
          </p>

          {/* Pricing Box */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            padding: '1rem',
            background: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily Rental Rate</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--secondary)' }}>
                ₹{bike.daily_rent}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>/day</span>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Refundable Deposit</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                ₹{bike.security_deposit || '0'}
              </div>
            </div>
          </div>

          {bike.description && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>Description</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {bike.description}
              </p>
            </div>
          )}

          {/* Inclusions */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Rental Inclusions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Check size={16} color="#16a34a" /> 1 Free ISI certified safety helmet
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Check size={16} color="#16a34a" /> 24/7 Roadside breakdown assistance in Jagityal
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="#16a34a" /> Verified vehicle documents & third-party insurance
              </span>
            </div>
          </div>

          {/* Rent Button */}
          <button
            disabled={!bike.is_active}
            onClick={handleOpenBookingModal}
            style={{
              marginTop: 'auto',
              background: bike.is_active ? 'var(--primary)' : '#94a3b8',
              color: '#ffffff',
              padding: '0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-md)',
              cursor: bike.is_active ? 'pointer' : 'not-allowed'
            }}
          >
            <Calendar size={18} /> {bike.is_active ? 'Proceed to Book Bike' : 'Currently Unavailable'}
          </button>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
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
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {bookingSuccess ? (
              /* Success Screen */
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto'
                }}>
                  <CheckCircle2 size={36} />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                  Booking Request Submitted!
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  The business owner in Jagityal has received your rental request.
                </p>

                {/* Booking Receipt Box */}
                <div style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  textAlign: 'left',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Booking Reference:</span>
                    <strong style={{ color: 'var(--primary)' }}>{bookingSuccess.booking_reference}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Bike:</span>
                    <strong>{bike.name} ({bike.registration_number})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Rental Duration:</span>
                    <strong>{bookingSuccess.rental_days} Day(s)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Rental Charge:</span>
                    <strong>₹{bookingSuccess.total_rent}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                    <span><strong>Total Amount:</strong></span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>₹{bookingSuccess.total_amount}</strong>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#b45309', background: '#fef3c7', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    ⏳ Status: <strong>Pending Confirmation</strong>. The owner will review and confirm shortly.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      setIsModalOpen(false)
                      navigate('/my-rentals')
                    }}
                    style={{
                      background: 'var(--primary)',
                      color: '#ffffff',
                      padding: '0.7rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    View in My Bookings
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border)',
                      padding: '0.7rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                  Rent {bike.name}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Fill in your rental schedule. No advance payment required for request submission.
                </p>

                {bookingError && (
                  <div style={{
                    background: '#fee2e2',
                    color: '#991b1b',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <AlertCircle size={16} />
                    <span>{bookingError}</span>
                  </div>
                )}

                <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Full Name *
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.6rem 0.8rem'
                    }}>
                      <User size={16} color="var(--text-muted)" />
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Phone Number (for booking confirmation) *
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.6rem 0.8rem'
                    }}>
                      <Phone size={16} color="var(--text-muted)" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
                      />
                    </div>
                  </div>

                  {/* Datetime Selection */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Pickup Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={pickupDatetime}
                        onChange={(e) => setPickupDatetime(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Return Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={returnDatetime}
                        onChange={(e) => setReturnDatetime(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Real-time Availability Alert */}
                  {checkingAvailability ? (
                    <div style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      background: 'var(--bg-main)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <Clock size={16} /> Checking bike availability in Jagityal fleet...
                    </div>
                  ) : availabilityStatus && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: availabilityStatus.available ? '#dcfce7' : '#fee2e2',
                      color: availabilityStatus.available ? '#15803d' : '#991b1b',
                      border: availabilityStatus.available ? '1px solid #bbf7d0' : '1px solid #fecaca'
                    }}>
                      {availabilityStatus.available ? (
                        <>
                          <CheckCircle2 size={18} />
                          <span>{availabilityStatus.message}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={20} color="#b91c1c" />
                          <span>{availabilityStatus.message}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Special Notes (Optional)
                    </label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Extra helmet required, pickup from Bus stand..."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  {/* Live Cost Breakdown */}
                  <div style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
                      <strong>{estimate.days} Day(s)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Rental Rate (₹{bike.daily_rent} × {estimate.days}):</span>
                      <strong>₹{estimate.rent}</strong>
                    </div>
                    {estimate.deposit > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Security Deposit (Refundable):</span>
                        <strong>₹{estimate.deposit}</strong>
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid var(--border)',
                      fontSize: '1rem'
                    }}>
                      <span><strong>Total Estimated:</strong></span>
                      <strong style={{ color: 'var(--primary)' }}>₹{estimate.total}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
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
                      disabled={submitting || checkingAvailability || (availabilityStatus && !availabilityStatus.available)}
                      style={{
                        background: (availabilityStatus && !availabilityStatus.available) ? '#94a3b8' : 'var(--primary)',
                        color: '#ffffff',
                        padding: '0.65rem 1.5rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 700,
                        cursor: (availabilityStatus && !availabilityStatus.available) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {submitting
                        ? 'Submitting...'
                        : (availabilityStatus && !availabilityStatus.available)
                          ? 'Slot Unavailable'
                          : 'Confirm & Request Booking'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
