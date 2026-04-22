import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FiSave, FiEdit3, FiTrash2, FiUpload, FiToggleLeft, FiToggleRight, FiStar, FiMapPin, FiPhone, FiPlus, FiX, FiUser, FiMenu, FiShoppingBag, FiMessageSquare, FiCheck, FiClock, FiTruck } from 'react-icons/fi';
import { useAuth, API, SERVER_URL } from '../context/AuthContext';

const AREAS = ['Andheri', 'Bandra', 'Dadar', 'Powai', 'Juhu', 'Borivali', 'Thane', 'Chembur', 'Kurla', 'Malad'];

const PLACEHOLDER = {
  name: '', location: '', area: 'Andheri', menu: '', speciality: '', price_range: '', phone: '', bio: ''
};

const MEAL_PLACEHOLDER = {
  category: 'Breakfast', name: '', ingredients: '', is_veg: 1, price: ''
};

const ORDER_STATUS_FLOW = [
  { key: 'pending',          label: 'Pending',          next: 'confirmed',        nextLabel: 'Confirm Order',       color: '#FFA500' },
  { key: 'confirmed',        label: 'Confirmed',        next: 'preparing',        nextLabel: 'Start Preparing',     color: '#3B82F6' },
  { key: 'preparing',        label: 'Preparing',        next: 'out_for_delivery', nextLabel: 'Mark Out for Delivery', color: '#8B5CF6' },
  { key: 'out_for_delivery', label: 'Out for Delivery', next: null,               nextLabel: null,                  color: '#F59E0B' },
  { key: 'delivered',        label: 'Delivered',        next: null,               nextLabel: null,                  color: '#22C55E' },
  { key: 'cancelled',        label: 'Cancelled',        next: null,               nextLabel: null,                  color: '#EF4444' },
];

