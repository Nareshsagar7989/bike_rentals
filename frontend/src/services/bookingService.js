import api from './api'

export const bookingService = {
  // Get all bookings (optional status filter for admin)
  getAllBookings: async (params = {}) => {
    const response = await api.get('/bookings/', { params })
    return response.data
  },

  // Get a single booking by ID
  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`)
    return response.data
  },

  // Create a new booking request (Customer)
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings/', bookingData)
    return response.data
  },

  // Update booking status (Admin: confirmed, rejected, ongoing, completed, cancelled)
  updateStatus: async (id, status, adminNotes = '') => {
    const response = await api.patch(`/bookings/${id}/status`, {
      status: status,
      admin_notes: adminNotes
    })
    return response.data
  }
}
