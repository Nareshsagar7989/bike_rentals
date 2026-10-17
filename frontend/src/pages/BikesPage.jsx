import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Trash2, Edit3, X, Check, AlertCircle, Bike } from 'lucide-react'
import { bikeService } from '../services/bikeService'
import authService from '../services/authService'

export default function BikesPage() {
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('All')
  const [isAdmin, setIsAdmin] = useState(authService.isAdmin())

  useEffect(() => {
    const handleAuth = () => setIsAdmin(authService.isAdmin())
    window.addEventListener('authChange', handleAuth)
    window.addEventListener('storage', handleAuth)
    return () => {
      window.removeEventListener('authChange', handleAuth)
      window.removeEventListener('storage', handleAuth)
    }
  }, [])

  // Dynamically compute brands from actual database bikes
  const dynamicBrands = ['All', ...Array.from(new Set(bikes.map(b => b.brand).filter(Boolean)))]

  // Admin Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBike, setEditingBike] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    registration_number: '',
    description: '',
    daily_rent: '',
    security_deposit: '0',
    image_url: '',
    is_active: true
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  // Fetch bikes from Backend API
  const fetchBikes = async () => {
    try {
      setLoading(true)
      const data = await bikeService.getAllBikes({
        is_active_only: false, // show all so admin can manage inactive too
        brand: selectedBrand !== 'All' ? selectedBrand : undefined,
        search: search.trim() || undefined
      })
      setBikes(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch bikes:', err)
      setError('Could not connect to FastAPI server. Please ensure the backend is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBikes()
  }, [selectedBrand])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchBikes()
  }

  const openCreateModal = () => {
    setEditingBike(null)
    setFormData({
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
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (bike) => {
    setEditingBike(bike)
    setFormData({
      name: bike.name,
      brand: bike.brand,
      model: bike.model,
      registration_number: bike.registration_number,
      description: bike.description || '',
      daily_rent: bike.daily_rent,
      security_deposit: bike.security_deposit || '0',
      image_url: bike.image_url || '',
      is_active: bike.is_active
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setFormSubmitting(true)
    setFormError(null)

    try {
      const payload = {
        ...formData,
        daily_rent: parseFloat(formData.daily_rent),
        security_deposit: parseFloat(formData.security_deposit || 0)
      }

      if (editingBike) {
        await bikeService.updateBike(editingBike.id, payload)
      } else {
        await bikeService.createBike(payload)
      }

      setIsModalOpen(false)
      fetchBikes()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save bike. Please check the inputs.'
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (bikeId) => {
    if (window.confirm('Are you sure you want to delete/deactivate this bike?')) {
      try {
        await bikeService.deleteBike(bikeId, false)
        fetchBikes()
      } catch (err) {
        alert('Failed to delete bike: ' + (err.response?.data?.detail || err.message))
      }
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header and Admin Action */}
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
            {isAdmin ? 'Fleet Management & Available Bikes' : 'Explore Available Bikes'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isAdmin
              ? 'Real-time bike fleet directly connected to FastAPI & MySQL Workbench.'
              : 'Browse and rent verified two-wheelers in Jagityal for hourly or daily rides.'}
          </p>
        </div>

        {/* Admin Add Bike Button - Only visible to Admin */}
        {isAdmin && (
          <button
            onClick={openCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--primary)',
              color: '#ffffff',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              boxShadow: 'var(--shadow-md)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Add New Bike (Admin)
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <form onSubmit={handleSearchSubmit} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.6rem 1rem',
          minWidth: '280px',
          flex: '1'
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by bike name, brand, model, or plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
          />
          <button type="submit" style={{ background: 'transparent', fontWeight: 600, color: 'var(--primary)' }}>
            Search
          </button>
        </form>

        {dynamicBrands.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {dynamicBrands.map(b => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: selectedBrand === b ? 'var(--primary)' : 'var(--bg-card)',
                  color: selectedBrand === b ? '#ffffff' : 'var(--text-muted)',
                  border: '1px solid var(--border)'
                }}
              >
                {b}
              </button>
            ))}
          </div>
        )}
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
          marginBottom: '2rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading bikes from MySQL database...
        </div>
      ) : bikes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <h3>{isAdmin ? 'No bikes found in the database.' : 'No bikes available at the moment.'}</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem 0' }}>
            {isAdmin
              ? 'Click the button below to add your first bike as Admin!'
              : 'Please check back later or try adjusting your search filters.'}
          </p>
          {isAdmin && (
            <button
              onClick={openCreateModal}
              style={{
                background: 'var(--primary)',
                color: '#ffffff',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Add First Bike
            </button>
          )}
        </div>
      ) : (
        /* Bike Cards Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '1.75rem'
        }}>
          {bikes.map(bike => (
            <div key={bike.id} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ position: 'relative', height: '190px', background: '#0f172a' }}>
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
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    color: '#94a3b8'
                  }}>
                    <Bike size={44} color="#60a5fa" />
                    <span style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: '#94a3b8' }}>{bike.brand}</span>
                  </div>
                )}
                <span style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: bike.is_active ? '#dcfce7' : '#fee2e2',
                  color: bike.is_active ? '#166534' : '#991b1b'
                }}>
                  {bike.is_active ? 'Available' : 'Deactivated'}
                </span>
              </div>

              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {bike.brand}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: 'var(--bg-main)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                    {bike.registration_number}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.4rem 0 0.25rem 0' }}>
                  {bike.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {bike.model}
                </p>

                {/* Price */}
                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)'
                }}>
                  <div>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)' }}>
                      ₹{bike.daily_rent}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/day</span>
                    {bike.security_deposit > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Deposit: ₹{bike.security_deposit}
                      </div>
                    )}
                  </div>

                  {/* Actions: Edit & Delete only for Admin, Rent Now for all */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(bike)}
                          title="Edit Bike (Admin)"
                          style={{
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border)',
                            padding: '0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(bike.id)}
                          title="Delete Bike (Admin)"
                          style={{
                            background: '#fee2e2',
                            border: 'none',
                            padding: '0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            color: '#991b1b',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    <Link
                      to={`/bikes/${bike.id}`}
                      style={{
                        background: bike.is_active ? 'var(--primary)' : '#94a3b8',
                        color: '#ffffff',
                        padding: '0.5rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      Rent Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Add / Edit Bike Modal - Only for Admin */}
      {isAdmin && isModalOpen && (
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
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {editingBike ? 'Edit Bike Details' : 'Add New Bike to Fleet'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Bike Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Enfield Classic 350"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
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
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
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
                    value={formData.daily_rent}
                    onChange={(e) => setFormData({ ...formData, daily_rent: e.target.value })}
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
                    value={formData.security_deposit}
                    onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
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
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Description / Features
                </label>
                <textarea
                  rows="2"
                  placeholder="Optional notes about bike condition or inclusions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="is_active" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  Active & Available in fleet
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    padding: '0.65rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    background: 'var(--primary)',
                    color: '#ffffff',
                    padding: '0.65rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700
                  }}
                >
                  {formSubmitting ? 'Saving...' : editingBike ? 'Update Bike' : 'Save Bike'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
