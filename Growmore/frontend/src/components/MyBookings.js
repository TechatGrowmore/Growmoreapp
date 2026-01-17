import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Car, Clock, Phone, MapPin, AlertCircle } from 'lucide-react';
import api from '../services/api';
import './MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [otp, setOtp] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'

  useEffect(() => {
    fetchBookings();
    fetchCompletedBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data.bookings);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings?status=completed');
      setCompletedBookings(response.data.bookings);
    } catch (error) {
      console.error('Failed to fetch completed bookings');
    }
  };

  const handleEstimateArrival = async (bookingId) => {
    if (!estimatedTime || estimatedTime < 1) {
      toast.error('Please enter valid estimated time');
      return;
    }

    try {
      await api.post(`/bookings/${bookingId}/estimate-arrival`, {
        estimatedMinutes: parseInt(estimatedTime)
      });
      toast.success('Estimated arrival time sent to customer!');
      setEstimatedTime('');
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to set arrival time');
    }
  };

  const handleMarkArrived = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/arrived`);
      toast.success('Car marked as arrived! OTP sent to customer.');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark as arrived');
    }
  };

  const handleRecallCar = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/driver-recall`);
      toast.success('Car recall initiated! Set arrival time.');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to recall car');
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }

    // Find the booking to check payment status
    const booking = bookings.find(b => b._id === bookingId);
    const isPaymentAlreadyDone = booking?.paymentStatus === 'paid';

    // Only validate amount if payment not already done
    if (!isPaymentAlreadyDone) {
      if (!amount || parseFloat(amount) < 0) {
        toast.error('Please enter valid amount');
        return;
      }
    }

    try {
      const payload = {
        otp,
        paymentMethod: isPaymentAlreadyDone ? booking.payment.method : paymentMethod,
        amount: isPaymentAlreadyDone ? booking.payment.amount : parseFloat(amount)
      };

      await api.post(`/bookings/${bookingId}/verify-complete`, payload);
      toast.success('Booking completed successfully!');
      setOtp('');
      setAmount('');
      setSelectedBooking(null);
      fetchBookings();
      fetchCompletedBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete booking');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'parked': '#10B981',
      'recall-requested': '#F59E0B',
      'in-transit': '#3B82F6',
      'arrived': '#8B5CF6',
      'completed': '#6B7280'
    };
    return colors[status] || '#666';
  };

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="my-bookings-container"
    >
      <h2>My Bookings</h2>

      {/* Tabs */}
      <div className="bookings-tabs">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Bookings ({bookings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Bookings ({completedBookings.length})
        </button>
      </div>

      {/* Active Bookings */}
      {activeTab === 'active' && (
        <>
          {bookings.length === 0 ? (
            <div className="empty-state">
              <Car size={80} color="#CCC" />
              <h3>No active bookings</h3>
              <p>Create a new booking to get started</p>
            </div>
          ) : (
            <div className="bookings-grid">
          {bookings
            .sort((a, b) => {
              // Priority order: recall-requested, in-transit, arrived, then parked
              const statusPriority = {
                'recall-requested': 0,
                'in-transit': 1,
                'arrived': 2,
                'parked': 3
              };
              return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
            })
            .map((booking, index) => {
              const isRecalled = ['recall-requested', 'in-transit', 'arrived'].includes(booking.status);
              return (
            <motion.div
              key={booking._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`booking-card ${isRecalled ? 'recalled' : ''}`}
            >
              <div className="booking-header">
                <div>
                  <h3>{booking.bookingId}</h3>
                  <p className="booking-time">
                    {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>
                <span 
                  className="status-badge"
                  style={{ background: getStatusColor(booking.status) }}
                >
                  {booking.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <Car size={18} color="#FF6B35" />
                  <div>
                    <strong>{booking.vehicle.number}</strong>
                    <span className="detail-meta">
                      {booking.vehicle.type.toUpperCase()}
                      {booking.vehicle.model && ` - ${booking.vehicle.model}`}
                    </span>
                  </div>
                </div>
                
                <div className="detail-row">
                  <Phone size={18} color="#FF6B35" />
                  <div>
                    <strong>{booking.customer.name}</strong>
                    <span className="detail-meta">{booking.customer.phone}</span>
                  </div>
                </div>

                {booking.location.venue && (
                  <div className="detail-row">
                    <MapPin size={18} color="#FF6B35" />
                    <span>{booking.location.venue}</span>
                  </div>
                )}
              </div>

              {booking.status === 'parked' && (
                <div className="action-section">
                  <button
                    className="action-btn primary"
                    onClick={() => handleRecallCar(booking._id)}
                  >
                    🚗 Recall Car
                  </button>
                </div>
              )}

              {booking.status === 'recall-requested' && (
                <div className="action-section">
                  <AlertCircle size={20} color="#F59E0B" />
                  <p className="action-title">Customer requested recall!</p>
                  {selectedBooking === booking._id ? (
                    <div className="action-form">
                      <input
                        type="number"
                        placeholder="Estimated arrival (minutes)"
                        value={estimatedTime}
                        onChange={(e) => setEstimatedTime(e.target.value)}
                        min="1"
                      />
                      <div className="action-buttons">
                        <button
                          className="action-btn primary"
                          onClick={() => handleEstimateArrival(booking._id)}
                        >
                          Confirm
                        </button>
                        <button
                          className="action-btn secondary"
                          onClick={() => setSelectedBooking(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="action-btn primary"
                      onClick={() => setSelectedBooking(booking._id)}
                    >
                      Set Arrival Time
                    </button>
                  )}
                </div>
              )}

              {booking.status === 'in-transit' && (
                <div className="action-section">
                  <p className="action-title">
                    ETA: {booking.recall?.estimatedArrival} minutes
                  </p>
                  <button
                    className="action-btn primary"
                    onClick={() => handleMarkArrived(booking._id)}
                  >
                    Mark as Arrived
                  </button>
                </div>
              )}

              {booking.status === 'arrived' && (
                <div className="action-section">
                  <p className="action-title">
                    Car arrived. Ask customer for OTP.
                  </p>
                  {booking.paymentStatus === 'paid' ? (
                    <div className="payment-completed-info">
                      <p style={{ color: '#10B981', fontWeight: '600', marginBottom: '10px' }}>
                        ✓ Payment already collected: ₹{booking.payment?.amount} ({booking.payment?.method})
                      </p>
                      {selectedBooking === booking._id ? (
                        <div className="action-form">
                          <input
                            type="text"
                            placeholder="Enter OTP from customer"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength="6"
                          />
                          <div className="action-buttons">
                            <button
                              className="action-btn primary"
                              onClick={() => handleCompleteBooking(booking._id)}
                            >
                              Complete Booking
                            </button>
                            <button
                              className="action-btn secondary"
                              onClick={() => setSelectedBooking(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="action-btn primary"
                          onClick={() => setSelectedBooking(booking._id)}
                        >
                          Complete Booking
                        </button>
                      )}
                    </div>
                  ) : (
                    selectedBooking === booking._id ? (
                      <div className="action-form">
                        <input
                          type="text"
                          placeholder="Enter OTP from customer"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength="6"
                        />
                        <input
                          type="number"
                          placeholder="Amount (₹)"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          min="0"
                        />
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <option value="cash">Cash</option>
                          <option value="qr">QR Code</option>
                        </select>
                        <div className="action-buttons">
                          <button
                            className="action-btn primary"
                            onClick={() => handleCompleteBooking(booking._id)}
                          >
                            Complete Booking
                          </button>
                          <button
                            className="action-btn secondary"
                            onClick={() => setSelectedBooking(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="action-btn primary"
                        onClick={() => setSelectedBooking(booking._id)}
                      >
                        Complete Booking
                      </button>
                    )
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
        </div>
          )}
        </>
      )}

      {/* Completed Bookings */}
      {activeTab === 'completed' && (
        <>
          {completedBookings.length === 0 ? (
            <div className="empty-state">
              <Car size={80} color="#CCC" />
              <h3>No completed bookings</h3>
              <p>Completed bookings will appear here</p>
            </div>
          ) : (
            <div className="bookings-grid">
              {completedBookings.map((booking) => (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="booking-card completed"
                >
                  <div className="booking-header">
                    <h3>{booking.bookingId}</h3>
                    <span className="status-badge" style={{ backgroundColor: '#6B7280' }}>
                      COMPLETED
                    </span>
                  </div>
                  <div className="booking-info">
                    <div className="info-row">
                      <Car size={18} />
                      <span>{booking.vehicle.number} - {booking.vehicle.type}</span>
                    </div>
                    <div className="info-row">
                      <Phone size={18} />
                      <span>{booking.customer.name} - {booking.customer.phone}</span>
                    </div>
                    {booking.location?.venue && (
                      <div className="info-row">
                        <MapPin size={18} />
                        <span>{booking.location.venue}</span>
                      </div>
                    )}
                    {booking.payment && (
                      <div className="info-row">
                        <span>💰 ₹{booking.payment.amount} ({booking.payment.method})</span>
                      </div>
                    )}
                    <div className="info-row">
                      <Clock size={18} />
                      <span>Completed: {new Date(booking.payment?.paidAt || booking.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default MyBookings;
