import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FiStar, FiMapPin, FiPhone, FiHeart, FiShoppingCart, FiPlus, FiMinus, FiX, FiCheck, FiCreditCard, FiTruck } from 'react-icons/fi';
import { API, SERVER_URL, useAuth } from '../context/AuthContext';

function StarRating({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= Math.round(rating) ? '#D4AF37' : '#333', fontSize: '0.85rem' }}>★</span>
      ))}
      <span style={{ color: '#111', fontSize: '0.8rem', marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function MealCard({ meal, onAddToCart }) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(meal);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? 'rgba(160,82,45,0.4)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 16, overflow: 'hidden', transition: 'all 0.3s',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
      }}>
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img
          src={meal.image_url ? `${SERVER_URL}${meal.image_url}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=70'}
          alt={meal.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.6) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <span style={{
            padding: '4px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
            background: meal.is_veg ? '#22c55e' : '#ef4444', color: 'white', textTransform: 'uppercase',
          }}>
            {meal.is_veg ? 'Veg' : 'Non-Veg'}
          </span>
        </div>
        <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
          <span style={{ padding: '6px 12px', borderRadius: 20, background: 'rgba(160,82,45,0.9)', color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
            ₹{meal.price}
          </span>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <h4 style={{ color: '#5C3A21', fontSize: '1.05rem', fontWeight: 600, marginBottom: 6 }}>{meal.name}</h4>
        <p style={{ color: '#aaa', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: 12,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {meal.ingredients}
        </p>
        <motion.button
          onClick={handleAdd}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '100%', padding: '10px', borderRadius: 8,
            background: added ? 'rgba(74,222,128,0.15)' : (hovered ? 'linear-gradient(135deg, #A0522D, #C8763A)' : 'rgba(160,82,45,0.1)'),
            border: added ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(160,82,45,0.3)',
            color: added ? '#4ade80' : (hovered ? 'white' : '#C8763A'),
            fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
          {added ? <><FiCheck size={14} /> Added!</> : <><FiPlus size={14} /> Add to Cart</>}
        </motion.button>
      </div>
    </motion.div>
  );
}

function CartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <img src={item.image_url ? `${SERVER_URL}${item.image_url}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=70'}
        alt={item.name} style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h5 style={{ color: '#5C3A21', fontSize: '0.88rem', fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h5>
        <p style={{ color: '#A0522D', fontSize: '0.78rem', fontWeight: 600 }}>₹{item.price} each</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FiMinus size={11} />
        </button>
        <span style={{ color: '#5C3A21', fontSize: '0.9rem', minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
        <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FiPlus size={11} />
        </button>
      </div>
      <span style={{ color: '#C8763A', fontWeight: 700, fontSize: '0.9rem', minWidth: 44, textAlign: 'right' }}>₹{item.price * item.quantity}</span>
      <button onClick={() => onRemove(item.id)} style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FiX size={11} />
      </button>
    </div>
  );
}

function CheckoutModal({ cart, total, chefId, onClose, onSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('bill'); // 'bill' | 'details' | 'payment' | 'processing' | 'done'
  const [contactInfo, setContactInfo] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [payMethod, setPayMethod] = useState('');

  const handlePayment = async (method) => {
    setPayMethod(method);
    if (method === 'pay_now') {
      setStep('processing');
      await new Promise(r => setTimeout(r, 2500));
    }
    try {
      const orderData = {
        chef_id: parseInt(chefId),
        items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
        total,
        contact_info: contactInfo,
        delivery_address: deliveryAddress,
        payment_method: method,
      };
      await axios.post(`${API}/orders`, orderData, { withCredentials: true });
      setStep('done');
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch (err) {
      alert('Failed to place order. Please try again.');
      setStep('payment');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={step === 'processing' || step === 'done' ? null : onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, width: '100%', maxWidth: 460, maxHeight: '90vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Bill step */}
        {step === 'bill' && (
          <>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#5C3A21', fontSize: '1.4rem' }}>🧾 Your Bill</h3>
                <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiX size={16} />
                </button>
              </div>
            </div>
            <div style={{ padding: '0 24px' }}>
              {cart.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: '#5C3A21', fontWeight: 500 }}>{item.name}</span>
                    <span style={{ color: '#111', marginLeft: 8 }}>x{item.quantity}</span>
                  </div>
                  <span style={{ color: '#C8763A', fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 8px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 4 }}>
                <span style={{ color: '#111', fontSize: '0.85rem' }}>Subtotal</span>
                <span style={{ color: '#111', fontWeight: 500 }}>₹{total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 20 }}>
                <span style={{ color: '#5C3A21', fontWeight: 700, fontSize: '1.1rem' }}>Total</span>
                <span style={{ color: '#A0522D', fontWeight: 700, fontSize: '1.2rem' }}>₹{total}</span>
              </div>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('details')}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #A0522D, #C8763A)', color: 'white', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer', marginBottom: 10 }}>
                Enter Delivery Details
              </motion.button>
              <button onClick={onClose} style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#111', cursor: 'pointer', fontSize: '0.9rem' }}>
                Go Back & Edit
              </button>
            </div>
          </>
        )}

        {/* Delivery Details step */}
        {step === 'details' && (
          <>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setStep('bill')} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  ←
                </button>
                <h3 style={{ color: '#5C3A21', fontSize: '1.3rem' }}>Delivery Details</h3>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#111', fontSize: '0.85rem', marginBottom: 6 }}>Contact Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={contactInfo}
                  onChange={e => setContactInfo(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', color: '#111', fontSize: '0.85rem', marginBottom: 6 }}>Complete Delivery Address *</label>
                <textarea
                  placeholder="House/Flat No., Building Name, Street, Landmark..."
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => {
                  if(!contactInfo.trim() || !deliveryAddress.trim()) { alert('Please fill in all details'); return; }
                  setStep('payment');
                }}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #A0522D, #C8763A)', color: 'white', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer' }}>
                Proceed to Payment
              </motion.button>
            </div>
          </>
        )}

        {/* Payment step */}
        {step === 'payment' && (
          <>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setStep('details')} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ←
                </button>
                <h3 style={{ color: '#5C3A21', fontSize: '1.3rem' }}>Choose Payment</h3>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ color: '#111', fontSize: '0.85rem', marginBottom: 20 }}>Total payable: <span style={{ color: '#A0522D', fontWeight: 700, fontSize: '1rem' }}>₹{total}</span></p>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => handlePayment('cash_on_delivery')}
                style={{
                  width: '100%', padding: '18px', borderRadius: 14,
                  background: 'rgba(160,82,45,0.08)', border: '1px solid rgba(160,82,45,0.3)',
                  color: '#5C3A21', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(160,82,45,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiTruck size={20} style={{ color: '#C8763A' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Pay on Delivery</div>
                  <div style={{ color: '#111', fontSize: '0.78rem', marginTop: 2 }}>Pay when your food arrives</div>
                </div>
              </motion.button>
            </div>
          </>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid rgba(74,222,128,0.2)', borderTopColor: '#4ade80', margin: '0 auto 24px' }} />
            <h3 style={{ color: '#5C3A21', marginBottom: 8 }}>Processing Payment...</h3>
            <p style={{ color: '#111', fontSize: '0.88rem' }}>Please wait while we verify your payment</p>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
              style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '2px solid rgba(74,222,128,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <FiCheck size={32} style={{ color: '#4ade80' }} />
            </motion.div>
            <h3 style={{ color: '#5C3A21', marginBottom: 8 }}>Order Placed! 🎉</h3>
            <p style={{ color: '#111', fontSize: '0.88rem' }}>Your delicious food is being prepared</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function ChefProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chef, setChef] = useState(null);
  const [meals, setMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    axios.get(`${API}/chefs/${id}`).then(r => setChef(r.data)).catch(console.error);
    axios.get(`${API}/chefs/${id}/meals`)
      .then(r => { setMeals(r.data); setFilteredMeals(r.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
    if (user) {
      axios.get(`${API}/orders/favorites/my`, { withCredentials: true })
        .then(r => setIsFavorited(r.data.some(c => c.id === parseInt(id))))
        .catch(console.error);
    }
  }, [id, user]);

  useEffect(() => {
    setFilteredMeals(activeCategory === 'All' ? meals : meals.filter(m => m.category === activeCategory));
  }, [activeCategory, meals]);

  const addToCart = (meal) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === meal.id);
      if (existing) return prev.map(item => item.id === meal.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...meal, quantity: 1 }];
    });
    showToast(`${meal.name} added to cart! 👌`);
  };

  const updateQuantity = (mealId, newQty) => {
    if (newQty <= 0) { setCart(prev => prev.filter(item => item.id !== mealId)); return; }
    setCart(prev => prev.map(item => item.id === mealId ? { ...item, quantity: newQty } : item));
  };

  const getTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const toggleFavorite = () => {
    if (!user) { navigate('/auth?tab=login'); return; }
    axios.post(`${API}/orders/favorites/toggle`, { chef_id: parseInt(id) }, { withCredentials: true })
      .then(r => setIsFavorited(r.data.favorited)).catch(console.error);
  };

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner'];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(160,82,45,0.2)', borderTopColor: '#A0522D', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (!chef) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#5C3A21' }}>
      Chef not found
    </div>
  );

  return (
    <div className="page-container" style={{ minHeight: '100vh' }}>
      <div className="noise-overlay" />

      {/* Hero */}
      <section style={{ position: 'relative', height: 'clamp(300px, 55vw, 60vh)', overflow: 'hidden' }}>
        <img
          src={chef.image_url ? `${SERVER_URL}${chef.image_url}` : `https://images.unsplash.com/photo-1596797038530-2c107229654b?w=1200&q=70`}
          alt={chef.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.4) 60%, transparent 100%)' }} />
        <div className="container" style={{ position: 'absolute', bottom: 28, left: 0, right: 0 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 700, color: '#5C3A21', margin: 0 }}>{chef.name}</h1>
                  {chef.is_verified === 1 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <FiStar size={11} fill="#4ade80" /> Verified
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <StarRating rating={chef.rating} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#111', fontSize: '0.85rem' }}>
                    <FiMapPin size={13} style={{ color: '#A0522D' }} /> {chef.location}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                {user && (
                  <motion.button onClick={toggleFavorite} whileTap={{ scale: 0.95 }}
                    style={{ width: 44, height: 44, borderRadius: '50%', background: isFavorited ? 'linear-gradient(135deg, #A0522D, #C8763A)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <FiHeart size={18} fill={isFavorited ? 'white' : 'none'} />
                  </motion.button>
                )}
                <a href={`tel:${chef.phone}`} style={{ padding: '10px 18px', borderRadius: 25, background: 'linear-gradient(135deg, #A0522D, #C8763A)', color: 'white', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}>
                  <FiPhone size={15} /> Call
                </a>
              </div>
            </div>
            {chef.bio && <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginTop: 12, color: '#111', maxWidth: 600 }}>{chef.bio}</p>}
          </motion.div>
        </div>
      </section>

      {/* Menu */}
      <div className="container" style={{ padding: '32px 0 100px' }}>
        <h2 style={{ color: '#5C3A21', fontSize: 'clamp(1.4rem, 4vw, 2rem)', marginBottom: 6 }}>Menu</h2>
        <p style={{ color: '#111', marginBottom: 24, fontSize: '0.9rem' }}>Choose from our home-cooked meals</p>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <motion.button key={cat} onClick={() => setActiveCategory(cat)} whileTap={{ scale: 0.95 }}
              style={{
                padding: '8px 20px', borderRadius: 25, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                border: `1px solid ${activeCategory === cat ? 'rgba(160,82,45,0.5)' : 'rgba(255,255,255,0.08)'}`,
                background: activeCategory === cat ? 'linear-gradient(135deg, #A0522D, #C8763A)' : 'rgba(255,255,255,0.04)',
                color: activeCategory === cat ? 'white' : '#111',
                boxShadow: activeCategory === cat ? '0 4px 20px rgba(160,82,45,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
              {cat}
            </motion.button>
          ))}
        </div>

        {filteredMeals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>
            <p style={{ fontSize: '1rem' }}>No meals available in this category yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {filteredMeals.map(meal => <MealCard key={meal.id} meal={meal} onAddToCart={addToCart} />)}
          </div>
        )}
      </div>

      {/* Cart Side Panel */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}
            onClick={() => setShowCart(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28 }}
              style={{ background: '#111', borderLeft: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: 400, height: '100%', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#5C3A21', fontSize: '1.2rem' }}>🛒 Your Cart ({cart.length})</h3>
                <button onClick={() => setShowCart(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiX size={16} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#111' }}>
                    <FiShoppingCart size={40} style={{ marginBottom: 14 }} />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => <CartItem key={item.id} item={item} onUpdateQuantity={updateQuantity} onRemove={id => setCart(prev => prev.filter(i => i.id !== id))} />)
                )}
              </div>
              {cart.length > 0 && (
                <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ color: '#5C3A21', fontWeight: 700 }}>Total</span>
                    <span style={{ color: '#A0522D', fontWeight: 700, fontSize: '1.1rem' }}>₹{getTotal()}</span>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setShowCart(false); setShowCheckout(true); }}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #A0522D, #C8763A)', color: 'white', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer' }}>
                    Proceed to Checkout →
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal
            cart={cart}
            total={getTotal()}
            chefId={id}
            onClose={() => setShowCheckout(false)}
            onSuccess={() => { setCart([]); setShowCheckout(false); navigate('/explore'); }}
          />
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      {cart.length > 0 && !showCart && !showCheckout && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setShowCart(true)}
          style={{ position: 'fixed', bottom: 24, right: 24, width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #A0522D, #C8763A)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 32px rgba(160,82,45,0.4)', zIndex: 100 }}>
          <FiShoppingCart size={22} />
          <span style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
        </motion.button>
      )}
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