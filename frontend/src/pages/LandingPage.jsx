import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiArrowRight, FiStar, FiUsers, FiMapPin, FiHeart } from 'react-icons/fi';
import { GiMeal, GiCook, GiSpoon } from 'react-icons/gi';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: '🌿', title: 'Fresh & Natural', desc: 'Ingredients sourced fresh every morning. No preservatives, no shortcuts.' },
  { icon: '👩‍🍳', title: 'Local Home Chefs', desc: 'Real home cooks from your neighborhood who cook with passion and pride.' },
  { icon: '🍛', title: 'Custom Meals', desc: 'Dietary preferences, spice levels, custom requests — your food, your way.' },
  { icon: '⚡', title: 'Fast Connection', desc: 'Connect with a chef in minutes. Order directly, no middlemen.' },
];

const WHY_ITEMS = [
  { icon: '🏡', label: 'Homemade Feel', desc: 'Every meal cooked with the love and care of a home kitchen.' },
  { icon: '🍲', label: 'Healthy & Wholesome', desc: 'Traditional recipes, clean ingredients, no artificial shortcuts.' },
  { icon: '💸', label: 'Affordable Prices', desc: 'Premium food quality at prices that make sense for everyday eating.' },
  { icon: '👩‍🍳', label: 'Trusted Chefs', desc: 'Verified home chefs with real ratings from real customers.' },
];

