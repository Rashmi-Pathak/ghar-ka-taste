import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiPhone, FiStar, FiMapPin, FiFilter, FiHeart, FiShoppingBag, FiMessageSquare, FiCompass, FiCheck, FiClock, FiTruck } from 'react-icons/fi';
import { API, SERVER_URL, useAuth } from '../context/AuthContext';

const AREAS = ['All', 'Andheri', 'Bandra', 'Dadar', 'Powai', 'Juhu', 'Borivali', 'Thane'];

function StarRating({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= Math.round(rating) ? '#D4AF37' : '#333', fontSize: '0.85rem' }}>★</span>)}
      <span style={{ color: '#111', fontSize: '0.8rem', marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function ChefCard({ chef, index, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07, duration: 0.5 }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      onClick={() => onClick(chef.id)}
      style={{
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${hovered ? 'rgba(160,82,45,0.4)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20, overflow: 'hidden', transition: 'all 0.3s', cursor: 'pointer',
        transform: hovered ? 'translateY(-5px)' : 'none',
        boxShadow: hovered ? '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(160,82,45,0.1)' : '0 4px 20px rgba(0,0,0,0.2)',
      }}>
      <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
        <motion.img animate={{ scale: hovered ? 1.05 : 1 }} transition={{ duration: 0.5 }}
          src={chef.image_url ? `${SERVER_URL}${chef.image_url}` : `https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=70`}
          alt={chef.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.8) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <span className={`badge ${chef.available ? 'badge-green' : 'badge-red'}`}>{chef.available ? '● Available' : '● Busy'}</span>
        </div>
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <span className="badge badge-brown"><FiMapPin size={10} /> {chef.area}</span>
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#5C3A21' }}>{chef.name}</div>
            {chef.is_verified === 1 && (
              <span style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.4)', fontSize: '0.6rem', padding: '2px 6px', borderRadius: 10, fontWeight: 600 }}>✓ Verified</span>
            )}
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <StarRating rating={chef.rating} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#111', fontSize: '0.8rem', marginBottom: 14 }}>
          <FiMapPin size={11} style={{ color: '#A0522D' }} /> {chef.location}
        </div>
        {chef.bio && <p style={{ fontSize: '0.8rem', color: '#111', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{chef.bio}</p>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: hovered ? 'linear-gradient(135deg, #A0522D, #C8763A)' : 'rgba(160,82,45,0.1)', border: '1px solid rgba(160,82,45,0.3)', color: hovered ? 'white' : '#C8763A', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.3s' }}>
          View Menu
        </div>
      </div>
    </motion.div>
  );
}

const STATUS_META = {
  pending:          { label: 'Pending Confirmation', color: '#FFA500', icon: <FiClock size={14}/> },
  confirmed:        { label: 'Confirmed',            color: '#3B82F6', icon: <FiCheck size={14}/> },
  preparing:        { label: 'Being Prepared',       color: '#8B5CF6', icon: '🍳' },
  out_for_delivery: { label: 'Out for Delivery',     color: '#F59E0B', icon: <FiTruck size={14}/> },
  delivered:        { label: 'Delivered',            color: '#22C55E', icon: <FiCheck size={14}/> },
  cancelled:        { label: 'Cancelled',            color: '#EF4444', icon: '✕' },
};

function FeedbackModal({ order, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [hover, setHover] = useState(0);

  const submit = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/chefs/${order.chef_table_id}/feedback`, { rating, comment }, { withCredentials: true });
      onSubmitted();
      onClose();
    } catch (e) {
      alert('Failed to submit feedback');
    } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, width: '100%', maxWidth: 420, padding: 32 }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ color: '#5C3A21', marginBottom: 6, fontSize: '1.3rem' }}>Rate Your Experience</h3>
        <p style={{ color: '#111', fontSize: '0.85rem', marginBottom: 24 }}>Order from <strong style={{ color: '#C8763A' }}>{order.chef_name}</strong></p>
        
        {/* Star picker */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
              style={{ fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer', color: s <= (hover || rating) ? '#D4AF37' : '#333', transition: 'all 0.15s', transform: s <= (hover || rating) ? 'scale(1.2)' : 'scale(1)' }}>
              ★
            </button>
          ))}
        </div>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Comment (optional)</label>
          <textarea className="form-input" rows={3} placeholder="Tell us about your experience..." value={comment} onChange={e => setComment(e.target.value)} style={{ resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={submit} disabled={saving} style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Submitting...' : 'Submit Feedback'}
          </button>
          <button className="btn-outline" onClick={onClose} style={{ padding: '12px 20px' }}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OrderCard({ order, onConfirmDelivery, onLeaveFeedback, feedbackGiven }) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 10 }}>
        <div>
          <h4 style={{ color: '#5C3A21', marginBottom: 4, fontSize: '1rem' }}>{order.chef_name}</h4>
          <p style={{ color: '#111', fontSize: '0.8rem', marginBottom: 2 }}>{order.chef_location}</p>
          {order.delivery_address && (
            <p style={{ color: '#111', fontSize: '0.78rem', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiMapPin size={10} style={{color: '#111'}} /> {order.delivery_address}
            </p>
          )}
          <p style={{ color: '#111', fontSize: '0.75rem', marginTop: 4 }}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 600, whiteSpace: 'nowrap', background: meta.color + '20', color: meta.color, display: 'flex', alignItems: 'center', gap: 5 }}>
            {meta.icon} {meta.label}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#111' }}>
            {order.payment_method === 'pay_now' ? '💳 Prepaid' : '💵 Pay on Delivery'}
          </span>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        {order.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#111', marginBottom: 5 }}>
            <span>{item.name} <span style={{ color: '#111' }}>×{item.quantity}</span></span>
            <span style={{ color: '#C8763A' }}>₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ color: '#A0522D', fontWeight: 700 }}>Total: ₹{order.total}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {order.status === 'out_for_delivery' && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onConfirmDelivery(order.id)}
              style={{ padding: '8px 16px', borderRadius: 20, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <FiCheck size={13} /> Confirm Delivery
            </motion.button>
          )}
          {order.status === 'delivered' && !feedbackGiven && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onLeaveFeedback(order)}
              style={{ padding: '8px 16px', borderRadius: 20, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              ★ Leave Review
            </motion.button>
          )}
          {order.status === 'delivered' && feedbackGiven && (
            <span style={{ padding: '8px 14px', borderRadius: 20, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', fontSize: '0.78rem' }}>✓ Reviewed</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CustomerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discover');
  const [chefs, setChefs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [feedbackModal, setFeedbackModal] = useState(null); // order
  const [reviewedOrders, setReviewedOrders] = useState(new Set());

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 400); return () => clearTimeout(t); }, [search]);

  const fetchOrders = useCallback(() => {
    axios.get(`${API}/orders/my`, { withCredentials: true })
      .then(r => setOrders(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === 'discover') {
      setLoading(true);
      const params = {};
      if (area !== 'All') params.area = area;
      if (debouncedSearch) params.search = debouncedSearch;
      axios.get(`${API}/chefs`, { params })
        .then(r => setChefs(r.data)).catch(console.error).finally(() => setLoading(false));
    } else if (activeTab === 'saved') {
      axios.get(`${API}/orders/favorites/my`, { withCredentials: true })
        .then(r => setFavorites(r.data)).catch(console.error);
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, area, debouncedSearch, fetchOrders]);

  const confirmDelivery = async (orderId) => {
    try {
      await axios.patch(`${API}/orders/${orderId}/confirm-delivery`, {}, { withCredentials: true });
      fetchOrders();
    } catch (e) { alert(e.response?.data?.error || 'Error confirming delivery'); }
  };

  const tabs = [
    { id: 'discover', label: 'Discover', icon: FiCompass },
    { id: 'orders',   label: 'My Orders', icon: FiShoppingBag },
    { id: 'saved',    label: 'Saved', icon: FiHeart },
  ];

  return (
    <div className="page-container" style={{ minHeight: '100vh' }}>
      <div className="noise-overlay" />

      <section style={{ padding: '32px 0 20px', position: 'relative' }}>
        <div className="glow-orb" style={{ width: 600, height: 300, background: 'rgba(160,82,45,0.06)', top: 0, left: '50%', transform: 'translateX(-50%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.3rem)', marginBottom: 10 }}>
              Welcome, <span style={{ color: '#A0522D' }}>{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p style={{ color: '#111', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 24px' }}>
              Discover amazing home food and track your orders in real time
            </p>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
              {tabs.map(tab => (
                <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)} whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
                    borderRadius: 40, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                    border: `1px solid ${activeTab === tab.id ? 'rgba(160,82,45,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: activeTab === tab.id ? 'linear-gradient(135deg, #A0522D, #C8763A)' : 'rgba(255,255,255,0.04)',
                    color: activeTab === tab.id ? 'white' : '#111',
                    boxShadow: activeTab === tab.id ? '0 4px 20px rgba(160,82,45,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                  <tab.icon size={15} /> {tab.label}
                </motion.button>
              ))}
            </div>

            {activeTab === 'discover' && (
              <>
                <div style={{ position: 'relative', maxWidth: 460, margin: '0 auto 18px' }}>
                  <FiSearch size={17} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                  <input type="text" className="form-input" placeholder="Search by chef name or area..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: 44, borderRadius: 40, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {AREAS.map(a => (
                    <motion.button key={a} onClick={() => setArea(a)} whileTap={{ scale: 0.95 }}
                      style={{ padding: '7px 16px', borderRadius: 40, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, border: `1px solid ${area === a ? 'rgba(160,82,45,0.5)' : 'rgba(255,255,255,0.08)'}`, background: area === a ? 'linear-gradient(135deg, #A0522D, #C8763A)' : 'rgba(255,255,255,0.04)', color: area === a ? 'white' : '#111', transition: 'all 0.2s' }}>
                      {a}
                    </motion.button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>

      <div className="container" style={{ paddingBottom: 80, position: 'relative', zIndex: 2 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'discover' && (
            <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <p style={{ color: '#111', fontSize: '0.85rem' }}>{loading ? 'Loading...' : `${chefs.length} chef${chefs.length !== 1 ? 's' : ''} found`}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#555', fontSize: '0.8rem' }}><FiFilter size={12} /> Sorted by rating</div>
              </div>
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                  {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 360, borderRadius: 20, background: 'rgba(255,255,255,0.03)', animation: 'pulse 2s ease-in-out infinite' }} />)}
                </div>
              ) : chefs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
                  <p>No chefs found. Try a different area or search.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                  {chefs.map((chef, i) => <ChefCard key={chef.id} chef={chef} index={i} onClick={id => navigate(`/chef/${id}`)} />)}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ color: '#5C3A21', fontSize: '1.5rem' }}>My Orders</h2>
                <button onClick={fetchOrders} style={{ padding: '8px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#111', fontSize: '0.82rem', cursor: 'pointer' }}>🔄 Refresh</button>
              </div>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>
                  <FiShoppingBag size={44} style={{ marginBottom: 16, color: '#444' }} />
                  <p>No orders yet. Start exploring chefs!</p>
                </div>
              ) : (
                orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    feedbackGiven={reviewedOrders.has(order.id)}
                    onConfirmDelivery={confirmDelivery}
                    onLeaveFeedback={setFeedbackModal}
                  />
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'saved' && (
            <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ color: '#5C3A21', marginBottom: 24, fontSize: '1.5rem' }}>Saved Chefs</h2>
              {favorites.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>
                  <FiHeart size={44} style={{ marginBottom: 16, color: '#444' }} />
                  <p>No saved chefs yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                  {favorites.map((chef, i) => <ChefCard key={chef.id} chef={chef} index={i} onClick={id => navigate(`/chef/${id}`)} />)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackModal && (
          <FeedbackModal
            order={feedbackModal}
            onClose={() => setFeedbackModal(null)}
            onSubmitted={() => {
              setReviewedOrders(prev => new Set([...prev, feedbackModal.id]));
              setFeedbackModal(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
