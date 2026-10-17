import api from './api'

export const bikeService = {
  // Get all bikes with optional filters
  getAllBikes: async (params = {}) => {
    const response = await api.get('/bikes/', { params })
    return response.data
  },

  // Get a single bike by ID
  getBikeById: async (id) => {
    const response = await api.get(`/bikes/${id}`)
    return response.data
  },

  // Admin creates a new bike
  createBike: async (bikeData) => {
    const response = await api.post('/bikes/', bikeData)
    return response.data
  },

  // Admin updates bike details
  updateBike: async (id, bikeData) => {
    const response = await api.put(`/bikes/${id}`, bikeData)
    return response.data
  },

  // Admin deletes / deactivates bike
  deleteBike: async (id, hardDelete = false) => {
    const response = await api.delete(`/bikes/${id}`, {
      params: { hard_delete: hardDelete }
    })
    return response.data
  },

  // Check real-time date availability for a bike
  checkAvailability: async (id, pickupDatetime, returnDatetime) => {
    const response = await api.get(`/bikes/${id}/availability`, {
      params: {
        pickup_datetime: pickupDatetime,
        return_datetime: returnDatetime
      }
    })
    return response.data
  }
}