const MUMBAI_AREAS = ['Andheri', 'Bandra', 'Dadar', 'Powai', 'Juhu', 'Borivali', 'Thane'];

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale  = useTransform(scrollYProgress, [0, 0.5], [1, 1.08]);

  return (
    <div style={{ position: 'relative' }}>
      <div className="noise-overlay" />

      {/* ─── HERO ─── */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* BG Image */}
        <motion.div style={{ position: 'absolute', inset: 0, scale: heroScale, opacity: heroOpacity }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.75) 50%, rgba(10,10,10,0.4) 100%)',
            zIndex: 1,
          }}/>
          <img
            src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1600&q=80"
            alt="Indian food"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </motion.div>

        {/* Ambient glows */}
        <div className="glow-orb" style={{ width: 600, height: 600, background: 'rgba(160,82,45,0.12)', top: -200, left: -200, zIndex: 2 }} />
        <div className="glow-orb" style={{ width: 400, height: 400, background: 'rgba(160,82,45,0.08)', bottom: 0, right: '10%', zIndex: 2 }} />

        <div className="container" style={{ position: 'relative', zIndex: 5, paddingTop: 100, paddingBottom: 60 }}>
          <div style={{ maxWidth: 720 }}>
            <motion.div
              initial="hidden" animate="visible" variants={stagger}
            >
              {/* Eyebrow */}
              <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
                <span className="section-eyebrow">
                  Mumbai's Finest Home Food
                </span>
              </motion.div>

              {/* Main heading */}
              <motion.h1 variants={fadeUp} style={{
                fontSize: 'clamp(2.8rem, 6vw, 5rem)',
                fontFamily: 'Playfair Display, serif',
                fontWeight: 900,
                lineHeight: 1.1,
                marginBottom: 24,
                color: '#5C3A21',
              }}>
                Taste{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #A0522D, #D4AF37)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Ghar Ka Khana</span>
                {', '}
                <em style={{ fontStyle: 'italic', color: '#c8b89a' }}>Like Never Before</em>
              </motion.h1>

              <motion.p variants={fadeUp} style={{ fontSize: '1.15rem', color: '#a8a8a8', maxWidth: 520, marginBottom: 44, lineHeight: 1.7 }}>
                Handmade meals by home chefs near you — fresh, authentic, and made with the love only a home cook can give.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {user ? (
                  <button onClick={() => navigate(user.role === 'chef' ? '/dashboard' : '/explore')}
                    className="btn-primary" style={{ fontSize: '1rem', padding: '16px 36px' }}>
                    {user.role === 'chef' ? 'My Dashboard' : 'Find Home Food'}{' '}
                    <FiArrowRight />
                  </button>
                ) : (
                  <>
                    <Link to="/auth?tab=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '16px 36px' }}>
                      Get Started <FiArrowRight />
                    </Link>
                    <Link to="/auth?tab=login" className="btn-outline" style={{ fontSize: '1rem', padding: '16px 36px' }}>
                      Login
                    </Link>
                  </>
                )}
              </motion.div>

              {/* Stats */}
              <motion.div variants={fadeUp} style={{ display: 'flex', gap: 40, marginTop: 60, flexWrap: 'wrap' }}>
                {[['500+', 'Home Meals Delivered'], ['50+', 'Verified Chefs'], ['4.8★', 'Average Rating']].map(([val, label]) => (
                  <div key={label}>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: '#5C3A21' }}>{val}</div>
                    <div style={{ fontSize: '0.8rem', color: '#111', letterSpacing: 1 }}>{label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 5, color: '#555', fontSize: '0.75rem', textAlign: 'center', letterSpacing: 2 }}>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, transparent, #A0522D)', margin: '0 auto 8px' }} />
          SCROLL
        </motion.div>
      </section>

      {/* ─── WHY GHAR KA TASTE ─── */}
      <section className="section" style={{ background: 'linear-gradient(180deg, rgba(160,82,45,0.04) 0%, transparent 100%)' }}>
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}
          >
            {/* Left: Image */}
            <motion.div variants={fadeUp} style={{ position: 'relative' }}>
              <div style={{
                borderRadius: 24, overflow: 'hidden',
                boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
                position: 'relative',
              }}>
                <img
                  src="https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80"
                  alt="Thali meal"
                  style={{ width: '100%', height: 500, objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.6) 0%, transparent 60%)' }} />
                {/* Floating badge */}
                <motion.div
                  initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}
                  style={{
                    position: 'absolute', bottom: 24, left: 24,
                    background: 'rgba(10,10,10,0.9)',
                    border: '1px solid rgba(160,82,45,0.4)',
                    borderRadius: 16, padding: '14px 20px',
                    backdropFilter: 'blur(20px)',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: '1.8rem' }}>🍛</div>
                    <div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1rem' }}>Authentic Thali</div>
                      <div style={{ fontSize: '0.75rem', color: '#A0522D', marginTop: 2 }}>Homemade • Fresh Daily</div>
                    </div>
                  </div>
                </motion.div>
              </div>
              {/* Decorative element */}
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(160,82,45,0.2)', zIndex: -1 }} />
              <div style={{ position: 'absolute', top: 20, left: -40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(160,82,45,0.06)', zIndex: -1 }} />
            </motion.div>

            {/* Right: Content */}
            <motion.div variants={fadeUp}>
              <div className="section-eyebrow" style={{ marginBottom: 20 }}>Our Story</div>
              <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', marginBottom: 20 }}>
                Why{' '}
                <span style={{ color: '#A0522D', fontStyle: 'italic' }}>Ghar Ka Taste?</span>
              </h2>
              <p style={{ color: '#a8a8a8', marginBottom: 40, fontSize: '1.05rem', lineHeight: 1.8 }}>
                Born in Mumbai, for Mumbai. We believe every student, professional, and senior deserves the comfort of homemade food — not just on weekends, but every single day.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {WHY_ITEMS.map((item, i) => (
                  <motion.div key={i} variants={fadeUp} className="glass-card"
                    style={{ padding: 20, transition: '0.3s' }}
                    whileHover={{ y: -4, borderColor: 'rgba(160,82,45,0.3)' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>{item.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: '0.82rem', color: '#111', lineHeight: 1.6 }}>{item.desc}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="section">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger}
            style={{ textAlign: 'center', marginBottom: 64 }}>
            <motion.div variants={fadeUp} className="section-eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>
              What We Offer
            </motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)' }}>
              The <span style={{ color: '#A0522D', fontStyle: 'italic' }}>Ghar Ka Taste</span> Promise
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={i} variants={fadeUp}
                className="glass-card"
                whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(160,82,45,0.15)' }}
                style={{ padding: '36px 28px', textAlign: 'center', cursor: 'default', transition: '0.3s' }}>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  style={{ fontSize: '2.5rem', marginBottom: 20 }}>{f.icon}</motion.div>
                <h3 style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: '0.88rem', color: '#111', lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── AREAS WE SERVE ─── */}
      <section className="section" style={{ background: 'rgba(160,82,45,0.03)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="section-eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>Coverage</motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', marginBottom: 16 }}>
              Serving Across <span style={{ color: '#A0522D' }}>Mumbai</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: '#111', marginBottom: 48 }}>
              Home chefs available across all major Mumbai neighborhoods
            </motion.p>
            <motion.div variants={stagger} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              {MUMBAI_AREAS.map(area => (
                <motion.div key={area} variants={fadeUp}
                  whileHover={{ scale: 1.05, borderColor: 'rgba(160,82,45,0.5)' }}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 40,
                    fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', gap: 6, cursor: 'default',
                    transition: '0.3s',
                  }}>
                  <FiMapPin size={13} style={{ color: '#A0522D' }} />
                  {area}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{
              position: 'relative', borderRadius: 32,
              background: 'linear-gradient(135deg, rgba(160,82,45,0.15) 0%, rgba(160,82,45,0.05) 100%)',
              border: '1px solid rgba(160,82,45,0.25)',
              padding: '80px 60px',
              textAlign: 'center', overflow: 'hidden',
            }}>
            <div className="glow-orb" style={{ width: 400, height: 400, background: 'rgba(160,82,45,0.1)', top: -200, left: '50%', transform: 'translateX(-50%)' }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: '3rem', marginBottom: 20 }}>🍛</div>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 16 }}>
                Find Your <span style={{ color: '#A0522D', fontStyle: 'italic' }}>Home Food</span> Today
              </h2>
              <p style={{ color: '#111', fontSize: '1.05rem', marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
                Join thousands of food lovers who found their perfect home chef on Ghar Ka Taste.
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                {user ? (
                  <Link to="/explore" className="btn-primary" style={{ fontSize: '1rem', padding: '16px 40px' }}>
                    Explore Chefs <FiArrowRight />
                  </Link>
                ) : (
                  <>
                    <Link to="/auth?tab=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '16px 40px' }}>
                      Get Started Free <FiArrowRight />
                    </Link>
                    <Link to="/auth?tab=login" className="btn-outline" style={{ fontSize: '1rem', padding: '16px 36px' }}>
                      I Have an Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#5C3A21' }}>
            Ghar Ka Taste
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontSize: '0.83rem' }}>
            Made with <FiHeart style={{ color: '#A0522D' }} /> for Mumbai's home cooks
          </div>
          <div style={{ color: '#444', fontSize: '0.83rem' }}>
            © 2026 Ghar Ka Taste. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
