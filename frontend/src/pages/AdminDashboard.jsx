import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FiCheckCircle, FiXCircle, FiMapPin, FiPhone, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth, API, SERVER_URL } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // State for expanded meal views
  const [expandedChefId, setExpandedChefId] = useState(null);
  const [chefMeals, setChefMeals] = useState({});
  const [loadingMeals, setLoadingMeals] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchChefs = async () => {
    try {
      const r = await axios.get(`${API}/admin/chefs`);
      setChefs(r.data);
    } catch (e) {
      console.error(e);
      showToast('Error fetching chefs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChefs(); }, []);

  const handleVerifyChefToggle = async (chefId) => {
    try {
      const r = await axios.patch(`${API}/admin/verify-chef/${chefId}`);
      setChefs(prev => prev.map(c => c.id === chefId ? { ...c, is_verified: r.data.is_verified } : c));
      showToast(r.data.is_verified ? 'Chef Verified' : 'Chef Verification Revoked');
    } catch (e) {
      showToast('Error toggling chef verification', 'error');
    }
  };

  const loadMealsForChef = async (chefId) => {
    if (expandedChefId === chefId) {
      setExpandedChefId(null);
      return;
    }
    setExpandedChefId(chefId);
    if (!chefMeals[chefId]) {
      setLoadingMeals(true);
      try {
        const r = await axios.get(`${API}/chefs/${chefId}/meals`);
        setChefMeals(prev => ({ ...prev, [chefId]: r.data }));
      } catch (e) {
        showToast('Error loading meals', 'error');
      } finally {
        setLoadingMeals(false);
      }
    }
  };

  const handleVerifyMealToggle = async (mealId, chefId) => {
    try {
      const r = await axios.patch(`${API}/admin/verify-meal/${mealId}`);
      setChefMeals(prev => ({
        ...prev,
        [chefId]: prev[chefId].map(m => m.id === mealId ? { ...m, is_verified: r.data.is_verified } : m)
      }));
      showToast(r.data.is_verified ? 'Food Item Verified' : 'Food Verification Revoked');
    } catch (e) {
      showToast('Error toggling meal verification', 'error');
    }
  };

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(160,82,45,0.2)', borderTopColor: '#A0522D' }} />
    </div>
  );

  return (
    <div className="page-container" style={{ minHeight: '100vh', paddingBottom: 80 }}>
      <div className="noise-overlay" />
      <div className="glow-orb" style={{ width: 500, height: 300, background: 'rgba(160,82,45,0.06)', top: 0, right: 0 }} />

      <div className="container" style={{ position: 'relative', zIndex: 2, paddingTop: 40 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 40 }}>
          <div className="section-eyebrow" style={{ marginBottom: 12 }}>Admin Portal</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: '#5C3A21' }}>
            Verification Center 🛡️
          </h1>
          <p style={{ color: '#111', marginTop: 6 }}>
            Verify chef profiles and their individual food items.
          </p>
        </motion.div>

        {/* Chefs List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {chefs.map((chef, idx) => (
            <motion.div
              key={chef.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="glass-card chef-admin-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderLeft: chef.is_verified ? '4px solid #4ade80' : '4px solid #f87171',
                overflow: 'hidden'
              }}>
              
              {/* Chef Top Section */}
              <div className="chef-admin-grid" style={{ display: 'flex', gap: 24, padding: 24 }}>
                <div className="chef-admin-img-wrapper" style={{ width: 140, height: 140, borderRadius: 16, overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={chef.image_url ? `${SERVER_URL}${chef.image_url}` : 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=70'}
                    alt={chef.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <h3 style={{ fontSize: '1.4rem', color: '#5C3A21', fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>
                          {chef.name}
                        </h3>
                        <div style={{ color: '#A0522D', fontSize: '0.85rem', marginTop: 4, fontWeight: 500 }}>
                          {chef.speciality || 'General Cuisine'}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleVerifyChefToggle(chef.id)}
                        className="admin-verify-btn"
                        style={{
                          padding: '10px 20px',
                          borderRadius: 40,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          transition: '0.2s',
                          background: chef.is_verified ? 'rgba(248,113,113,0.1)' : 'linear-gradient(135deg, #A0522D, #C8763A)',
                          color: chef.is_verified ? '#f87171' : 'white',
                          whiteSpace: 'nowrap'
                        }}>
                        {chef.is_verified ? <FiXCircle size={16} /> : <FiCheckCircle size={16} />}
                        {chef.is_verified ? 'Revoke Profile' : 'Verify Profile'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#aaa', fontSize: '0.85rem' }}>
                        <FiMapPin size={14} style={{ color: '#C8763A' }} /> {chef.location}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#aaa', fontSize: '0.85rem' }}>
                        <FiPhone size={14} style={{ color: '#C8763A' }} /> {chef.phone}
                      </div>
                    </div>

                    {chef.bio && (
                      <p style={{ marginTop: 12, color: '#111', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                        "{chef.bio}"
                      </p>
                    )}
                  </div>
                  
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, marginTop: 16 }}>
                    <button onClick={() => loadMealsForChef(chef.id)}
                      style={{ background: 'none', border: 'none', color: '#A0522D', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0 }}>
                      {expandedChefId === chef.id ? 'Hide Menu Items' : 'Review Individual Food Items'}
                      {expandedChefId === chef.id ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Meals Accordion */}
              <AnimatePresence>
                {expandedChefId === chef.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ fontSize: '1rem', color: '#5C3A21', marginBottom: 16 }}>Food Verification Queue</h4>
                      
                      {loadingMeals && <div style={{ color: '#111', fontSize: '0.9rem' }}>Loading meals...</div>}
                      
                      {!loadingMeals && chefMeals[chef.id] && chefMeals[chef.id].length === 0 && (
                        <div style={{ color: '#111', fontSize: '0.9rem' }}>No meals added by this chef yet.</div>
                      )}

                      {!loadingMeals && chefMeals[chef.id] && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                          {chefMeals[chef.id].map(meal => (
                            <div key={meal.id} style={{
                              background: 'rgba(255,255,255,0.03)', border: `1px solid ${meal.is_verified ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.08)'}`,
                              borderRadius: 12, padding: 16, position: 'relative'
                            }}>
                              <div style={{ display: 'flex', gap: 12 }}>
                                {meal.image_url ? (
                                  <img src={`${SERVER_URL}${meal.image_url}`} alt={meal.name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: 60, height: 60, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🍲</div>
                                )}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#5C3A21' }}>{meal.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#A0522D', marginTop: 2 }}>{meal.category} • ₹{meal.price}</div>
                                  <div style={{ fontSize: '0.75rem', color: meal.is_veg ? '#4ade80' : '#f87171', marginTop: 2 }}>
                                    {meal.is_veg ? '🟩 Pure Veg' : '🟥 Non-Veg'}
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => handleVerifyMealToggle(meal.id, chef.id)}
                                style={{
                                  width: '100%', marginTop: 12, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                                  border: 'none', fontWeight: 600, fontSize: '0.8rem', transition: '0.2s',
                                  background: meal.is_verified ? 'rgba(248,113,113,0.1)' : 'rgba(160,82,45,0.15)',
                                  color: meal.is_verified ? '#f87171' : '#5C3A21',
                                }}>
                                {meal.is_verified ? 'Revoke Food' : 'Approve Food Item'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          ))}

          {chefs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#111' }}>
              <FiCheckCircle size={40} style={{ opacity: 0.5, marginBottom: 16 }} />
              <p>No chefs found in the system.</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`toast ${toast.type}`}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
