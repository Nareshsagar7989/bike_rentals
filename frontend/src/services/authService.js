import api from './api'

const TOKEN_KEY = 'bike_rental_token'
const USER_KEY = 'bike_rental_user'

export const authService = {
  // Login with credentials (either admin or registered customer)
  async login(email, password) {
    const response = await api.post('/auth/login', {
      email: email.trim(),
      password,
    })

    if (response.data && response.data.access_token) {
      localStorage.setItem(TOKEN_KEY, response.data.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user))
    }
    return response.data
  },

  // Register a new customer
  async register(userData) {
    const response = await api.post('/auth/register', {
      full_name: userData.full_name || userData.name,
      email: userData.email.trim(),
      phone_number: userData.phone_number || userData.phone,
      password: userData.password,
    })

    if (response.data && response.data.access_token) {
      localStorage.setItem(TOKEN_KEY, response.data.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user))
    }
    return response.data
  },

  // Logout
  logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    window.dispatchEvent(new Event('authChange'))
  },

  // Get stored token
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  // Get stored user info
  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY)
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  },

  // Check if authenticated
  isAuthenticated() {
    return !!this.getToken()
  },

  // Check if current user is admin
  isAdmin() {
    const user = this.getCurrentUser()
    return user && user.role === 'admin'
  },
}

export default authService
