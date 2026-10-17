import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import BikesPage from './pages/BikesPage'
import BikeDetailsPage from './pages/BikeDetailsPage'
import BookingsPage from './pages/BookingsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Bar across all pages */}
        <Navbar />

        {/* Dynamic Route Content */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/bikes" element={<BikesPage />} />
            <Route path="/bikes/:id" element={<BikeDetailsPage />} />
            <Route path="/my-rentals" element={<BookingsPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        {/* Minimal Footer */}
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '1.5rem 2rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          background: '#ffffff'
        }}>
          © {new Date().getFullYear()} BikeRental Management System. All rights reserved.
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
