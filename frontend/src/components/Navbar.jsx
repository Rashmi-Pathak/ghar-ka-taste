import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiTrash2 } from 'react-icons/fi';
import { GiMeal } from 'react-icons/gi';

export default function Navbar() {
  const { user, logout, deleteAccount } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/'); setMobileOpen(false); };
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete your account?')) {
      await deleteAccount();
      navigate('/');
    }
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === 'customer') return { to: '/explore', label: 'Find Chefs' };
    if (user.role === 'chef') return { to: '/dashboard', label: 'My Dashboard' };
    if (user.role === 'admin') return { to: '/admin-dashboard', label: 'Admin Dashboard' };
    return null;
  };
  const dashLink = getDashboardLink();

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          background: 'rgba(90,58,42,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(160,82,45,0.2)',
          padding: '0 24px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setMobileOpen(false)}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #A0522D, #C8763A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(160,82,45,0.4)',
          }}>
            <GiMeal style={{ color: 'white', fontSize: '1.1rem' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1rem', color: '#f5e6df', lineHeight: 1 }}>
              Ghar Ka Taste
            </div>
            <div style={{ fontSize: '0.55rem', letterSpacing: 3, color: '#D4AF37', textTransform: 'uppercase', marginTop: 2 }}>
              Homemade · Authentic
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="desktop-only" style={{ alignItems: 'center', gap: 12 }}>
          {!user ? (
            <>
              <Link to="/auth?tab=login" className="btn-ghost" style={{ fontSize: '0.85rem', color: '#D4AF37', marginRight: '0.5rem', borderRight: '1px solid rgba(212,175,55,0.3)', paddingRight: '1.5rem' }}>
                Admin Login
              </Link>
              <Link to="/auth?tab=login" className="btn-ghost" style={{ fontSize: '0.9rem' }}>Login</Link>
              <Link to="/auth?tab=signup" className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>Sign Up</Link>
            </>
          ) : (
            <>
              {dashLink && (
                <Link to={dashLink.to}
                  className={location.pathname === dashLink.to ? 'btn-primary' : 'btn-ghost'}
                  style={{ fontSize: '0.9rem', padding: '10px 20px' }}>
                  {dashLink.label}
                </Link>
              )}
              {/* Profile dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px',
                    background: 'rgba(212,175,55,0.1)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    borderRadius: 40, cursor: 'pointer', color: '#f5e6df'
                  }}>
                  <FiUser size={15} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{user.name.split(' ')[0]}</span>
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                        background: '#4a3530',
                        border: '1px solid rgba(160,82,45,0.3)',
                        borderRadius: 12, padding: 8, minWidth: 180,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      }}>
                      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(160,82,45,0.2)', marginBottom: 4 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f5e6df' }}>{user.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#D4AF37', textTransform: 'capitalize', marginTop: 2 }}>{user.role}</div>
                      </div>
                      <button onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', color: '#d4c5b9', fontSize: '0.85rem', borderRadius: 8 }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <FiLogOut size={14} /> Logout
                      </button>
                      <button onClick={handleDelete}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', color: '#f87171', fontSize: '0.85rem', borderRadius: 8 }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <FiTrash2 size={14} /> Delete Account
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="mobile-flex"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#f5e6df', alignItems: 'center', justifyContent: 'center',
          }}>
          {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: 68, left: 0, right: 0, zIndex: 999,
              background: 'rgba(90,58,42,0.98)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(160,82,45,0.2)',
              padding: '20px 24px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
            {!user ? (
              <>
                <Link to="/auth?tab=login" onClick={() => setMobileOpen(false)}
                  style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(212,175,55,0.1)', color: '#D4AF37', fontWeight: 600, textAlign: 'center' }}>
                  Admin Login
                </Link>
                <Link to="/auth?tab=login" onClick={() => setMobileOpen(false)}
                  style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(212,175,55,0.1)', color: '#f5e6df', fontWeight: 500, textAlign: 'center' }}>
                  Login
                </Link>
                <Link to="/auth?tab=signup" onClick={() => setMobileOpen(false)}
                  style={{ padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg, #A0522D, #C8763A)', color: 'white', fontWeight: 600, textAlign: 'center' }}>
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(212,175,55,0.1)', marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, color: '#f5e6df' }}>{user.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#D4AF37', textTransform: 'capitalize', marginTop: 2 }}>{user.role}</div>
                </div>
                {dashLink && (
                  <Link to={dashLink.to} onClick={() => setMobileOpen(false)}
                    style={{ padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg, #A0522D, #C8763A)', color: 'white', fontWeight: 600, textAlign: 'center' }}>
                    {dashLink.label}
                  </Link>
                )}
                <button onClick={handleLogout}
                  style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(212,175,55,0.1)', color: '#d4c5b9', fontWeight: 500, textAlign: 'center', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <FiLogOut size={16} /> Logout
                </button>
                <button onClick={handleDelete}
                  style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(248,113,113,0.08)', color: '#f87171', fontWeight: 500, textAlign: 'center', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <FiTrash2 size={16} /> Delete Account
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
