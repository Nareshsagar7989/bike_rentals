import { Link } from 'react-router-dom'
import { ShieldCheck, Zap, Clock, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <Zap size={24} color="#2563eb" />,
      title: "Instant Booking",
      desc: "Pick your favorite bike, choose your rental duration, and hit the road immediately."
    },
    {
      icon: <ShieldCheck size={24} color="#16a34a" />,
      title: "Verified & Maintained",
      desc: "Every bike undergoes strict safety inspections before each ride."
    },
    {
      icon: <Clock size={24} color="#f97316" />,
      title: "Flexible Hourly & Daily",
      desc: "Rent for a quick 2-hour errand or an unforgettable weekend road trip."
    }
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '4rem 2.5rem',
        textAlign: 'center',
        marginTop: '1rem',
        border: '1px solid #bfdbfe'
      }}>
        <span style={{
          display: 'inline-block',
          background: '#ffffff',
          color: 'var(--primary)',
          padding: '0.35rem 0.9rem',
          borderRadius: '999px',
          fontWeight: 700,
          fontSize: '0.85rem',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          ⚡ Premium Bike Rentals in Town
        </span>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          color: 'var(--secondary)',
          lineHeight: 1.15,
          marginBottom: '1.25rem'
        }}>
          Ride Without Limits. <br />
          <span style={{ color: 'var(--primary)' }}>Rent Effortlessly.</span>
        </h1>
        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-muted)',
          maxWidth: '600px',
          margin: '0 auto 2.5rem auto'
        }}>
          Choose from sport bikes, cruisers, scooters, and electric two-wheelers at unbeatable prices.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link to="/bikes" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--primary)',
            color: '#ffffff',
            padding: '0.85rem 1.75rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: 'var(--shadow-md)'
          }}>
            Explore Available Bikes <ArrowRight size={18} />
          </Link>
          <Link to="/my-rentals" style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#ffffff',
            color: 'var(--secondary)',
            border: '1px solid var(--border)',
            padding: '0.85rem 1.75rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            textDecoration: 'none'
          }}>
            My Bookings
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ margin: '4rem 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.85rem', fontWeight: 800, marginBottom: '2.5rem' }}>
          Why Choose BikeRental?
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                background: 'var(--bg-main)',
                width: '50px',
                height: '50px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