export default function ChefDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(PLACEHOLDER);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  // Meals state
  const [meals, setMeals] = useState([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [mealForm, setMealForm] = useState(MEAL_PLACEHOLDER);
  const [mealImageFile, setMealImageFile] = useState(null);
  const [mealImagePreview, setMealImagePreview] = useState(null);
  const mealFileRef = useRef();

  // Orders & Feedback state
  const [orders, setOrders] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProfile = async () => {
    try {
      const r = await axios.get(`${API}/chefs/my/profile`);
      setProfile(r.data);
      if (r.data) setForm({ ...PLACEHOLDER, ...r.data });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMeals = async () => {
    if (!profile) return;
    try {
      const r = await axios.get(`${API}/chefs/${profile.id}/meals`);
      setMeals(r.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchProfile(); }, []);
  useEffect(() => { if (profile) fetchMeals(); }, [profile]);

  // Must be declared before any conditional returns (Rules of Hooks)
  const fetchOrders = useCallback(() => {
    axios.get(`${API}/orders/chef`, { withCredentials: true })
      .then(r => setOrders(r.data)).catch(console.error);
  }, []);

  const fetchFeedbacks = useCallback(() => {
    if (!profile) return;
    axios.get(`${API}/chefs/${profile.id}/feedback`)
      .then(r => setFeedbacks(r.data)).catch(console.error);
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'feedback') fetchFeedbacks();
  }, [activeTab, fetchOrders, fetchFeedbacks]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleMealImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMealImageFile(file);
    setMealImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      const r = await axios.post(`${API}/chefs`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(r.data);
      setEditing(false);
      setImageFile(null);
      showToast(profile ? 'Profile updated!' : 'Profile created! 🎉');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error saving profile', 'error');
    } finally { setSaving(false); }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(mealForm).forEach(([k, v]) => fd.append(k, v));
      if (mealImageFile) fd.append('image', mealImageFile);
      const r = await axios.post(`${API}/chefs/${profile.id}/meals`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMeals(prev => [...prev, r.data]);
      setShowAddMeal(false);
      setMealForm(MEAL_PLACEHOLDER);
      setMealImageFile(null);
      setMealImagePreview(null);
      showToast('Meal added! 🍽️');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error adding meal', 'error');
    } finally { setSaving(false); }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!confirm('Delete this meal?')) return;
    try {
      await axios.delete(`${API}/chefs/meals/${mealId}`);
      setMeals(prev => prev.filter(m => m.id !== mealId));
      showToast('Meal deleted');
    } catch (err) {
      showToast('Error deleting meal', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete your chef profile?')) return;
    try {
      await axios.delete(`${API}/chefs/my/profile`);
      setProfile(null);
      setForm(PLACEHOLDER);
      setImagePreview(null);
      showToast('Profile deleted');
    } catch { showToast('Error deleting profile', 'error'); }
  };

  const handleToggle = async () => {
    try {
      const r = await axios.patch(`${API}/chefs/${profile.id}/availability`);
      setProfile(p => ({ ...p, available: r.data.available ? 1 : 0 }));
      showToast(`You are now ${r.data.available ? 'available' : 'unavailable'}`);
    } catch { showToast('Error', 'error'); }
  };

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(160,82,45,0.2)', borderTopColor: '#A0522D' }} />
    </div>
  );

  const showForm = !profile || editing;



  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      await axios.patch(`${API}/orders/${orderId}/status`, { status: newStatus }, { withCredentials: true });
      showToast('Order status updated!');
      fetchOrders();
    } catch (e) {
      showToast(e.response?.data?.error || 'Error updating status', 'error');
    } finally { setUpdatingOrder(null); }
  };

  const tabs = [
    { id: 'profile',  label: 'Profile',   icon: FiUser },
    { id: 'menu',     label: 'My Menu',   icon: FiMenu },
    { id: 'orders',   label: 'Orders',    icon: FiShoppingBag },
    { id: 'feedback', label: 'Feedback',  icon: FiMessageSquare },
  ];

  return (
    <div className="page-container" style={{ minHeight: '100vh', paddingBottom: 80 }}>
      <div className="noise-overlay" />
      <div className="glow-orb" style={{ width: 500, height: 300, background: 'rgba(160,82,45,0.06)', top: 0, right: 0 }} />

      <div className="container" style={{ position: 'relative', zIndex: 2, paddingTop: 40 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 40 }}>
          <div className="section-eyebrow" style={{ marginBottom: 12 }}>Chef Portal</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>
                Welcome, <span style={{ color: '#A0522D', fontStyle: 'italic' }}>{user?.name ? user.name.split(' ')[0] : 'Chef'}</span> 👨‍🍳
              </h1>
              <p style={{ color: '#111', marginTop: 6 }}>
                {profile ? 'Manage your chef profile and menu' : 'Create your chef profile to start receiving orders'}
              </p>
            </div>
            {profile && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleToggle} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                  background: profile.available ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                  border: `1px solid ${profile.available ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                  borderRadius: 40, color: profile.available ? '#4ade80' : '#f87171', fontSize: '0.9rem', cursor: 'pointer', transition: '0.2s'
                }}>
                  {profile.available ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                  {profile.available ? 'Available' : 'Unavailable'}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        {profile && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
            {tabs.map(tab => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                  borderRadius: 40, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
                  border: `1px solid ${activeTab === tab.id ? 'rgba(160,82,45,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #A0522D, #C8763A)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === tab.id ? 'white' : '#111',
                  boxShadow: activeTab === tab.id ? '0 4px 20px rgba(160,82,45,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}>
                <tab.icon size={16} />
                {tab.label}
              </motion.button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: profile && !editing ? '1fr 360px' : '1fr', gap: 32 }}>

                {/* Form */}
                <AnimatePresence>
                  {showForm && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 36 }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: 28 }}>
                          {profile ? '✏️ Edit Your Profile' : '🍛 Create Your Chef Profile'}
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                          {/* Name */}
                          <div className="form-group">
                            <label className="form-label">Chef Name *</label>
                            <input className="form-input" placeholder="Your name" required
                              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                          </div>

                          {/* Phone */}
                          <div className="form-group">
                            <label className="form-label">Phone Number *</label>
                            <input className="form-input" placeholder="10-digit number" required
                              value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                          </div>

                          {/* Area */}
                          <div className="form-group">
                            <label className="form-label">Area *</label>
                            <select className="form-input" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}>
                              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>

                          {/* Form layout adjusted slightly if needed */}
                        </div>

                        {/* Location */}
                        <div className="form-group" style={{ marginBottom: 20 }}>
                          <label className="form-label">Full Location *</label>
                          <input className="form-input" placeholder="e.g. Andheri West, near DN Nagar metro" required
                            value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                        </div>



                        {/* Bio */}
                        <div className="form-group" style={{ marginBottom: 24 }}>
                          <label className="form-label">About You</label>
                          <textarea className="form-input" rows={3}
                            placeholder="Tell customers about yourself, your cooking style, and what makes your food special..."
                            value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                            style={{ resize: 'vertical' }} />
                        </div>

                        {/* Image upload */}
                        <div className="form-group" style={{ marginBottom: 28 }}>
                          <label className="form-label">Profile Photo</label>
                          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImageChange} style={{ display: 'none' }} />
                          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                            {(imagePreview || profile?.image_url) && (
                              <img
                                src={imagePreview || `${SERVER_URL}${profile?.image_url}`}
                                alt="Preview"
                                style={{ width: 70, height: 70, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                              />
                            )}
                            <button type="button" onClick={() => fileRef.current.click()}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                                background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)',
                                borderRadius: 10, color: '#111', cursor: 'pointer', fontSize: '0.88rem', transition: '0.2s'
                              }}>
                              <FiUpload size={15} />
                              {imagePreview || profile?.image_url ? 'Change Photo' : 'Upload Photo'}
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 12 }}>
                          <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.98 }}
                            className="btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
                            <FiSave size={15} />
                            {saving ? 'Saving...' : profile ? 'Update Profile' : 'Create My Chef Profile'}
                          </motion.button>
                          {editing && (
                            <button type="button" onClick={() => { setEditing(false); setForm({ ...PLACEHOLDER, ...profile }); setImageFile(null); setImagePreview(null); }}
                              className="btn-outline" style={{ padding: '12px 20px' }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Profile Preview Card */}
                <AnimatePresence>
                  {profile && !editing && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      {/* Profile card */}
                      <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 20 }}>
                        {/* Card image */}
                        <div style={{ position: 'relative', height: 200 }}>
                          <img
                            src={profile.image_url
                              ? `${SERVER_URL}${profile.image_url}`
                              : `https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=70`}
                            alt={profile.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.8) 0%, transparent 50%)' }} />
                          <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
                            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.2rem' }}>{profile.name}</div>
                            {profile.speciality && profile.speciality !== 'N/A' && <div style={{ color: '#A0522D', fontSize: '0.78rem', marginTop: 2 }}>{profile.speciality}</div>}
                          </div>
                        </div>

                        <div style={{ padding: '18px 20px' }}>
                          {/* Rating */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div className="stars">
                              {[1,2,3,4,5].map(s => (
                                <span key={s} style={{ color: s <= Math.round(profile.rating) ? '#D4AF37' : '#333' }}>★</span>
                              ))}
                              <span style={{ color: '#111', fontSize: '0.8rem', marginLeft: 4 }}>{profile.rating?.toFixed(1)}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#111', fontSize: '0.83rem', marginBottom: 8 }}>
                            <FiMapPin size={12} style={{ color: '#A0522D' }} /> {profile.location}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#111', fontSize: '0.83rem', marginBottom: 14 }}>
                            <FiPhone size={12} style={{ color: '#A0522D' }} /> {profile.phone}
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {profile.menu && profile.menu !== 'N/A' && profile.menu.split(',').filter(m => m.trim() !== '').map((item, i) => (
                              <span key={i} style={{ padding: '3px 10px', fontSize: '0.72rem',
                                background: 'rgba(160,82,45,0.1)', border: '1px solid rgba(160,82,45,0.2)',
                                borderRadius: 20, color: '#C8763A' }}>{item.trim()}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="glass-card" style={{ padding: 20 }}>
                        <h3 style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', marginBottom: 16, color: '#111' }}>Your Stats</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          {[['⭐', 'Rating', `${profile.rating?.toFixed(1)}/5.0`], ['📍', 'Area', profile.area], ['✅', 'Status', profile.available ? 'Active' : 'Paused']].map(([icon, label, val]) => (
                            <div key={label} style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10, textAlign: 'center' }}>
                              <div style={{ fontSize: '1.3rem' }}>{icon}</div>
                              <div style={{ fontSize: '0.72rem', color: '#111', marginTop: 4 }}>{label}</div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 2 }}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === 'menu' && profile && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 style={{ color: '#5C3A21', fontSize: '2rem' }}>My Menu</h2>
                <motion.button
                  onClick={() => setShowAddMeal(true)}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                    background: 'linear-gradient(135deg, #A0522D, #C8763A)',
                    border: 'none', borderRadius: 40, color: 'white', fontWeight: 600,
                    cursor: 'pointer', fontSize: '0.9rem',
                  }}>
                  <FiPlus size={16} />
                  Add Meal
                </motion.button>
              </div>

              {/* Meals by category */}
              {['Breakfast', 'Lunch', 'Dinner'].map(category => {
                const categoryMeals = meals.filter(m => m.category === category);
                return (
                  <div key={category} style={{ marginBottom: 40 }}>
                    <h3 style={{ color: '#5C3A21', fontSize: '1.3rem', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>
                      {category} ({categoryMeals.length})
                    </h3>
                    {categoryMeals.length === 0 ? (
                      <p style={{ color: '#111', fontStyle: 'italic' }}>No {category.toLowerCase()} items yet. Add some meals!</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                        {categoryMeals.map(meal => (
                          <motion.div
                            key={meal.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              borderRadius: 16,
                              overflow: 'hidden',
                              position: 'relative',
                            }}>
                            {/* Image */}
                            <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                              <img
                                src={meal.image_url ? `${SERVER_URL}${meal.image_url}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=70'}
                                alt={meal.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.6) 0%, transparent 50%)' }} />

                              {/* Veg badge */}
                              <div style={{ position: 'absolute', top: 12, left: 12 }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: 12,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  background: meal.is_veg ? '#22c55e' : '#ef4444',
                                  color: 'white',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                }}>
                                  {meal.is_veg ? 'Veg' : 'Non-Veg'}
                                </span>
                              </div>

                              {/* Delete button */}
                              <motion.button
                                onClick={() => handleDeleteMeal(meal.id)}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                  position: 'absolute', top: 12, right: 12,
                                  width: 32, height: 32, borderRadius: '50%',
                                  background: 'rgba(239, 68, 68, 0.9)',
                                  border: 'none', color: 'white',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer',
                                }}>
                                <FiTrash2 size={14} />
                              </motion.button>

                              {/* Price */}
                              <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
                                <span style={{
                                  padding: '6px 12px',
                                  borderRadius: 20,
                                  background: 'rgba(160,82,45,0.9)',
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '0.9rem',
                                }}>
                                  ₹{meal.price}
                                </span>
                              </div>
                            </div>

                            {/* Content */}
                            <div style={{ padding: 16 }}>
                              <h4 style={{ color: '#5C3A21', fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>
                                {meal.name}
                              </h4>
                              <p style={{
                                color: '#111',
                                fontSize: '0.85rem',
                                lineHeight: 1.5,
                                marginBottom: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}>
                                {meal.ingredients}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

          {/* ── ORDERS TAB ── */}
          {activeTab === 'orders' && profile && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h2 style={{ color: '#5C3A21', fontSize: '1.6rem' }}>Incoming Orders</h2>
                <button onClick={fetchOrders} style={{ padding: '8px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#111', fontSize: '0.82rem', cursor: 'pointer' }}>🔄 Refresh</button>
              </div>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>
                  <FiShoppingBag size={48} style={{ marginBottom: 16, color: '#444' }} />
                  <p>No orders yet. Your orders will appear here!</p>
                </div>
              ) : orders.map(order => {
                const statusMeta = ORDER_STATUS_FLOW.find(s => s.key === order.status) || ORDER_STATUS_FLOW[0];
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${statusMeta.color}30`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
                      <div>
                        <h4 style={{ color: '#5C3A21', fontSize: '1rem', marginBottom: 3 }}>{order.customer_name}</h4>
                        <p style={{ color: '#111', fontSize: '0.78rem', marginBottom: 2 }}>{order.customer_email}</p>
                        {order.contact_info && (
                          <p style={{ color: '#111', fontSize: '0.8rem', marginBottom: 2 }}>
                            <FiPhone size={12} style={{marginRight: 4, verticalAlign: '-1px'}}/> {order.contact_info}
                          </p>
                        )}
                        {order.delivery_address && (
                          <p style={{ color: '#111', fontSize: '0.8rem', marginBottom: 4, maxWidth: 300, lineHeight: 1.3 }}>
                            <FiMapPin size={12} style={{marginRight: 4, verticalAlign: '-1px'}}/> {order.delivery_address}
                          </p>
                        )}
                        <p style={{ color: '#111', fontSize: '0.75rem', marginTop: 4 }}>{new Date(order.created_at).toLocaleString('en-IN')}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 700, background: statusMeta.color + '20', color: statusMeta.color, textTransform: 'uppercase' }}>
                          {statusMeta.label}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#111' }}>
                          {order.payment_method === 'pay_now' ? '💳 Prepaid' : '💵 Pay on Delivery'}
                        </span>
                      </div>
                    </div>
                    <div style={{ marginBottom: 14, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#111', marginBottom: i < order.items.length - 1 ? 6 : 0 }}>
                          <span>{item.name} <span style={{ color: '#111' }}>×{item.quantity}</span></span>
                          <span style={{ color: '#C8763A', fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#5C3A21', fontWeight: 700 }}>Total</span>
                        <span style={{ color: '#A0522D', fontWeight: 700 }}>₹{order.total}</span>
                      </div>
                    </div>
                    {statusMeta.next && (
                      <motion.button whileTap={{ scale: 0.97 }}
                        onClick={() => updateOrderStatus(order.id, statusMeta.next)}
                        disabled={updatingOrder === order.id}
                        style={{
                          width: '100%', padding: '12px', borderRadius: 10,
                          background: `linear-gradient(135deg, ${statusMeta.color}cc, ${statusMeta.color})`,
                          border: 'none', color: 'white', fontWeight: 700, fontSize: '0.9rem',
                          cursor: updatingOrder === order.id ? 'not-allowed' : 'pointer',
                          opacity: updatingOrder === order.id ? 0.7 : 1,
                        }}>
                        {updatingOrder === order.id ? '⏳ Updating...' : statusMeta.nextLabel + ' →'}
                      </motion.button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <div style={{ textAlign: 'center', color: '#F59E0B', fontSize: '0.82rem', marginTop: 8, padding: '8px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        🚚 Waiting for customer to confirm delivery
                      </div>
                    )}
                    {order.status === 'delivered' && (
                      <div style={{ textAlign: 'center', color: '#22C55E', fontSize: '0.82rem', marginTop: 8, padding: '8px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        ✅ Order completed successfully!
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── FEEDBACK TAB ── */}
          {activeTab === 'feedback' && profile && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h2 style={{ color: '#5C3A21', fontSize: '1.6rem' }}>Customer Feedback</h2>
                <div style={{ padding: '8px 16px', borderRadius: 20, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', fontSize: '0.82rem', fontWeight: 600 }}>
                  ⭐ {profile.rating?.toFixed(1)} avg rating
                </div>
              </div>
              {feedbacks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>
                  <FiMessageSquare size={48} style={{ marginBottom: 16, color: '#444' }} />
                  <p>No feedback yet. Deliver great food to get reviews!</p>
                </div>
              ) : feedbacks.map((fb, i) => (
                <motion.div key={fb.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ color: '#5C3A21', fontWeight: 600, fontSize: '0.95rem', marginBottom: 5 }}>{fb.user_name || 'Customer'}</div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= fb.rating ? '#D4AF37' : '#333', fontSize: '1rem' }}>★</span>)}
                      </div>
                    </div>
                    <span style={{ color: '#111', fontSize: '0.78rem' }}>{new Date(fb.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {fb.comment && <p style={{ color: '#111', fontSize: '0.88rem', lineHeight: 1.6, fontStyle: 'italic' }}>"{fb.comment}"</p>}
                </motion.div>
              ))}
            </motion.div>
          )}

        {/* Add Meal Modal */}
        <AnimatePresence>
          {showAddMeal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
              }}
              onClick={() => setShowAddMeal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  background: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  width: '100%',
                  maxWidth: 500,
                  maxHeight: '90vh',
                  overflow: 'auto',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ color: '#5C3A21', fontSize: '1.5rem' }}>Add New Meal</h3>
                    <motion.button
                      onClick={() => setShowAddMeal(false)}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#111',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}>
                      <FiX size={16} />
                    </motion.button>
                  </div>
                </div>

                <form onSubmit={handleAddMeal} style={{ padding: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    {/* Category */}
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select className="form-input" value={mealForm.category} onChange={e => setMealForm(f => ({ ...f, category: e.target.value }))}>
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                      </select>
                    </div>

                    {/* Veg/Non-Veg */}
                    <div className="form-group">
                      <label className="form-label">Type *</label>
                      <select className="form-input" value={mealForm.is_veg} onChange={e => setMealForm(f => ({ ...f, is_veg: parseInt(e.target.value) }))}>
                        <option value={1}>Vegetarian</option>
                        <option value={0}>Non-Vegetarian</option>
                      </select>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label">Meal Name *</label>
                    <input className="form-input" placeholder="e.g. Masala Dosa" required
                      value={mealForm.name} onChange={e => setMealForm(f => ({ ...f, name: e.target.value }))} />
                  </div>

                  {/* Ingredients */}
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label">Ingredients *</label>
                    <textarea className="form-input" rows={3} placeholder="List the ingredients used..." required
                      value={mealForm.ingredients} onChange={e => setMealForm(f => ({ ...f, ingredients: e.target.value }))}
                      style={{ resize: 'vertical' }} />
                  </div>

                  {/* Price */}
                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label className="form-label">Price (₹) *</label>
                    <input type="number" className="form-input" placeholder="150" required min="1"
                      value={mealForm.price} onChange={e => setMealForm(f => ({ ...f, price: e.target.value }))} />
                  </div>

                  {/* Image upload */}
                  <div className="form-group" style={{ marginBottom: 28 }}>
                    <label className="form-label">Meal Photo</label>
                    <input ref={mealFileRef} type="file" accept="image/*" capture="environment" onChange={handleMealImageChange} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      {mealImagePreview && (
                        <img
                          src={mealImagePreview}
                          alt="Preview"
                          style={{ width: 70, height: 70, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      )}
                      <button type="button" onClick={() => mealFileRef.current.click()}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                          background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)',
                          borderRadius: 10, color: '#111', cursor: 'pointer', fontSize: '0.88rem', transition: '0.2s'
                        }}>
                        <FiUpload size={15} />
                        {mealImagePreview ? 'Change Photo' : 'Upload Photo'}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.98 }}
                      className="btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
                      <FiPlus size={15} />
                      {saving ? 'Adding...' : 'Add Meal'}
                    </motion.button>
                    <button type="button" onClick={() => { setShowAddMeal(false); setMealForm(MEAL_PLACEHOLDER); setMealImageFile(null); setMealImagePreview(null); }}
                      className="btn-outline" style={{ padding: '12px 20px' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
