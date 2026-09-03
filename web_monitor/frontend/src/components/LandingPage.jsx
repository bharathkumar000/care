import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ActivitySquare, ArrowRight, ShieldCheck, Users, MessageSquare, 
  Award, FileText, CheckCircle2, ChevronRight, Mail, Phone, MapPin 
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmailInput('');
    }
  };

  return (
    <div className="landing-page">
      {/* 1. HERO BANNER */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <span className="preview-badge">Official Portal & Telemetry</span>
            <h1>Whitepaper on the Future of Clinical Telemetry & Remote Monitoring</h1>
            <p>
              Deliver real-time telemetry tracking, vital sign monitoring, ECG waveform streaming, and automated emergency alert dispatch for healthcare professionals.
            </p>
            <div className="hero-actions">
              <button onClick={() => navigate('/login')} className="btn-pill btn-pill-white">
                Access Portal <ArrowRight size={18} />
              </button>
              <a href="#about" className="btn-pill btn-pill-white-outline">
                Learn More
              </a>
            </div>
          </div>

          <div className="hero-preview-card">
            <span className="preview-badge">C.A.R.E. Intelligent Platform</span>
            <h3 className="preview-title">Clinical Telemetry & Dashboard</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Continuous monitoring of ECG waveforms, Heart Rate (HR), Stress Index (GSR), and real-time panic alert notifications.
            </p>
            <div className="preview-stats-grid">
              <div>
                <div className="preview-stat-number">600+</div>
                <div className="preview-stat-label">Partner Clinics</div>
              </div>
              <div>
                <div className="preview-stat-number">99.9%</div>
                <div className="preview-stat-label">API Uptime</div>
              </div>
              <div>
                <div className="preview-stat-number">&lt; 50ms</div>
                <div className="preview-stat-label">Telemetry Latency</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT SECTION */}
      <section id="about" className="about-section">
        <div className="section-container">
          <div className="about-grid">
            <div className="about-text">
              <div className="section-tag">ABOUT C.A.R.E.</div>
              <h2 className="section-heading">A Modern Vision for Connected Healthcare</h2>
              <p>
                The C.A.R.E. platform empowers practitioners, hospitals, and specialized clinics with secure, real-time medical data streams and telemetry infrastructure.
              </p>
              <p>
                Our certified infrastructure provides seamless interconnections between wearable physiological sensors, care teams, and decision-support dashboards.
              </p>
              <div style={{ marginTop: '1.5rem' }}>
                <button onClick={() => navigate('/login')} className="btn-pill btn-pill-navy">
                  Join the Network
                </button>
              </div>
            </div>

            <div className="about-card">
              <div className="preview-badge">DOCUMENTATION & RESEARCH</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem' }}>
                Clinical Telemetry Whitepaper
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                A comprehensive guide outlining security standards, physiological threshold configurations, and emergency alert dispatch protocols for clinical settings.
              </p>
              <button onClick={() => navigate('/login')} className="btn-pill btn-pill-outline" style={{ fontSize: '0.85rem' }}>
                Download Whitepaper (PDF)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FULL-WIDTH DEEP NAVY BANNER */}
      <section className="navy-banner">
        <div className="navy-banner-content">
          <h2>Join a Network of 600+ Healthcare Professionals</h2>
          <p style={{ opacity: 0.9, fontSize: '1.05rem', marginBottom: '1.75rem' }}>
            Collaborate with fellow clinicians, configure real-time threshold alerts, and access advanced telemetry tools.
          </p>
          <button onClick={() => navigate('/login')} className="btn-pill btn-pill-white">
            Become a Member or Partner
          </button>
        </div>
      </section>

      {/* 4. 3-COLUMN FEATURE CARDS GRID */}
      <section className="features-section">
        <div className="section-container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
            <div className="section-tag">WHY CHOOSE C.A.R.E.?</div>
            <h2 className="section-heading">Built for Your Clinical Needs</h2>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-circle">
                <MessageSquare size={28} />
              </div>
              <h3>Connect with Colleagues</h3>
              <p>
                Directly communicate with fellow practitioners and telemetry specialists for optimal interdisciplinary patient care.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-circle">
                <CheckCircle2 size={28} />
              </div>
              <h3>Clinical Consultations</h3>
              <p>
                Share insights on clinical protocol advancements and customize patient vigilance thresholds in real time.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-circle">
                <Award size={28} />
              </div>
              <h3>Exclusive Benefits</h3>
              <p>
                Access a full suite of monitoring tools, personalized dashboards, and automated physiological alert reports.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* 7. FOOTER SECTION */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>
              <ActivitySquare size={26} color="var(--primary)" />
              <span>C.A.R.E. Network</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '320px' }}>
              Medical telemetry network and intelligent platform for real-time vital sign monitoring and alert dispatch.
            </p>
          </div>

          <div className="footer-col">
            <h4>Navigation</h4>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#news">Updates</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Portal Access</h4>
            <ul className="footer-links">
              <li><a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Doctor Dashboard</a></li>
              <li><a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Patient View</a></li>
              <li><a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Administration</a></li>
              <li><a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>API Gateway</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Subscribe to Newsletter</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Receive the latest clinical research and system updates.
            </p>
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="newsletter-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
              <button type="submit" className="btn-pill btn-pill-navy" style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem' }}>
                {subscribed ? 'Subscribed Successfully!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© 2026 C.A.R.E. Healthcare Monitoring Network. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
