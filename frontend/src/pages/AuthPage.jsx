import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FiMail, FiLock, FiUser, FiArrowRight, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { GiMeal } from 'react-icons/gi';
import { useAuth, API, SERVER_URL } from '../context/AuthContext';

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 30 : -30, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -30 : 30, opacity: 0 }),
};

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login');
  const [step, setStep] = useState(1); // 1 = Details, 2 = Verify OTP
  const [dir, setDir] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [otpCode, setOtpCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { 
    if (user) {
      if (user.role === 'admin') navigate('/admin-dashboard');
      else navigate(user.role === 'chef' ? '/dashboard' : '/explore'); 
    }
  }, [user, navigate]);

  const switchTab = (t) => {
    setDir(t === 'signup' ? 1 : -1);
    setTab(t);
    setStep(1);
    setError('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    if (!email.trim() || !password || password.length < 6) return setError('Invalid email or password (min 6 chars)');
    
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/auth/send-otp`, { email });
      setStep(2);
      setDir(1);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWithOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) return setError('Invalid OTP');
    
    setError('');
    setLoading(true);
    try {
      const u = await register(name, email, password, role, otpCode);
      if (u.role === 'admin') navigate('/admin-dashboard');
      else navigate(u.role === 'chef' ? '/dashboard' : '/explore');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email, password);
      if (u.role === 'admin') navigate('/admin-dashboard');
      else navigate(u.role === 'chef' ? '/dashboard' : '/explore');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-primary)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div className="noise-overlay" />

      {/* Left: Visual */}
      <motion.div
        initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
        style={{ flex: 1, position: 'relative', display: 'none' }}
        className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1596797038530-2c107229654b?w=900&q=80"
          alt="Indian food"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(10,10,10,0) 0%, rgba(10,10,10,0.9) 100%)',
        }} />
        <div style={{ position: 'absolute', bottom: 60, left: 40, right: 40 }}>
          <blockquote style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontStyle: 'italic', color: '#5C3A21', lineHeight: 1.4 }}>
            "Ghar jaisa khana, <span style={{ color: '#A0522D' }}>har din</span>"
          </blockquote>
          <p style={{ color: '#111', marginTop: 12, fontSize: '0.9rem' }}>Home food, every day.</p>
        </div>
      </motion.div>

      {/* Right: Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 2 }}>
        <div className="glow-orb" style={{ width: 500, height: 500, background: 'rgba(160,82,45,0.08)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

        <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 2 }}>
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 40 }}>
            <Link to="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, #A0522D, #C8763A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(160,82,45,0.4)',
              }}>
                <GiMeal style={{ color: 'white', fontSize: '1.6rem' }} />
              </div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.3rem', color: '#5C3A21' }}>
                Ghar Ka Taste
              </div>
            </Link>
          </motion.div>

          {/* Tab switcher */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              style={{
                display: 'flex', background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: 40, padding: 4, marginBottom: 36,
              }}>
              {['login', 'signup'].map(t => (
                <button key={t} onClick={() => switchTab(t)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 36,
                    fontWeight: 600, fontSize: '0.9rem', letterSpacing: 0.5,
                    transition: 'all 0.3s', cursor: 'pointer',
                    background: tab === t ? 'linear-gradient(135deg, #A0522D, #C8763A)' : 'transparent',
                    color: tab === t ? 'white' : '#111',
                    boxShadow: tab === t ? '0 4px 20px rgba(160,82,45,0.3)' : 'none',
                    border: 'none',
                  }}>
                  {t === 'login' ? 'Login' : 'Sign Up'}
                </button>
              ))}
            </motion.div>
          )}

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card"
            style={{ padding: '36px 32px' }}>
            <AnimatePresence mode="wait" custom={dir}>
              <motion.form key={`${tab}-${step}`}
                custom={dir}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25 }}
                onSubmit={tab === 'login' ? handleLogin : (step === 1 ? handleSendOtp : handleRegisterWithOtp)}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {step === 2 && (
                    <button type="button" onClick={() => { setStep(1); setDir(-1); setError(''); }}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiArrowLeft />
                    </button>
                  )}
                  <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>
                      {tab === 'login' ? 'Welcome back' : (step === 1 ? 'Create account' : 'Verify Email')}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#111', marginTop: -8, marginBottom: 8 }}>
                      {tab === 'login' ? 'Sign in to find your home food' : (step === 1 ? 'Join Ghar Ka Taste today' : `Enter the 6-digit code sent to ${email}`)}
                    </p>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, color: '#f87171', fontSize: '0.85rem' }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {step === 1 && (
                  <>
                    {/* Name (signup only) */}
                    {tab === 'signup' && (
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                          <FiUser size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                          <input type="text" className="form-input" placeholder="Your full name"
                            value={name} onChange={e => setName(e.target.value)} required
                            style={{ paddingLeft: 40 }} />
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <div style={{ position: 'relative' }}>
                        <FiMail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                        <input type="email" className="form-input" placeholder="your@email.com"
                          value={email} onChange={e => setEmail(e.target.value)} required
                          style={{ paddingLeft: 40 }} />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <div style={{ position: 'relative' }}>
                        <FiLock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                        <input type={showPass ? 'text' : 'password'} className="form-input" placeholder="Min 6 characters"
                          value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                          style={{ paddingLeft: 40, paddingRight: 40 }} />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#555', cursor: 'pointer', background: 'none', border: 'none' }}>
                          {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Role (signup only) */}
                    {tab === 'signup' && (
                      <div className="form-group">
                        <label className="form-label">I want to</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {[['customer', '🍽️', 'Order Food', 'Find home chefs'], ['chef', '👩‍🍳', 'Cook Food', 'Become a chef']].map(([r, emoji, title, desc]) => (
                            <button key={r} type="button" onClick={() => setRole(r)}
                              style={{
                                padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
                                border: `1px solid ${role === r ? 'rgba(160,82,45,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                background: role === r ? 'rgba(160,82,45,0.12)' : 'rgba(255,255,255,0.03)',
                                color: '#5C3A21', textAlign: 'center', transition: '0.2s',
                              }}>
                              <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{emoji}</div>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{title}</div>
                              <div style={{ fontSize: '0.72rem', color: '#111', marginTop: 2 }}>{desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Step 2: OTP Input */}
                {step === 2 && tab === 'signup' && (
                  <div className="form-group" style={{ marginTop: 10 }}>
                    <label className="form-label">6-Digit OTP</label>
                    <input type="text" className="form-input" placeholder="e.g. 123456"
                      value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required style={{ fontSize: '1.2rem', padding: '12px 16px', letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }} />
                  </div>
                )}

                <motion.button type="submit" disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary"
                  style={{ justifyContent: 'center', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Please wait...' : tab === 'login' ? 'Login to Your Account' : (step === 1 ? 'Continue' : 'Verify & Create Account')}
                  {!loading && (step === 1 ? <FiArrowRight /> : undefined)}
                </motion.button>

                {step === 1 && (
                  <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#111' }}>
                    {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button type="button" onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}
                      style={{ color: '#A0522D', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600 }}>
                      {tab === 'login' ? 'Sign up' : 'Login'}
                    </button>
                  </p>
                )}
              </motion.form>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .auth-visual { display: block !important; }
        }
      `}</style>
    </div>
  );
}
